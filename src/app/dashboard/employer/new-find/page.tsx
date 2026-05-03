'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { useAuth } from '@/contexts/AuthContext'
import { SkillTag } from '@/components/ui/SkillTag'
import { createClient } from '@/lib/supabase/client'
import type { EmploymentType, WorkArrangement } from '@/types'
import { EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'
import { COUNTRIES } from '@/lib/countries'
import { COMMON_SKILLS } from '@/lib/skills'
import { getSuggestedSkills } from '@/lib/roleSkills'
import { getSuggestedQuestions } from '@/lib/roleQuestions'

const EMPLOYMENT_TYPES: EmploymentType[] = ['fulltime', 'parttime', 'contract', 'volunteer', 'internship']
const WORK_ARRANGEMENTS: WorkArrangement[] = ['remote', 'hybrid', 'onsite']
const MAX_QUESTIONS = 5
const TOTAL_STEPS = 3

const STEP_LABELS = ['Role', 'Requirements', 'Details & Questions']

export default function NewTalentFindPage() {
  const router = useRouter()
  const { userProfile, loadingAuth } = useAuth()
  const supabase = createClient()

  const [step, setStep] = useState(1)

  // Step 1 — Role
  const [roleTitle, setRoleTitle] = useState('')
  const [roleTitles, setRoleTitles] = useState<string[]>([])
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)
  const [employmentType, setEmploymentType] = useState<EmploymentType>('fulltime')
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement>('remote')
  const [hiringCountry, setHiringCountry] = useState('')
  const [hiringState, setHiringState] = useState('')

  // Step 2 — Requirements
  const [minExp, setMinExp] = useState('')
  const [maxExp, setMaxExp] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([])
  const [roleSkillSuggestions, setRoleSkillSuggestions] = useState<string[]>([])
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')

  // Step 3 — Details & Questions
  const [description, setDescription] = useState('')
  const [requirementsText, setRequirementsText] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [newQuestion, setNewQuestion] = useState('')
  const [questionSuggestions, setQuestionSuggestions] = useState<string[]>([])

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState('')
  const [showPaymentGate, setShowPaymentGate] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    if (!loadingAuth && !userProfile) router.push('/auth/login')
    if (userProfile?.user_role === 'talent') router.push('/dashboard/talent')
  }, [userProfile, loadingAuth, router])

  useEffect(() => {
    // Pre-fill hiring location from company HQ if available
    if (userProfile?.company_hq_country && !hiringCountry) setHiringCountry(userProfile.company_hq_country)
    if (userProfile?.company_hq_state && !hiringState) setHiringState(userProfile.company_hq_state)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile])

  useEffect(() => {
    supabase.from('role_titles').select('title').order('title').then(({ data }) => {
      if (data) setRoleTitles(data.map((r) => r.title))
    })
  }, [supabase])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const applyRoleSuggestions = (title: string) => {
    const suggested = getSuggestedSkills(title, skills)
    setRoleSkillSuggestions(suggested)
  }

  const addSkill = (value?: string) => {
    const t = (value ?? skillInput).trim()
    if (t && !skills.includes(t)) {
      setSkills((s) => [...s, t])
      setRoleSkillSuggestions((prev) => prev.filter((s) => s !== t))
    }
    setSkillInput('')
    setSkillSuggestions([])
  }

  const handleSkillInputChange = (val: string) => {
    setSkillInput(val)
    if (val.trim().length >= 2) {
      const lower = val.toLowerCase()
      setSkillSuggestions(
        COMMON_SKILLS.filter((s) => s.toLowerCase().includes(lower) && !skills.includes(s)).slice(0, 6)
      )
    } else {
      setSkillSuggestions([])
    }
  }

  const addQuestion = (q?: string) => {
    const t = (q ?? newQuestion).trim()
    if (t && questions.length < MAX_QUESTIONS && !questions.includes(t)) {
      setQuestions((prev) => [...prev, t])
      setQuestionSuggestions((prev) => prev.filter((s) => s !== t))
      if (!q) setNewQuestion('')
    }
  }

  const validateStep = (): string => {
    if (step === 1) {
      if (!roleTitle.trim()) return 'Role title is required.'
      if (!hiringCountry) return 'Please select a hiring country.'
      if (!hiringState.trim()) return 'Please enter a state or region.'
    }
    if (step === 2) {
      if (!minExp) return 'Please enter a minimum experience level.'
      if (!maxExp) return 'Please enter a maximum experience level.'
      if (skills.length === 0) return 'Please add at least one required skill.'
      if (!salaryMin) return 'Please enter a minimum salary.'
      if (!salaryMax) return 'Please enter a maximum salary.'
    }
    if (step === 3) {
      if (description.trim().length < 30) return 'Job description must be at least 30 characters.'
      if (requirementsText.trim().length < 20) return 'Requirements must be at least 20 characters.'
    }
    return ''
  }

  const next = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    const nextStep = Math.min(step + 1, TOTAL_STEPS)
    if (nextStep === 2 && roleSkillSuggestions.length === 0) applyRoleSuggestions(roleTitle)
    if (nextStep === 3) setQuestionSuggestions(getSuggestedQuestions(roleTitle, questions))
    setStep(nextStep)
  }

  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 1)) }

  const buildPayload = () => ({
    role_title: roleTitle.trim(),
    employment_type: employmentType,
    work_arrangement: workArrangement,
    hiring_country: hiringCountry || null,
    hiring_state: hiringState.trim() || null,
    min_experience: minExp ? Number(minExp) : null,
    max_experience: maxExp ? Number(maxExp) : null,
    skills,
    salary_min: salaryMin ? Number(salaryMin) : null,
    salary_max: salaryMax ? Number(salaryMax) : null,
    description: description.trim(),
    requirements_text: requirementsText.trim() || null,
    custom_questions: questions,
  })

  const doSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/talent-finds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setSubmitting(false); return }
      router.push(`/dashboard/employer/pipeline/${json.talent_find_id}`)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setShowPaymentGate(true)
  }

  const handlePayAndCreate = async () => {
    if (!userProfile) { setPaymentError('Not signed in. Please refresh.'); return }
    if (!(window as Window & { PaystackPop?: unknown }).PaystackPop) { setPaymentError('Payment system not loaded. Please refresh.'); return }
    setPaymentLoading(true)
    setPaymentError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email
    if (!email) { setPaymentError('Email not found. Please refresh.'); setPaymentLoading(false); return }
    const ref = `folio-pipeline-${userProfile.id}-${Date.now()}`
    const paystackWindow = window as Window & { PaystackPop: { setup: (opts: Record<string, unknown>) => { openIframe: () => void } } }
    const handler = paystackWindow.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '',
      email,
      amount: 20000, // $200 USD in cents
      currency: 'USD',
      ref,
      metadata: { user_id: userProfile.id, type: 'pipeline_creation' },
      callback: async (response: { reference: string }) => {
        try {
          const res = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: response.reference }),
          })
          if (res.ok) {
            setShowPaymentGate(false)
            await doSubmit()
          } else {
            setPaymentError('Payment could not be verified. Please contact support.')
          }
        } catch {
          setPaymentError('Network error verifying payment. Please contact support.')
        } finally {
          setPaymentLoading(false)
        }
      },
      onClose: () => { setPaymentLoading(false) },
    })
    handler.openIframe()
  }

  const handleSaveDraft = async () => {
    if (!roleTitle.trim()) { setError('Role title is required to save a draft.'); return }
    setError('')
    setSavingDraft(true)
    try {
      const res = await fetch('/api/talent-finds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), status: 'draft' }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setSavingDraft(false); return }
      router.push('/dashboard/employer')
    } catch {
      setError('Network error. Please try again.')
      setSavingDraft(false)
    }
  }

  const filteredRoles = roleTitles
    .filter((t) => t.toLowerCase().includes(roleTitle.toLowerCase()))
    .slice(0, 30)

  if (loadingAuth) return null

  return (
    <>
    <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

    {/* ── Payment modal ──────────────────────────────────────────────────── */}
    {showPaymentGate && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Create Pipeline</h2>
              <p className="text-sm text-slate-500">One-time payment to publish your talent pipeline.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Role</span>
              <span className="font-semibold text-slate-900">{roleTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pipeline creation fee</span>
              <span className="font-black text-slate-900 text-lg">$200 USD</span>
            </div>
          </div>

          <div className="space-y-2 mb-5 text-sm text-slate-600">
            {['AI-matched candidates scored and ranked for your role', 'Access to verified African talent ready for global work', 'Manage your full pipeline from discovery to hire', 'Email candidates directly through the platform'].map((f) => (
              <div key={f} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {f}
              </div>
            ))}
          </div>

          {paymentError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-3">{paymentError}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setShowPaymentGate(false); setPaymentError('') }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handlePayAndCreate} disabled={paymentLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {paymentLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing…
                </>
              ) : 'Pay $200 & Create'}
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">Secure payment via Paystack</p>
        </div>
      </div>
    )}

    <div className="page-container max-w-xl">
      {/* Back link */}
      <Link
        href="/dashboard/employer"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="section-label mb-1">Create Pipeline</p>
        <h1 className="text-2xl font-black text-slate-900">
          {step === 1 ? 'Define the role' : step === 2 ? 'Set requirements' : 'Write the job details'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {step === 1 ? 'Start with what kind of role and working style you need.' :
           step === 2 ? 'Tell us who you\'re looking for.' :
           'Describe the position — candidates will read this before responding.'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => { if (i + 1 < step) { setError(''); setStep(i + 1) } }}
              className={`text-xs font-semibold transition-colors ${
                i + 1 === step ? 'text-indigo-600' :
                i + 1 < step ? 'text-slate-500 hover:text-indigo-500 cursor-pointer' :
                'text-slate-300 cursor-default'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="card p-6">
        {step === 1 && (
          <div className="space-y-5">
            {/* Role title */}
            <div ref={roleRef} className="relative">
              <label className="label">Role title <span className="text-red-500">*</span></label>
              <input
                className="input-base"
                placeholder="e.g. Senior Backend Engineer"
                value={roleTitle}
                autoFocus
                onChange={(e) => { setRoleTitle(e.target.value); setRoleDropdownOpen(true) }}
                onFocus={() => setRoleDropdownOpen(true)}
              />
              {roleDropdownOpen && filteredRoles.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredRoles.map((title) => (
                    <button
                      key={title}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                        roleTitle === title ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                      }`}
                      onMouseDown={(e) => { e.preventDefault(); setRoleTitle(title); setRoleDropdownOpen(false) }}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Employment type */}
            <div>
              <label className="label">Employment type <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {EMPLOYMENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEmploymentType(t)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      employmentType === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {EMPLOYMENT_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Work arrangement */}
            <div>
              <label className="label">Work arrangement <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {WORK_ARRANGEMENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setWorkArrangement(a)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      workArrangement === a
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {WORK_ARRANGEMENT_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="label">Hiring location <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="input-base"
                  value={hiringCountry}
                  onChange={(e) => setHiringCountry(e.target.value)}
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  className="input-base"
                  placeholder="State / Region *"
                  value={hiringState}
                  onChange={(e) => setHiringState(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Experience */}
            <div>
              <label className="label">Experience range (years) <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  className="input-base"
                  placeholder="Min (e.g. 2)"
                  value={minExp}
                  onChange={(e) => setMinExp(e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  className="input-base"
                  placeholder="Max (e.g. 8)"
                  value={maxExp}
                  onChange={(e) => setMaxExp(e.target.value)}
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="label">Skills needed <span className="text-red-500">*</span></label>

              {/* Role-based skill suggestions */}
              {roleSkillSuggestions.length > 0 && (
                <div className="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-xs font-semibold text-indigo-700 mb-2">Suggested for {roleTitle} — tap to add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleSkillSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSkill(s)}
                        className="text-xs px-2.5 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors font-medium"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="flex gap-2">
                  <input
                    className="input-base flex-1"
                    placeholder="e.g. TypeScript, React, Node.js"
                    value={skillInput}
                    onChange={(e) => handleSkillInputChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                    onBlur={() => setTimeout(() => setSkillSuggestions([]), 150)}
                  />
                  <button type="button" onClick={() => addSkill()} className="btn-secondary flex-shrink-0">Add</button>
                </div>
                {skillSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-16 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {skillSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => addSkill(s)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((s) => (
                    <SkillTag key={s} skill={s} onRemove={() => setSkills((prev) => prev.filter((x) => x !== s))} />
                  ))}
                </div>
              )}
            </div>

            {/* Salary */}
            <div>
              <label className="label">Salary range (annual) <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min={0}
                    className="input-base pl-7"
                    placeholder="Min (e.g. 80000)"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min={0}
                    className="input-base pl-7"
                    placeholder="Max (e.g. 120000)"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            {/* Non-editable warning */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs text-amber-700 leading-relaxed">After publishing, the <strong>role title</strong> and <strong>job description</strong> cannot be edited. Please review carefully before creating.</p>
            </div>

            {/* Description */}
            <div>
              <label className="label">Job description <span className="text-red-500">*</span></label>
              <textarea
                className="input-base resize-none"
                rows={6}
                autoFocus
                placeholder="Describe the role, responsibilities, and what you're looking for…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className={`text-xs mt-1 ${description.length < 30 ? 'text-slate-400' : 'text-emerald-600'}`}>
                {description.length} characters {description.length < 30 ? `(${30 - description.length} more needed)` : '✓'}
              </p>
            </div>

            {/* Requirements */}
            <div>
              <label className="label">Requirements <span className="text-red-500">*</span></label>
              <textarea
                className="input-base resize-none"
                rows={3}
                placeholder="List requirements, hiring process details, and expectations…"
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
              />
              {requirementsText.trim().length > 0 && requirementsText.trim().length < 20 && (
                <p className="text-xs text-slate-400 mt-1">{20 - requirementsText.trim().length} more characters needed</p>
              )}
            </div>

            {/* Screening questions */}
            <div>
              <label className="label">
                Screening questions <span className="text-slate-400 font-normal text-xs">(candidates answer when interested)</span>
              </label>

              {/* AI-suggested questions */}
              {questionSuggestions.length > 0 && questions.length < MAX_QUESTIONS && (
                <div className="mb-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <p className="text-xs font-semibold text-violet-700 mb-2">Suggested for {roleTitle}:</p>
                  <div className="space-y-1.5">
                    {questionSuggestions.filter((q) => !questions.includes(q)).slice(0, MAX_QUESTIONS - questions.length).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => addQuestion(q)}
                        className="w-full text-left text-xs px-3 py-2 bg-white border border-violet-200 text-violet-800 rounded-lg hover:bg-violet-50 transition-colors leading-relaxed"
                      >
                        <span className="text-violet-400 mr-1.5">+</span>{q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {questions.length > 0 && (
                <div className="space-y-2 mb-3">
                  {questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 mt-0.5 flex-shrink-0">Q{i + 1}</span>
                      <p className="text-sm text-slate-700 flex-1">{q}</p>
                      <button
                        type="button"
                        onClick={() => setQuestions((prev) => prev.filter((_, j) => j !== i))}
                        className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {questions.length < MAX_QUESTIONS && (
                <div className="flex gap-2">
                  <input
                    className="input-base flex-1 text-sm"
                    placeholder={`e.g. "What accomplishment are you most proud of?"`}
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQuestion() } }}
                  />
                  <button
                    type="button"
                    onClick={() => addQuestion()}
                    disabled={!newQuestion.trim()}
                    className="btn-secondary flex-shrink-0 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            onClick={back}
            disabled={submitting || savingDraft}
            className="btn-secondary flex-1 py-3 disabled:opacity-50"
          >
            ← Back
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button onClick={next} className="btn-primary flex-1 py-3 font-semibold">
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || savingDraft}
            className="btn-primary flex-1 py-3 font-bold disabled:opacity-70"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scoring candidates with AI…
              </span>
            ) : (
              'Create & Find Talent'
            )}
          </button>
        )}
      </div>

      {/* Draft + info */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={handleSaveDraft}
          disabled={submitting || savingDraft || !roleTitle.trim()}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
        >
          {savingDraft ? 'Saving draft…' : 'Save as draft'}
        </button>
        {step === TOTAL_STEPS && !submitting && (
          <p className="text-xs text-slate-400">
            Takes 5–15 seconds · AI ranks candidates
          </p>
        )}
      </div>
    </div>
    </>
  )
}
