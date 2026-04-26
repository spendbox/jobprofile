export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are a CV/resume parser. Extract structured information and return ONLY valid JSON with this exact shape:
{
  "summary": "professional summary or objective as a single string, empty string if none",
  "experience": [{"title": "job title", "company": "company name", "period": "date range e.g. Jan 2020 – Mar 2023", "bullets": ["key achievement or responsibility"]}],
  "education": [{"degree": "degree or qualification name", "school": "institution name", "period": "date range or year"}],
  "certifications": ["certification name"],
  "languages": ["language name"],
  "suggested_skills": ["skill keyword"]
}
Rules:
- Extract ALL experience entries even if dates are unclear.
- For bullets: use actual bullet points if present, otherwise write 1–2 concise points per role.
- suggested_skills: list every distinct technical skill, tool, or technology mentioned anywhere in the CV.
- All values must be strings or arrays of strings. No nulls.
- If a field has no data, use an empty array [] or empty string "".`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    let text = ''
    if (isPdf) {
      const pdfParse = (await import('pdf-parse')).default
      const result = await pdfParse(buffer)
      text = result.text
    } else {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from this file. Try a different format.' }, { status: 422 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text.slice(0, 14000) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}')
    const { suggested_skills = [], ...cv_data } = raw

    return NextResponse.json({ cv_data, suggested_skills })
  } catch (err) {
    console.error('CV parse error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Parsing failed' },
      { status: 500 }
    )
  }
}
