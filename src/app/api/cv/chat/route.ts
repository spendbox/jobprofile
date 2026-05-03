export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { CVBuilderData } from '@/lib/cvDocxGenerator'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── URL detection & fetching ───────────────────────────────────────────────
const URL_RE = /https?:\/\/[^\s"'<>]+/gi

function extractUrls(text: string): string[] {
  return Array.from(new Set(text.match(URL_RE) ?? []))
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|h[1-6]|section|article|header|footer|main|nav|aside)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function fetchUrlText(url: string): Promise<{ url: string; text: string } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FolioBot/1.0; CV-builder)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) return null

    const html = await res.text()
    const text = htmlToText(html).slice(0, 6000) // cap at 6k chars per URL
    if (text.length < 50) return null // too short to be useful
    return { url, text }
  } catch {
    return null
  }
}

// ─── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional CV writing assistant at Folio. Your job is to help users create a targeted, standout CV through natural, friendly conversation.

## Core principles
- Ask ONE focused question at a time — never overwhelm
- Be warm, encouraging, and conversational (not robotic)
- Transform casual answers into polished, achievement-focused CV language
- Use strong action verbs: Led, Built, Designed, Increased, Reduced, Delivered, etc.
- Quantify achievements wherever possible ("grew by 40%", "team of 5", "cut load time by 2s")
- Tailor everything toward the stated target role

## Reading websites and URLs
If [FETCHED URL CONTENT] blocks appear in the context, you have read the page the user shared.
Extract every relevant detail: job titles, companies, employment dates, education, skills, projects, certifications, and languages.
After reading, briefly confirm what you found: "I've read your [LinkedIn / portfolio / GitHub] and found X roles and Y skills — let me fill those in."
Then ask only what's missing (e.g. target role, missing dates, achievements not listed on the page).
Never ask the user to repeat information that was clearly on the page.

## CRITICAL — Handling a previously uploaded CV (when [PREVIOUS CV FOUND] appears in context)
If the profile context contains [PREVIOUS CV FOUND], your VERY FIRST message must:
1. Warmly acknowledge the existing CV: "I can see you've previously uploaded a CV..."
2. Briefly summarise what was found (e.g. "It includes X roles, your education at Y, and Z skills")
3. Ask ONE clear question: "Would you like me to use this as the base for your new CV, or would you prefer to start fresh?"

Then, based on their response:
- "Yes / use it / looks good" → Load all existing CV data into cvData. Ask "What role are you targeting with this CV?" then "Is there anything you'd like to update or add?"
- "Modify X / update Y" → Keep the rest intact, ask specifically about what they want to change.
- "Start fresh / no" → Clear cvData and begin the normal conversation flow from the top.

When using existing data, preserve ALL fields from previousCvData in your cvData output.

## Normal conversation order (when no previous CV, or user chose to start fresh)
1. Target role (what job are they aiming for?)
2. Contact info: full name, email, phone, city/country, LinkedIn (optional), portfolio/website (optional)
3. Professional summary (you write this based on their background)
4. Work experience — for each role: job title, company, dates (month+year), key achievements. Ask "Any other roles to add?" after each.
5. Education: degree, institution, graduation year
6. Skills (technical + tools + soft skills)
7. Certifications or courses (ask once; accept "none" / "skip")
8. Projects (ask once; especially for developers/designers — accept "skip")
9. Languages (ask once; accept "skip")

## Smart behaviour
- If info is mentioned unprompted, extract it — don't ask again
- If an answer is vague, ask one targeted follow-up: "What's one achievement you're proud of from that role?"
- After each experience entry: "Got it. Any other roles to add?"
- When complete: "Your CV is ready! Hit the Download button to get your polished DOCX file."

## Output format — ALWAYS return valid JSON only, no extra text:
{
  "reply": "Your conversational message to the user",
  "cvData": {
    "targetRole": "",
    "contactInfo": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
    "summary": "",
    "experience": [{ "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": [] }],
    "education": [{ "degree": "", "school": "", "location": "", "endDate": "" }],
    "skills": [],
    "certifications": [],
    "projects": [{ "name": "", "description": "", "technologies": [], "url": "" }],
    "languages": []
  },
  "isComplete": false,
  "completionPercent": 0,
  "currentSection": "targetRole"
}

## completionPercent guide: targetRole=10, contact=25, summary=35, experience=55, education=65, skills=80, optionals=90, done=100
## currentSection values: targetRole | contact | summary | experience | education | skills | certifications | projects | languages | done
## Set isComplete:true and currentSection:"done" only when you have targetRole + name + email + summary + ≥1 experience + education + skills
## IMPORTANT: cvData must always carry the FULL accumulated data — never drop fields set in a previous turn`

// ─── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, currentCvData, profileContext } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      currentCvData: CVBuilderData
      profileContext?: string
    }

    // Detect URLs in the latest user message and fetch them server-side
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    const urls = extractUrls(lastUserMsg)
    const fetched = (await Promise.all(urls.map(fetchUrlText))).filter(Boolean) as { url: string; text: string }[]

    const urlContextBlocks = fetched.map(
      ({ url, text }) => `[FETCHED URL CONTENT from ${url}]\n${text}\n[END FETCHED CONTENT]`
    ).join('\n\n')

    const systemContent = [
      SYSTEM_PROMPT,
      profileContext ? `\n## Profile & previous CV data:\n${profileContext}` : '',
      urlContextBlocks ? `\n## Web pages you have read:\n${urlContextBlocks}` : '',
    ].filter(Boolean).join('')

    // Inject current accumulated CV data
    const contextMsg = currentCvData && Object.keys(currentCvData).length > 0
      ? `[Current accumulated CV data — preserve all fields in your response: ${JSON.stringify(currentCvData)}]`
      : null

    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...(contextMsg ? [{ role: 'system' as const, content: contextMsg }] : []),
      ...messages,
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw)

    // Merge guard: never silently drop arrays that were set in previous turns
    if (currentCvData && parsed.cvData) {
      parsed.cvData = {
        ...currentCvData,
        ...parsed.cvData,
        experience: parsed.cvData.experience?.length ? parsed.cvData.experience : (currentCvData.experience ?? []),
        education: parsed.cvData.education?.length ? parsed.cvData.education : (currentCvData.education ?? []),
        skills: parsed.cvData.skills?.length ? parsed.cvData.skills : (currentCvData.skills ?? []),
        certifications: parsed.cvData.certifications?.length ? parsed.cvData.certifications : (currentCvData.certifications ?? []),
        languages: parsed.cvData.languages?.length ? parsed.cvData.languages : (currentCvData.languages ?? []),
      }
    }

    // Tell the client which URLs were successfully read so it can show a notice
    parsed.fetchedUrls = fetched.map((f) => f.url)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('CV chat error:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
