'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SkillTag } from '@/components/ui/SkillTag'
import { createClient } from '@/lib/supabase/client'
import type { EmploymentType, WorkArrangement } from '@/types'
import { EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'

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
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')

  // Step 3 — Details & Questions
  const [description, setDescription] = useState('')
  const [requirementsText, setRequirementsText] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [newQuestion, setNewQuestion] = useState('')

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loadingAuth && !userProfile) router.push('/auth/login')
    if (userProfile?.user_role === 'talent') router.push('/dashboard/talent')
  }, [userProfile, loadingAuth, router])

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

  const addSkill = () => {
    const t = skillInput.trim()
    if (t && !skills.includes(t)) setSkills((s) => [...s, t])
    setSkillInput('')
  }

  const addQuestion = () => {
    const t = newQuestion.trim()
    if (t && questions.length < MAX_QUESTIONS) {
      setQuestions((q) => [...q, t])
      setNewQuestion('')
    }
  }

  const validateStep = (): string => {
    if (step === 1 && !roleTitle.trim()) return 'Please enter a role title.'
    if (step === 3 && description.trim().length < 30) return 'Job description must be at least 30 characters.'
    return ''
  }

  const next = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 1)) }

  const handleSubmit = async () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/talent-finds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_title: roleTitle.trim(),
          employment_type: employmentType,
          work_arrangement: workArrangement,
          hiring_country: hiringCountry.trim() || null,
          hiring_state: hiringState.trim() || null,
          min_experience: minExp ? Number(minExp) : null,
          max_experience: maxExp ? Number(maxExp) : null,
          skills,
          salary_min: salaryMin ? Number(salaryMin) : null,
          salary_max: salaryMax ? Number(salaryMax) : null,
          description: description.trim(),
          requirements_text: requirementsText.trim() || null,
          custom_questions: questions,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setSubmitting(false); return }
      router.push(`/dashboard/employer/pipeline/${json.talent_find_id}`)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  const filteredRoles = roleTitles
    .filter((t) => t.toLowerCase().includes(roleTitle.toLowerCase()))
    .slice(0, 30)

  if (loadingAuth) return null

  return (
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
        <p className="section-label mb-1">New Talent Find</p>
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
              <label className="label">Employment type</label>
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
              <label className="label">Work arrangement</label>
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
              <label className="label">Location <span className="text-slate-400 font-normal text-xs">(shown to candidates, optional)</span></label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input-base"
                  placeholder="Country"
                  value={hiringCountry}
                  onChange={(e) => setHiringCountry(e.target.value)}
                />
                <input
                  className="input-base"
                  placeholder="State / Region"
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
              <label className="label">Experience range (years) <span className="text-slate-400 font-normal text-xs">(used to filter candidates)</span></label>
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
              <label className="label">Skills needed <span className="text-slate-400 font-normal text-xs">(used to filter candidates)</span></label>
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="e.g. TypeScript, React, Node.js"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                />
                <button type="button" onClick={addSkill} className="btn-secondary flex-shrink-0">Add</button>
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
              <label className="label">Salary range (annual) <span className="text-slate-400 font-normal text-xs">(shown to candidates, optional)</span></label>
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
                {description.length} characters {description.length < 30 ? `(${30 - description.length} more needed)` : ''}
              </p>
            </div>

            {/* Requirements */}
            <div>
              <label className="label">
                Requirements <span className="text-slate-400 font-normal text-xs">(optional — hiring doc, process details, NDA)</span>
              </label>
              <textarea
                className="input-base resize-none"
                rows={3}
                placeholder="Any additional requirements, process details, or expectations…"
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
              />
            </div>

            {/* Screening questions */}
            <div>
              <label className="label">
                Screening questions <span className="text-slate-400 font-normal text-xs">(optional — candidates answer when interested)</span>
              </label>

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
                    onClick={addQuestion}
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
            disabled={submitting}
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
            disabled={submitting}
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

      {step === TOTAL_STEPS && !submitting && (
        <p className="text-xs text-slate-400 text-center mt-3">
          Takes 5–15 seconds · Candidates ranked by AI before you see them
        </p>
      )}
    </div>
  )
}
