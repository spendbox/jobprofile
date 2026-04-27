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

export default function NewTalentFindPage() {
  const router = useRouter()
  const { userProfile, loadingAuth } = useAuth()
  const supabase = createClient()

  // Role
  const [roleTitle, setRoleTitle] = useState('')
  const [roleTitles, setRoleTitles] = useState<string[]>([])
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)

  // Role basics
  const [employmentType, setEmploymentType] = useState<EmploymentType>('fulltime')
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement>('remote')

  // Location
  const [hiringCountry, setHiringCountry] = useState('')
  const [hiringState, setHiringState] = useState('')

  // Requirements
  const [minExp, setMinExp] = useState('')
  const [maxExp, setMaxExp] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')

  // Job details
  const [description, setDescription] = useState('')
  const [requirementsText, setRequirementsText] = useState('')

  // Screening questions
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

  const handleSubmit = async () => {
    if (!roleTitle.trim()) { setError('Please select a role title.'); return }
    if (description.trim().length < 30) { setError('Job description must be at least 30 characters.'); return }
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

  const filteredRoles = roleTitles.filter((t) =>
    t.toLowerCase().includes(roleTitle.toLowerCase())
  ).slice(0, 30)

  if (loadingAuth) return null

  return (
    <div className="page-container max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/employer"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to dashboard
        </Link>
        <p className="section-label mb-1">New Talent Find</p>
        <h1 className="text-2xl font-black text-slate-900">Define the role</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fill in the details and we&apos;ll find and score matching candidates using AI.
        </p>
      </div>

      <div className="space-y-6">

        {/* Section A — Role basics */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center font-black">1</span>
            Role basics
          </h2>

          <div className="space-y-4">
            {/* Role title */}
            <div ref={roleRef} className="relative">
              <label className="label">Role title <span className="text-red-500">*</span></label>
              <input
                className="input-base"
                placeholder="e.g. Senior Backend Engineer"
                value={roleTitle}
                onChange={(e) => { setRoleTitle(e.target.value); setRoleDropdownOpen(true) }}
                onFocus={() => setRoleDropdownOpen(true)}
              />
              {roleDropdownOpen && filteredRoles.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredRoles.map((title) => (
                    <button
                      key={title}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${roleTitle === title ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'}`}
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
          </div>
        </div>

        {/* Section B — Location */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center font-black">2</span>
            Location <span className="text-sm font-normal text-slate-400 ml-1">— shown to candidates</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Country</label>
              <input className="input-base" placeholder="e.g. United States" value={hiringCountry} onChange={(e) => setHiringCountry(e.target.value)} />
            </div>
            <div>
              <label className="label">State / Region</label>
              <input className="input-base" placeholder="e.g. California" value={hiringState} onChange={(e) => setHiringState(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section C — Candidate requirements */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center font-black">3</span>
            Candidate requirements
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Min experience (years)</label>
                <input type="number" min={0} className="input-base" placeholder="e.g. 2" value={minExp} onChange={(e) => setMinExp(e.target.value)} />
              </div>
              <div>
                <label className="label">Max experience (years)</label>
                <input type="number" min={0} className="input-base" placeholder="e.g. 8" value={maxExp} onChange={(e) => setMaxExp(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Skills needed</label>
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="e.g. TypeScript"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                />
                <button type="button" onClick={addSkill} className="btn-secondary flex-shrink-0">Add</button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((s) => <SkillTag key={s} skill={s} onRemove={() => setSkills((prev) => prev.filter((x) => x !== s))} />)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Salary min (annual)</label>
                <input type="number" min={0} className="input-base" placeholder="e.g. 80000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
              </div>
              <div>
                <label className="label">Salary max (annual)</label>
                <input type="number" min={0} className="input-base" placeholder="e.g. 120000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Section D — Job details */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center font-black">4</span>
            Job details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Job description <span className="text-red-500">*</span></label>
              <textarea
                className="input-base resize-none"
                rows={6}
                placeholder="Describe the role, responsibilities, and what you're looking for…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">{description.length} characters</p>
            </div>
            <div>
              <label className="label">Requirements & additional info <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                className="input-base resize-none"
                rows={4}
                placeholder="Any additional requirements, NDA expectations, process details…"
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section E — Screening questions */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center font-black">5</span>
            Screening questions <span className="text-sm font-normal text-slate-400 ml-1">(optional)</span>
          </h2>
          <p className="text-sm text-slate-500 mb-5">Candidates answer these when they express interest. Up to {MAX_QUESTIONS}.</p>

          <div className="space-y-3 mb-4">
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
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

          {questions.length < MAX_QUESTIONS && (
            <div className="flex gap-2">
              <input
                className="input-base flex-1 text-sm"
                placeholder="e.g. What accomplishment are you most proud of?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQuestion() } }}
              />
              <button type="button" onClick={addQuestion} disabled={!newQuestion.trim()} className="btn-secondary flex-shrink-0 disabled:opacity-50">
                Add
              </button>
            </div>
          )}
        </div>

        {/* Error + Submit */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full py-4 text-base font-bold disabled:opacity-70"
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

        <p className="text-xs text-slate-400 text-center pb-4">
          This usually takes 5–15 seconds. Candidates are ranked by AI before you see them.
        </p>
      </div>
    </div>
  )
}
