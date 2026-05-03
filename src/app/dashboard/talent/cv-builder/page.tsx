'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { CVBuilderData } from '@/lib/cvDocxGenerator'
import type { TalentProfile, CVData } from '@/types'

// ─── Convert stored CVData → CVBuilderData ──────────────────────────────────
function cvDataToBuilder(cv: CVData, profile: TalentProfile): CVBuilderData {
  return {
    summary: cv.summary,
    experience: cv.experience?.map((e) => ({
      title: e.title,
      company: e.company,
      location: '',
      startDate: e.period?.split(/[-–]/, 2)[0]?.trim() ?? '',
      endDate: e.period?.split(/[-–]/).pop()?.trim() ?? 'Present',
      bullets: e.bullets ?? [],
    })) ?? [],
    education: cv.education?.map((e) => ({
      degree: e.degree,
      school: e.school,
      location: '',
      endDate: e.period?.split(/[-–]/).pop()?.trim() ?? '',
    })) ?? [],
    certifications: cv.certifications ?? [],
    languages: cv.languages ?? [],
    skills: profile.skills ?? [],
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  id: string
}

interface ChatResponse {
  reply: string
  cvData: CVBuilderData
  isComplete: boolean
  completionPercent: number
  currentSection: string
}

const SECTION_LABELS: Record<string, string> = {
  targetRole: 'Target Role',
  contact: 'Contact Info',
  summary: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  projects: 'Projects',
  languages: 'Languages',
  done: 'Complete',
}

const SECTIONS_ORDER = ['targetRole', 'contact', 'summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages', 'done']

// ─── Small UI components ────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

function SectionCheck({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors ${active ? 'bg-slate-100' : ''}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
        done ? 'bg-emerald-500' : active ? 'bg-slate-900' : 'bg-slate-200'
      }`}>
        {done ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : active ? (
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
        ) : null}
      </div>
      <span className={`text-xs font-medium ${done ? 'text-slate-500' : active ? 'text-slate-900' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function CVBuilderPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [cvData, setCvData] = useState<CVBuilderData>({})
  const [thinking, setThinking] = useState(false)
  const [currentSection, setCurrentSection] = useState('targetRole')
  const [completionPercent, setCompletionPercent] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }
  }, [userProfile, loadingAuth, router])

  // ── Build profile context for AI ────────────────────────────────────────
  const buildProfileContext = useCallback(async (): Promise<{
    context: string
    existingCv: CVBuilderData | null
  }> => {
    if (!userProfile) return { context: '', existingCv: null }
    const parts: string[] = []
    if (userProfile.full_name) parts.push(`Name: ${userProfile.full_name}`)

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) parts.push(`Email: ${user.email}`)

    // fetch most recent profile including cv_data
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role_title, skills, bio, years_experience, timezone, cv_data')
      .eq('user_id', userProfile.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    const profile = profiles?.[0] as TalentProfile | undefined
    if (profile?.role_title) parts.push(`Current role title: ${profile.role_title}`)
    if (profile?.skills?.length) parts.push(`Skills on profile: ${profile.skills.join(', ')}`)
    if (profile?.bio) parts.push(`Bio: ${profile.bio}`)
    if (profile?.years_experience) parts.push(`Years of experience: ${profile.years_experience}`)

    let existingCv: CVBuilderData | null = null

    if (profile?.cv_data) {
      const cd = profile.cv_data as CVData
      const hasContent = (cd.experience?.length ?? 0) > 0 || (cd.education?.length ?? 0) > 0
      if (hasContent) {
        existingCv = cvDataToBuilder(cd, profile)
        parts.push(`\n[PREVIOUS CV FOUND]`)
        parts.push(`Experience entries: ${cd.experience?.length ?? 0}`)
        if (cd.experience?.length) {
          parts.push(`Most recent role: ${cd.experience[0].title} at ${cd.experience[0].company}`)
        }
        parts.push(`Education entries: ${cd.education?.length ?? 0}`)
        if (cd.education?.length) {
          parts.push(`Highest qualification: ${cd.education[0].degree} from ${cd.education[0].school}`)
        }
        if (cd.certifications?.length) parts.push(`Certifications: ${cd.certifications.join(', ')}`)
        if (cd.languages?.length) parts.push(`Languages: ${cd.languages.join(', ')}`)
        parts.push(`[END PREVIOUS CV]`)
      }
    }

    return { context: parts.join('\n'), existingCv }
  }, [userProfile, supabase])

  // ── Initialize with first AI message ────────────────────────────────────
  useEffect(() => {
    if (!userProfile || initialized) return
    setInitialized(true)

    const init = async () => {
      setThinking(true)
      const { context: profileContext, existingCv } = await buildProfileContext()

      // If we found a previous CV, pre-seed the state so the panel shows data immediately
      const seedCvData = existingCv ?? {}
      if (existingCv) setCvData(existingCv)

      const openingMessage = existingCv
        ? 'Hello, I want to create a CV. I have a previously uploaded CV.'
        : 'Hello, I want to create a CV.'

      const res = await fetch('/api/cv/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: openingMessage }],
          currentCvData: seedCvData,
          profileContext,
        }),
      })

      const data: ChatResponse = await res.json()
      setThinking(false)

      if (data.reply) {
        setMessages([{ role: 'assistant', content: data.reply, id: crypto.randomUUID() }])
        if (data.cvData && Object.keys(data.cvData).length > 0) setCvData(data.cvData)
        setCurrentSection(data.currentSection ?? 'targetRole')
        setCompletionPercent(data.completionPercent ?? 0)
        setIsComplete(data.isComplete ?? false)
      }
    }

    init()
  }, [userProfile, initialized, buildProfileContext])

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || thinking) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed, id: crypto.randomUUID() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)

    const apiMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

    try {
      const { context: profileContext } = await buildProfileContext()
      const res = await fetch('/api/cv/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, currentCvData: cvData, profileContext }),
      })

      const data: ChatResponse = await res.json()
      setThinking(false)

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, id: crypto.randomUUID() }])
        if (data.cvData) setCvData(data.cvData)
        if (data.currentSection) setCurrentSection(data.currentSection)
        if (typeof data.completionPercent === 'number') setCompletionPercent(data.completionPercent)
        if (data.isComplete) setIsComplete(true)
      }
    } catch {
      setThinking(false)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Sorry, something went wrong. Please try again.",
        id: crypto.randomUUID(),
      }])
    }
  }, [messages, cvData, thinking, buildProfileContext])

  // ── Upload existing CV ───────────────────────────────────────────────────
  const handleCvUpload = async (file: File) => {
    setUploadingCv(true)
    setUploadError('')
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/cv/parse', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Failed to parse CV'); return }

      const { cv_data, suggested_skills } = data

      // Merge parsed data into CV state
      const merged: CVBuilderData = {
        ...cvData,
        summary: cv_data.summary || cvData.summary,
        experience: cv_data.experience?.map((e: { title: string; company: string; period: string; bullets: string[] }) => ({
          title: e.title,
          company: e.company,
          location: '',
          startDate: e.period?.split('–')[0]?.trim() ?? '',
          endDate: e.period?.split('–')[1]?.trim() ?? 'Present',
          bullets: e.bullets ?? [],
        })) ?? cvData.experience,
        education: cv_data.education?.map((e: { degree: string; school: string; period: string }) => ({
          degree: e.degree,
          school: e.school,
          location: '',
          endDate: e.period?.split('–').pop()?.trim() ?? '',
        })) ?? cvData.education,
        certifications: cv_data.certifications ?? cvData.certifications,
        languages: cv_data.languages ?? cvData.languages,
        skills: Array.from(new Set([...(cvData.skills ?? []), ...(suggested_skills ?? [])])),
      }
      setCvData(merged)

      // Inform the AI of the import
      await sendMessage(`I've uploaded my existing CV. Here's the data extracted: summary="${cv_data.summary}", ${cv_data.experience?.length ?? 0} experience entries, ${cv_data.education?.length ?? 0} education entries, skills: ${suggested_skills?.slice(0, 10).join(', ')}. Please continue building my targeted CV from here.`)
    } catch {
      setUploadError('Failed to read CV file.')
    } finally {
      setUploadingCv(false)
    }
  }

  // ── Download DOCX ────────────────────────────────────────────────────────
  const downloadDocx = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/cv/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData }),
      })
      if (!res.ok) { alert('Failed to generate CV. Please try again.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const name = cvData.contactInfo?.name?.replace(/\s+/g, '_') ?? 'CV'
      const role = cvData.targetRole?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') ?? ''
      a.download = role ? `${name}_${role}_CV.docx` : `${name}_CV.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  // ── Keyboard shortcut ────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (loadingAuth || !userProfile) {
    return <div className="page-container flex items-center justify-center min-h-64"><div className="text-sm text-slate-500">Loading…</div></div>
  }

  const doneIndex = SECTIONS_ORDER.indexOf(currentSection)

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/talent" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 text-sm leading-none">AI CV Builder</h1>
            {cvData.targetRole && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{cvData.targetRole}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile preview toggle */}
          <button
            onClick={() => setShowMobilePreview((v) => !v)}
            className="md:hidden flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Progress
          </button>

          {isComplete && (
            <button
              onClick={downloadDocx}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {downloading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {downloading ? 'Generating…' : 'Download CV'}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile progress panel ───────────────────────────────────────── */}
      {showMobilePreview && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
          <ProgressPanel
            cvData={cvData}
            currentSection={currentSection}
            completionPercent={completionPercent}
            isComplete={isComplete}
            doneIndex={doneIndex}
            onDownload={downloadDocx}
            downloading={downloading}
          />
        </div>
      )}

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chat panel ───────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'assistant'
                      ? 'bg-white border border-slate-200 rounded-2xl rounded-bl-sm text-slate-700'
                      : 'bg-slate-900 text-white rounded-2xl rounded-br-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {thinking && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>

          {/* ── Input area ─────────────────────────────────────────────── */}
          <div className="border-t border-slate-200 bg-white px-3 py-3 flex-shrink-0">
            {uploadError && (
              <p className="text-xs text-red-500 mb-2 px-1">{uploadError}</p>
            )}
            <div className="flex items-end gap-2">
              {/* Upload CV button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingCv || thinking}
                title="Upload existing CV (PDF or DOCX)"
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-40"
              >
                {uploadingCv ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleCvUpload(file)
                  e.target.value = ''
                }}
              />

              {/* Text input */}
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                }}
                onKeyDown={handleKeyDown}
                placeholder={thinking ? 'AI is typing…' : 'Type your answer… (Enter to send)'}
                disabled={thinking}
                className="flex-1 resize-none bg-slate-100 rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all disabled:opacity-50 min-h-[40px] max-h-[120px]"
                style={{ height: '40px' }}
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || thinking}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-700 text-white transition-colors disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 px-1">
              Shift+Enter for new line · Upload your existing CV to import it
            </p>
          </div>
        </div>

        {/* ── Desktop side panel ───────────────────────────────────────── */}
        <div className="hidden md:flex flex-col w-72 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">CV Progress</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your CV builds as you chat</p>
          </div>
          <div className="p-4 flex-1">
            <ProgressPanel
              cvData={cvData}
              currentSection={currentSection}
              completionPercent={completionPercent}
              isComplete={isComplete}
              doneIndex={doneIndex}
              onDownload={downloadDocx}
              downloading={downloading}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Progress panel (shared between mobile/desktop) ─────────────────────────
function ProgressPanel({
  cvData, currentSection, completionPercent, isComplete, doneIndex, onDownload, downloading,
}: {
  cvData: CVBuilderData
  currentSection: string
  completionPercent: number
  isComplete: boolean
  doneIndex: number
  onDownload: () => void
  downloading: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-slate-700">
            {isComplete ? 'CV complete!' : `${completionPercent}% complete`}
          </span>
          <span className="text-xs text-slate-400">{isComplete ? '✓' : `${completionPercent}/100`}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 rounded-full transition-all duration-700"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Section checklist */}
      <div className="space-y-0.5">
        {SECTIONS_ORDER.filter((s) => s !== 'done').map((section, i) => (
          <SectionCheck
            key={section}
            label={SECTION_LABELS[section]}
            done={i < doneIndex}
            active={section === currentSection}
          />
        ))}
      </div>

      {/* CV data preview */}
      {(cvData.targetRole || cvData.contactInfo?.name) && (
        <div className="border border-slate-100 rounded-xl p-3 space-y-2 bg-slate-50">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Collected so far</p>
          {cvData.contactInfo?.name && (
            <PreviewItem icon="person" label={cvData.contactInfo.name} />
          )}
          {cvData.targetRole && (
            <PreviewItem icon="target" label={cvData.targetRole} />
          )}
          {cvData.experience?.length ? (
            <PreviewItem icon="briefcase" label={`${cvData.experience.length} role${cvData.experience.length > 1 ? 's' : ''}`} />
          ) : null}
          {cvData.education?.length ? (
            <PreviewItem icon="education" label={cvData.education[0].degree} />
          ) : null}
          {cvData.skills?.length ? (
            <PreviewItem icon="skills" label={`${cvData.skills.length} skills`} />
          ) : null}
        </div>
      )}

      {/* Download button */}
      {isComplete && (
        <button
          onClick={onDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {downloading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating DOCX…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CV (DOCX)
            </>
          )}
        </button>
      )}

      {/* Restart hint */}
      {!isComplete && completionPercent > 0 && (
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Keep answering the questions above. Your CV is being built in real-time.
        </p>
      )}
    </div>
  )
}

const PREVIEW_ICONS: Record<string, React.ReactNode> = {
  person: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  target: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  education: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  skills: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
}

function PreviewItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 flex-shrink-0">{PREVIEW_ICONS[icon]}</span>
      <span className="text-xs text-slate-600 truncate">{label}</span>
    </div>
  )
}
