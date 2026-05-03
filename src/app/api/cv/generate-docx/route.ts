export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { generateCVDocx } from '@/lib/cvDocxGenerator'
import type { CVBuilderData } from '@/lib/cvDocxGenerator'

export async function POST(req: NextRequest) {
  try {
    const { cvData } = await req.json() as { cvData: CVBuilderData }

    if (!cvData) return NextResponse.json({ error: 'No CV data provided' }, { status: 400 })

    const buffer = await generateCVDocx(cvData)

    const name = cvData.contactInfo?.name?.replace(/\s+/g, '_') ?? 'CV'
    const role = cvData.targetRole?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') ?? ''
    const filename = role ? `${name}_${role}_CV.docx` : `${name}_CV.docx`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('DOCX generation error:', err)
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 })
  }
}
