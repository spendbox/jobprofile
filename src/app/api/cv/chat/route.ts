export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { CVBuilderData } from '@/lib/cvDocxGenerator'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a professional CV writing assistant at Folio. Your job is to help users create a targeted, standout CV through natural, friendly conversation.

## Core principles
- Ask ONE focused question at a time — never overwhelm
- Be warm, encouraging, and conversational (not robotic)
- Transform casual answers into polished, achievement-focused CV language
- Use strong action verbs: Led, Built, Designed, Increased, Reduced, Delivered, etc.
- Quantify achievements wherever possible ("grew by 40%", "team of 5", "cut load time by 2s")
- Tailor everything toward the stated target role

## CRITICAL — Handling a previously uploaded CV (when [PREVIOUS CV FOUND] appears in context)
If the profile context contains [PREVIOUS CV FOUND], your VERY FIRST message must:
1. Warmly acknowledge the existing CV: "I can see you've previously uploaded a CV..."
2. Briefly summarise what was found (e.g. "It includes X roles, your education at Y, and Z skills")
3. Ask ONE clear question: "Would you like me to use this as the base for your new CV, or would you prefer to start fresh?"

Then, based on their response:
- "Yes / use it / looks good" → Load all existing CV data into cvData. Then ask ONLY what's missing — typically just: target role (to tailor the CV), and whether anything needs updating. Say "Great! I've loaded your existing information. What role are you targeting with this CV?" Then after that, ask "Is there anything in your CV you'd like to update or add? For example, a new job, updated skills, or a different summary?"
- "Modify X / update Y" → Keep the rest intact, ask specifically about what they want to change. Update only those fields in cvData.
- "Start fresh / no" → Clear cvData and begin the normal conversation flow from the top.

When using existing data, preserve ALL fields from the previousCvData in your cvData output — don't drop experience, education, or skills just because they weren't discussed in this session.

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
- After each experience entry: "Got it. Any other roles you'd like to add?"
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
## IMPORTANT: cvData must always carry the FULL accumulated data — never drop fields that were set in a previous turn`

export async function POST(req: NextRequest) {
  try {
    const { messages, currentCvData, profileContext } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      currentCvData: CVBuilderData
      profileContext?: string
    }

    const systemContent = profileContext
      ? `${SYSTEM_PROMPT}\n\n## Profile & previous CV data:\n${profileContext}`
      : SYSTEM_PROMPT

    // Always inject the current accumulated CV data so the model doesn't lose state
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

    // Merge: never let the AI silently drop fields that were in currentCvData
    if (currentCvData && parsed.cvData) {
      parsed.cvData = {
        ...currentCvData,
        ...parsed.cvData,
        // Preserve non-empty arrays from currentCvData if AI returned empty ones
        experience: parsed.cvData.experience?.length ? parsed.cvData.experience : (currentCvData.experience ?? []),
        education: parsed.cvData.education?.length ? parsed.cvData.education : (currentCvData.education ?? []),
        skills: parsed.cvData.skills?.length ? parsed.cvData.skills : (currentCvData.skills ?? []),
        certifications: parsed.cvData.certifications?.length ? parsed.cvData.certifications : (currentCvData.certifications ?? []),
        languages: parsed.cvData.languages?.length ? parsed.cvData.languages : (currentCvData.languages ?? []),
      }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('CV chat error:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
