import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle,
  TabStopType, LeaderType, convertInchesToTwip,
  UnderlineType,
} from 'docx'

export interface CVBuilderData {
  targetRole?: string
  contactInfo?: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
  }
  summary?: string
  experience?: Array<{
    title: string
    company: string
    location?: string
    startDate: string
    endDate: string
    bullets: string[]
  }>
  education?: Array<{
    degree: string
    school: string
    location?: string
    endDate: string
  }>
  skills?: string[]
  certifications?: string[]
  projects?: Array<{
    name: string
    description: string
    technologies?: string[]
    url?: string
  }>
  languages?: string[]
}

const BRAND_COLOR = '1e293b' // slate-900
const ACCENT = '334155'       // slate-700
const MUTED = '64748b'        // slate-500
const DIVIDER = 'e2e8f0'      // slate-200

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 20,
        color: BRAND_COLOR,
        font: 'Calibri',
      }),
    ],
    spacing: { before: 200, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: DIVIDER },
    },
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 19, color: ACCENT, font: 'Calibri' })],
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.15) },
  })
}

function jobEntry(
  title: string, company: string, dates: string,
  location?: string, bullets?: string[]
): Paragraph[] {
  const paras: Paragraph[] = []

  // Title + dates on same line via tab
  paras.push(new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: convertInchesToTwip(6.5), leader: LeaderType.NONE }],
    children: [
      new TextRun({ text: title, bold: true, size: 20, color: BRAND_COLOR, font: 'Calibri' }),
      new TextRun({ text: '\t', font: 'Calibri' }),
      new TextRun({ text: dates, size: 19, color: MUTED, font: 'Calibri' }),
    ],
    spacing: { before: 160, after: 20 },
  }))

  // Company + location
  paras.push(new Paragraph({
    children: [
      new TextRun({ text: company, italics: true, size: 19, color: ACCENT, font: 'Calibri' }),
      ...(location ? [new TextRun({ text: `  ·  ${location}`, size: 18, color: MUTED, font: 'Calibri' })] : []),
    ],
    spacing: { before: 0, after: 60 },
  }))

  for (const b of (bullets ?? [])) {
    paras.push(bullet(b))
  }

  return paras
}

function educationEntry(degree: string, school: string, endDate: string, location?: string): Paragraph[] {
  return [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: convertInchesToTwip(6.5), leader: LeaderType.NONE }],
      children: [
        new TextRun({ text: degree, bold: true, size: 20, color: BRAND_COLOR, font: 'Calibri' }),
        new TextRun({ text: '\t', font: 'Calibri' }),
        new TextRun({ text: endDate, size: 19, color: MUTED, font: 'Calibri' }),
      ],
      spacing: { before: 120, after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: school, italics: true, size: 19, color: ACCENT, font: 'Calibri' }),
        ...(location ? [new TextRun({ text: `  ·  ${location}`, size: 18, color: MUTED, font: 'Calibri' })] : []),
      ],
      spacing: { before: 0, after: 60 },
    }),
  ]
}

export async function generateCVDocx(cv: CVBuilderData): Promise<Buffer> {
  const name = cv.contactInfo?.name ?? 'Your Name'
  const title = cv.targetRole ?? ''

  const contactParts = [
    cv.contactInfo?.email,
    cv.contactInfo?.phone,
    cv.contactInfo?.location,
    cv.contactInfo?.linkedin,
    cv.contactInfo?.website,
  ].filter(Boolean)

  const children: Paragraph[] = []

  // ── Name ──────────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [new TextRun({ text: name, bold: true, size: 40, color: BRAND_COLOR, font: 'Calibri' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
  }))

  // ── Target role / headline ─────────────────────────────────────────────────
  if (title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: title, size: 22, color: ACCENT, font: 'Calibri', italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
    }))
  }

  // ── Contact line ───────────────────────────────────────────────────────────
  if (contactParts.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: contactParts.join('  |  '),
        size: 17,
        color: MUTED,
        font: 'Calibri',
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: DIVIDER } },
    }))
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  if (cv.summary) {
    children.push(sectionHeading('Professional Summary'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.summary, size: 19, color: ACCENT, font: 'Calibri' })],
      spacing: { before: 60, after: 60 },
    }))
  }

  // ── Experience ─────────────────────────────────────────────────────────────
  if (cv.experience && cv.experience.length > 0) {
    children.push(sectionHeading('Work Experience'))
    for (const exp of cv.experience) {
      const dates = `${exp.startDate} – ${exp.endDate}`
      children.push(...jobEntry(exp.title, exp.company, dates, exp.location, exp.bullets))
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (cv.education && cv.education.length > 0) {
    children.push(sectionHeading('Education'))
    for (const edu of cv.education) {
      children.push(...educationEntry(edu.degree, edu.school, edu.endDate, edu.location))
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  if (cv.skills && cv.skills.length > 0) {
    children.push(sectionHeading('Skills'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.skills.join('  ·  '), size: 19, color: ACCENT, font: 'Calibri' })],
      spacing: { before: 60, after: 60 },
    }))
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (cv.projects && cv.projects.length > 0) {
    children.push(sectionHeading('Projects'))
    for (const proj of cv.projects) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: proj.name, bold: true, size: 20, color: BRAND_COLOR, font: 'Calibri' }),
          ...(proj.technologies?.length
            ? [new TextRun({ text: `  ·  ${proj.technologies.join(', ')}`, size: 18, color: MUTED, font: 'Calibri' })]
            : []),
        ],
        spacing: { before: 120, after: 30 },
      }))
      children.push(new Paragraph({
        children: [new TextRun({ text: proj.description, size: 19, color: ACCENT, font: 'Calibri' })],
        spacing: { before: 0, after: 40 },
      }))
      if (proj.url) {
        children.push(new Paragraph({
          children: [new TextRun({ text: proj.url, size: 17, color: MUTED, font: 'Calibri', underline: { type: UnderlineType.SINGLE } })],
          spacing: { before: 0, after: 60 },
        }))
      }
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────
  if (cv.certifications && cv.certifications.length > 0) {
    children.push(sectionHeading('Certifications'))
    for (const cert of cv.certifications) {
      children.push(bullet(cert))
    }
  }

  // ── Languages ────────────────────────────────────────────────────────────
  if (cv.languages && cv.languages.length > 0) {
    children.push(sectionHeading('Languages'))
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.languages.join('  ·  '), size: 19, color: ACCENT, font: 'Calibri' })],
      spacing: { before: 60, after: 60 },
    }))
  }

  const doc = new Document({
    creator: 'Folio',
    title: `CV – ${name}`,
    description: `CV generated by Folio for ${name}`,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: ACCENT },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left: convertInchesToTwip(0.85),
            right: convertInchesToTwip(0.85),
          },
        },
      },
      children,
    }],
  })

  return Packer.toBuffer(doc)
}
