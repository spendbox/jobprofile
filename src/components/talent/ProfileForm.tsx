'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SkillTag } from '@/components/ui/SkillTag'
import { TIMEZONES } from '@/types'
import type { TalentProfile, AvailabilityStatus, PortfolioItem, CVData } from '@/types'

interface ProfileFormProps {
  userId: string
  existing?: TalentProfile
  onSaved: (profile: TalentProfile) => void
  onCancel: () => void
}

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; desc: string }[] = [
  { value: 'available', label: 'Available Now', desc: 'Actively looking, available immediately' },
  { value: 'open', label: 'Open to Offers', desc: 'Employed but open to the right opportunity' },
  { value: 'not_looking', label: 'Not Looking', desc: 'Not seeking new opportunities right now' },
]

const STEP_LABELS = ['The Role', 'Skills', 'Availability', 'Portfolio & CV']

const PORTFOLIO_TYPE_ICON: Record<string, React.ReactNode> = {
  image: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" /></svg>,
  document: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" /></svg>,
  link: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
  video: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
}

export function ProfileForm({ userId, existing, onSaved, onCancel }: ProfileFormProps) {
  const supabase = createClient()
  const cvFileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')

  // Portfolio items
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])

  // CV state
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvData, setCvData] = useState<CVData | null>(existing?.cv_data ?? null)
  const [cvFilePath, setCvFilePath] = useState(existing?.cv_file_path ?? '')
  const [cvParsing, setCvParsing] = useState(false)
  const [cvParseError, setCvParseError] = useState('')
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])
  const [cvUploading, setCvUploading] = useState(false)

  const [form, setForm] = useState({
    role_title: existing?.role_title ?? '',
    bio: existing?.bio ?? '',
    skills: existing?.skills ?? ([] as string[]),
    years_experience: existing?.years_experience ?? 0,
    timezone: existing?.timezone ?? 'UTC',
    availability_status: (existing?.availability_status ?? 'open') as AvailabilityStatus,
    portfolio_item_ids: existing?.portfolio_item_ids ?? ([] as string[]),
  })

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  useEffect(() => {
    supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setPortfolioItems(data as PortfolioItem[]) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !form.skills.includes(trimmed)) set('skills', [...form.skills, trimmed])
    setSkillInput('')
  }

  const removeSkill = (skill: string) =>
    set('skills', form.skills.filter((s) => s !== skill))

  const togglePortfolioItem = (id: string) => {
    const current = form.portfolio_item_ids
    set('portfolio_item_ids', current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  }

  const handleCvSelect = async (file: File) => {
    setCvFile(file)
    setCvParseError('')
    setSuggestedSkills([])
    setCvData(null)
    setCvParsing(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/cv/parse', { method: 'POST', body: fd })
      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg ?? 'Parsing failed')
      }
      const { cv_data, suggested_skills } = await res.json()
      setCvData(cv_data)
      setSuggestedSkills((suggested_skills as string[]).filter((s) => !form.skills.includes(s)))
    } catch (err) {
      setCvParseError(err instanceof Error ? err.message : 'Could not parse CV')
    } finally {
      setCvParsing(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.role_title.trim()) { setError('Role title is required'); setStep(1); return }
    setLoading(true)
    setError('')

    try {
      let finalCvFilePath = cvFilePath

      // Upload CV file if new one selected
      if (cvFile && cvData) {
        setCvUploading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        const ext = cvFile.name.split('.').pop()
        const path = `${userId}/cv_${Date.now()}.${ext}`
        const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/portfolio/${path}`

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', uploadUrl)
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
          xhr.setRequestHeader('Content-Type', cvFile.type || 'application/octet-stream')
          xhr.setRequestHeader('x-upsert', 'true')
          xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`))
          xhr.onerror = () => reject(new Error('Network error'))
          xhr.send(cvFile)
        })
        finalCvFilePath = path
        setCvUploading(false)
      }

      const payload = {
        user_id: userId,
        role_title: form.role_title.trim(),
        bio: form.bio.trim() || null,
        skills: form.skills,
        years_experience: Number(form.years_experience),
        timezone: form.timezone || null,
        availability_status: form.availability_status,
        portfolio_item_ids: form.portfolio_item_ids,
        cv_data: cvData ?? null,
        cv_file_path: finalCvFilePath || null,
        availability_updated_at: new Date().toISOString(),
      }

      let data, dbError
      if (existing?.id) {
        ;({ data, error: dbError } = await supabase.from('profiles').update(payload).eq('id', existing.id).select('*').single())
      } else {
        ;({ data, error: dbError } = await supabase.from('profiles').insert(payload).select('*').single())
      }

      if (dbError) { setError(dbError.message); return }
      onSaved(data as TalentProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setCvUploading(false)
    }
  }

  const advance = () => {
    if (step === 1 && !form.role_title.trim()) { setError('Role title is required'); return }
    setError('')
    setStep((s) => (s + 1) as 1 | 2 | 3 | 4)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky header */}
      <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-4 sticky top-0 bg-white z-10">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-slate-500">
              Step {step} of {STEP_LABELS.length} · {STEP_LABELS[step - 1]}
            </p>
            <p className="text-xs font-bold text-slate-900">
              {existing?.id ? 'Edit Profile' : 'New Profile'}
            </p>
          </div>
          <div className="flex gap-1">
            {STEP_LABELS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-indigo-600' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>
        )}

        {/* ── Step 1: The Role ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">What role are you offering?</h2>
              <p className="text-sm text-slate-500">This is the headline employers see on your profile card.</p>
            </div>
            <div>
              <label className="label">Role Title *</label>
              <input
                className="input-base text-base"
                placeholder="e.g. Frontend Developer, Virtual Assistant…"
                value={form.role_title}
                onChange={(e) => set('role_title', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && form.role_title.trim()) advance() }}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Professional Bio <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                className="input-base resize-none"
                rows={5}
                placeholder="A short intro about your experience and what you bring to the table…"
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Skills ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">What are your skills?</h2>
              <p className="text-sm text-slate-500">Add keywords employers can search for.</p>
            </div>
            <div>
              <label className="label">Skills</label>
              <div className="flex gap-2">
                <input
                  className="input-base"
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  autoFocus
                />
                <button type="button" onClick={addSkill} className="btn-secondary px-3 py-2 flex-shrink-0">Add</button>
              </div>
              {form.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {form.skills.map((s) => <SkillTag key={s} skill={s} onRemove={() => removeSkill(s)} />)}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">No skills added yet.</p>
              )}
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input
                type="number" min={0} max={50}
                className="input-base"
                value={form.years_experience}
                onChange={(e) => set('years_experience', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Availability ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">What&apos;s your availability?</h2>
              <p className="text-sm text-slate-500">Employers see this on your profile card.</p>
            </div>
            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    form.availability_status === value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio" name="availability_status" value={value}
                    checked={form.availability_status === value}
                    onChange={() => set('availability_status', value)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="label">Timezone</label>
              <select className="input-base" value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 4: Portfolio & CV ─────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Portfolio &amp; CV</h2>
              <p className="text-sm text-slate-500">Pick work samples and attach a CV for this profile.</p>
            </div>

            {/* Portfolio picker */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">Work Samples</label>
                <Link href="/dashboard/talent/portfolio" target="_blank" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Manage Portfolio ↗
                </Link>
              </div>

              {portfolioItems.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center">
                  <p className="text-sm text-slate-500 mb-3">No portfolio items yet.</p>
                  <Link href="/dashboard/talent/portfolio" target="_blank" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    Add items to your portfolio →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {portfolioItems.map((item) => {
                    const checked = form.portfolio_item_ids.includes(item.id)
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          checked ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePortfolioItem(item.id)}
                          className="accent-indigo-600 flex-shrink-0"
                        />
                        <span className="text-slate-400 flex-shrink-0">{PORTFOLIO_TYPE_ICON[item.type]}</span>
                        <span className="text-xs font-medium text-slate-800 truncate">{item.label}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              {form.portfolio_item_ids.length > 0 && (
                <p className="text-xs text-indigo-600 font-medium mt-2">{form.portfolio_item_ids.length} item{form.portfolio_item_ids.length !== 1 ? 's' : ''} selected</p>
              )}
            </div>

            {/* CV upload & parse */}
            <div>
              <label className="label mb-3">CV / Resume</label>

              {cvData ? (
                /* Parsed CV preview */
                <div className="border border-emerald-200 bg-emerald-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-bold text-emerald-800">CV parsed successfully</span>
                    </div>
                    <button
                      onClick={() => { setCvData(null); setCvFile(null); setSuggestedSkills([]); if (cvFileRef.current) cvFileRef.current.value = '' }}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Replace
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Experience', count: cvData.experience.length },
                      { label: 'Education', count: cvData.education.length },
                      { label: 'Certifications', count: cvData.certifications.length },
                    ].map(({ label, count }) => (
                      <div key={label} className="bg-white rounded-xl py-2.5 px-2 border border-emerald-100">
                        <p className="text-lg font-black text-slate-900">{count}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>

                  {cvData.summary && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-white rounded-xl p-3 border border-emerald-100">
                      {cvData.summary}
                    </p>
                  )}

                  {/* Suggested skills to add */}
                  {suggestedSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1.5">Skills found in CV — click to add:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedSkills.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => {
                              if (!form.skills.includes(skill)) set('skills', [...form.skills, skill])
                              setSuggestedSkills((prev) => prev.filter((s) => s !== skill))
                            }}
                            className="text-xs px-2.5 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-full hover:bg-indigo-50 transition-colors font-medium"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : cvParsing ? (
                <div className="border border-slate-200 rounded-2xl p-6 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-600 font-medium">Parsing CV with AI…</p>
                  <p className="text-xs text-slate-400 mt-1">This takes a few seconds</p>
                </div>
              ) : (
                <div>
                  <input
                    ref={cvFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCvSelect(f) }}
                  />
                  {cvFilePath && !cvFile ? (
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-3">
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25" />
                      </svg>
                      <span className="text-sm text-slate-700 flex-1">CV attached</span>
                      <button onClick={() => { setCvFilePath(''); setCvData(null) }} className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">Remove</button>
                    </div>
                  ) : null}
                  <button onClick={() => cvFileRef.current?.click()} className="btn-secondary w-full">
                    {cvFilePath ? 'Replace CV (PDF or DOCX)' : 'Upload CV (PDF or DOCX)'}
                  </button>
                  <p className="text-xs text-slate-400 text-center mt-1.5">AI will extract your experience, education, and skills</p>
                  {cvParseError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">{cvParseError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="border-t border-slate-100 px-5 py-4 flex items-center gap-3 sticky bottom-0 bg-white">
        {step > 1 ? (
          <button onClick={() => { setError(''); setStep((s) => (s - 1) as 1 | 2 | 3 | 4) }} className="btn-secondary">
            Back
          </button>
        ) : (
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
        )}
        {step < 4 ? (
          <button onClick={advance} className="btn-primary flex-1">Continue</button>
        ) : (
          <button onClick={handleSubmit} disabled={loading || cvParsing || cvUploading} className="btn-primary flex-1">
            {loading || cvUploading ? 'Saving…' : existing?.id ? 'Save Changes' : 'Create Profile'}
          </button>
        )}
      </div>
    </div>
  )
}
