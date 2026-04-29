'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'
import type { TalentProfile, InterviewRequest, TalentFind, UserProfile, RequestStage } from '@/types'
import { EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS, STAGE_LABELS } from '@/types'

const PIPELINE_STAGES: RequestStage[] = ['interested', 'interview', 'offer', 'hired']

// ─── RequestModal ─────────────────────────────────────────────────────────────
function RequestModal({
  request,
  onClose,
  onRespond,
  responding,
  isViewOnly = false,
}: {
  request: InterviewRequest
  onClose: () => void
  onRespond: (id: string, decision: 'accepted' | 'declined', answers: Record<string, string>) => void
  responding: boolean
  isViewOnly?: boolean
}) {
  const find = request.talent_find as TalentFind | undefined
  const employer = request.employer as unknown as UserProfile | undefined
  const companyName = employer?.company_name ?? employer?.full_name ?? 'Employer'
  const roleTitle = find?.role_title ?? 'Interview Request'
  const questions = (find?.custom_questions ?? []) as string[]

  const existingAnswers = (request.question_answers ?? {}) as Record<string, string>
  const [answers, setAnswers] = useState<Record<string, string>>(existingAnswers)

  const allAnswered = questions.every((_, i) => (answers[`q${i}`] ?? '').trim().length > 0)
  const canAccept = questions.length === 0 || allAnswered

  const stageIdx = PIPELINE_STAGES.indexOf(request.stage)

  const salaryText = find && (find.salary_min || find.salary_max)
    ? `$${(find.salary_min ?? 0).toLocaleString()}${find.salary_max ? ` – $${find.salary_max.toLocaleString()}` : '+'}`
    : null

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <Avatar name={companyName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 leading-snug truncate">{companyName}</p>
            <p className="text-sm text-indigo-600 font-semibold mt-0.5 truncate">{roleTitle}</p>
            {find && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                  {EMPLOYMENT_TYPE_LABELS[find.employment_type]}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                  {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
                </span>
                {salaryText && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded">
                    {salaryText}
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 -mt-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 px-5 py-4 space-y-4">
          {/* Employer company details */}
          {(employer?.company_description || employer?.company_website || employer?.company_contact_email || employer?.company_hq_country) && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">About the company</p>
              {employer.company_description && (
                <p className="text-sm text-slate-700 leading-relaxed break-words">{employer.company_description}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {employer.company_hq_country && (
                  <span className="text-xs text-slate-500">
                    {employer.company_hq_state ? `${employer.company_hq_state}, ` : ''}{employer.company_hq_country}
                  </span>
                )}
                {employer.company_timezone && (
                  <span className="text-xs text-slate-500">{employer.company_timezone}</span>
                )}
                {employer.company_website && (
                  <a href={employer.company_website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline break-all">
                    {employer.company_website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {employer.company_contact_email && (
                  <a href={`mailto:${employer.company_contact_email}`} className="text-xs text-indigo-500 hover:underline">
                    {employer.company_contact_email}
                  </a>
                )}
              </div>
            </div>
          )}

          {request.message && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Message from employer</p>
              <p className="text-sm text-slate-700 leading-relaxed break-words">&ldquo;{request.message}&rdquo;</p>
            </div>
          )}

          {find?.description && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">About the role</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{find.description}</p>
            </div>
          )}

          {find?.requirements_text && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Requirements</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{find.requirements_text}</p>
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Screening questions {!isViewOnly && <span className="text-red-500">*</span>}
              </p>
              {!isViewOnly && <p className="text-xs text-slate-400">Answer all questions to express interest.</p>}
              {questions.map((q, i) => {
                const key = `q${i}`
                return (
                  <div key={i} className="space-y-1.5">
                    <label className="text-sm text-slate-700 font-medium block break-words">
                      {i + 1}. {q}
                    </label>
                    {isViewOnly ? (
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 break-words">
                        {existingAnswers[key] || <span className="text-slate-400 italic">No answer provided</span>}
                      </p>
                    ) : (
                      <textarea
                        rows={2}
                        className="input-base w-full min-w-0 resize-none text-sm"
                        placeholder="Your answer…"
                        value={answers[key] ?? ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Stage progress (view-only) */}
          {isViewOnly && request.stage === 'rejected' && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-red-600">Application not selected</p>
              <p className="text-xs text-red-400 mt-0.5">This employer has chosen not to move your application forward.</p>
            </div>
          )}
          {isViewOnly && request.stage !== 'rejected' && stageIdx >= 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your stage</p>
              <div className="flex items-center gap-1 mb-1">
                {PIPELINE_STAGES.map((s, i) => (
                  <div key={s} className={`h-2 rounded-full flex-1 transition-colors ${i <= stageIdx ? 'bg-indigo-500' : 'bg-slate-200'}`} title={STAGE_LABELS[s]} />
                ))}
              </div>
              <div className="flex justify-between overflow-hidden">
                {PIPELINE_STAGES.map((s, i) => (
                  <span key={s} className={`text-[9px] font-medium truncate flex-1 text-center first:text-left last:text-right ${i <= stageIdx ? 'text-indigo-500' : 'text-slate-300'}`}>
                    {STAGE_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          {isViewOnly ? (
            <button onClick={onClose} className="flex-1 text-sm px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors">
              Close
            </button>
          ) : (
            <>
              <button
                onClick={() => onRespond(request.id, 'declined', answers)}
                disabled={responding}
                className="flex-1 text-sm px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors disabled:opacity-50"
              >
                Not Interested
              </button>
              <button
                onClick={() => onRespond(request.id, 'accepted', answers)}
                disabled={responding || !canAccept}
                className="flex-1 text-sm px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canAccept ? 'Answer all questions to continue' : undefined}
              >
                {responding ? 'Saving…' : "I'm Interested →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PipelineStageBar ─────────────────────────────────────────────────────────
function PipelineStageBar({ stage }: { stage: RequestStage }) {
  const idx = PIPELINE_STAGES.indexOf(stage)
  return (
    <div className="flex items-center gap-1 mt-2">
      {PIPELINE_STAGES.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div
            className={`h-1.5 rounded-full flex-1 ${i <= idx ? 'bg-indigo-500' : 'bg-slate-200'}`}
          />
          {i === PIPELINE_STAGES.length - 1 && null}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TalentDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [pendingRequests, setPendingRequests] = useState<InterviewRequest[]>([])
  const [activeRequests, setActiveRequests] = useState<InterviewRequest[]>([])
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<InterviewRequest | null>(null)
  const [selectedActiveRequest, setSelectedActiveRequest] = useState<InterviewRequest | null>(null)
  const [responding, setResponding] = useState<string | null>(null)


  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    const load = async () => {
      const [{ data: upData }, { data: profileData }] = await Promise.all([
        supabase.from('user_profiles').select('is_verified').eq('id', userProfile.id).single(),
        supabase.from('profiles').select('*').eq('user_id', userProfile.id).order('created_at', { ascending: false }),
      ])

      setIsVerified(!!upData?.is_verified)

      if (profileData && profileData.length > 0) {
        setProfiles(profileData as TalentProfile[])
        const ids = profileData.map((p) => p.id)

        const [{ data: pendingData }, { data: activeData }] = await Promise.all([
          supabase
            .from('interview_requests')
            .select('*, employer:user_profiles!ir_employer_user_profiles_fkey(*), talent_find:talent_finds(*)')
            .in('profile_id', ids)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
          supabase
            .from('interview_requests')
            .select('*, employer:user_profiles!ir_employer_user_profiles_fkey(*), talent_find:talent_finds(*)')
            .in('profile_id', ids)
            .eq('status', 'accepted')
            .not('stage', 'eq', 'discovered')
            .order('updated_at', { ascending: false }),
        ])
        setPendingRequests((pendingData as InterviewRequest[]) ?? [])
        setActiveRequests((activeData as InterviewRequest[]) ?? [])
      }
      setLoading(false)
    }
    load()
  }, [userProfile, loadingAuth, router, supabase])

  const handleRespond = async (requestId: string, decision: 'accepted' | 'declined', answers: Record<string, string>) => {
    setResponding(requestId)
    const { data } = await supabase
      .from('interview_requests')
      .update({
        status: decision,
        stage: decision === 'accepted' ? 'interested' : 'discovered',
        question_answers: Object.keys(answers).length > 0 ? answers : null,
      })
      .eq('id', requestId)
      .select('*, employer:user_profiles!ir_employer_user_profiles_fkey(*), talent_find:talent_finds(*)')
      .single()
    if (data) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
      if (decision === 'accepted') {
        setActiveRequests((prev) => [data as InterviewRequest, ...prev])
      }
    }
    setSelectedRequest(null)
    setResponding(null)
  }

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {userProfile && <Avatar name={userProfile.full_name} size="lg" src={userProfile.avatar_url} />}
          <div>
            <p className="section-label mb-0.5">Talent Dashboard</p>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {userProfile?.full_name}
              {isVerified && (
                <span title="Verified" className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 rounded-full flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </h1>
          </div>
        </div>
        <Link href="/dashboard/talent/profiles" className="btn-primary self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Job Profiles
        </Link>
      </div>

      {/* Unverified nudge */}
      {userProfile && !isVerified && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-6">
          <span className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700">Not yet verified</p>
            <p className="text-xs text-slate-500 mt-0.5">Submit an ID document to get a verified badge on your profile.</p>
          </div>
          <Link href="/dashboard/talent/verify" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex-shrink-0">
            Get Verified
          </Link>
        </div>
      )}

      {/* ── Pending Requests Inbox ── */}
      {pendingRequests.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-label mb-0.5">Inbox</p>
              <h2 className="text-lg font-bold text-slate-900">
                {pendingRequests.length} Interview {pendingRequests.length === 1 ? 'Request' : 'Requests'}
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const find = req.talent_find as TalentFind | undefined
              const employer = req.employer as unknown as UserProfile | undefined
              const companyName = employer?.company_name ?? employer?.full_name ?? 'Employer'
              const roleTitle = find?.role_title ?? 'Interview Request'
              return (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="w-full text-left card overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="h-1 bg-amber-400" />
                  <div className="p-4 flex items-center gap-3">
                    <Avatar name={companyName} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-snug truncate">{companyName}</p>
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5 truncate">{roleTitle}</p>
                      {find && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                            {EMPLOYMENT_TYPE_LABELS[find.employment_type]}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                            {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">{timeAgo(req.created_at)}</span>
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Active Pipeline ── */}
      {activeRequests.filter((r) => r.stage !== 'rejected').length > 0 && (
        <div className="mb-10">
          <div className="mb-4">
            <p className="section-label mb-0.5">Your Pipeline</p>
            <h2 className="text-lg font-bold text-slate-900">Active Opportunities</h2>
          </div>
          <div className="space-y-3">
            {activeRequests.filter((r) => r.stage !== 'rejected').map((req) => {
              const find = req.talent_find as TalentFind | undefined
              const employer = req.employer as unknown as UserProfile | undefined
              const companyName = employer?.company_name ?? employer?.full_name ?? 'Employer'
              const roleTitle = find?.role_title ?? 'Role'
              const stageIdx = PIPELINE_STAGES.indexOf(req.stage)
              return (
                <button key={req.id} onClick={() => setSelectedActiveRequest(req)} className="w-full text-left card p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <Avatar name={companyName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 text-sm leading-snug truncate">{companyName}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          req.stage === 'hired' ? 'bg-emerald-100 text-emerald-700'
                          : req.stage === 'offer' ? 'bg-amber-100 text-amber-700'
                          : req.stage === 'interview' ? 'bg-violet-100 text-violet-700'
                          : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {STAGE_LABELS[req.stage]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{roleTitle}</p>

                      {/* Stage progress bar */}
                      <div className="flex items-center gap-1 mt-2.5">
                        {PIPELINE_STAGES.map((s, i) => (
                          <div
                            key={s}
                            className={`h-1.5 rounded-full flex-1 transition-colors ${i <= stageIdx ? 'bg-indigo-500' : 'bg-slate-200'}`}
                            title={STAGE_LABELS[s]}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        {PIPELINE_STAGES.map((s, i) => (
                          <span key={s} className={`text-[9px] font-medium ${i <= stageIdx ? 'text-indigo-500' : 'text-slate-300'}`}>
                            {STAGE_LABELS[s]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Rejected Applications ── */}
      {activeRequests.filter((r) => r.stage === 'rejected').length > 0 && (
        <div className="mb-10">
          <div className="mb-4">
            <p className="section-label mb-0.5 text-red-400">Closed</p>
            <h2 className="text-lg font-bold text-slate-900">Not Selected</h2>
          </div>
          <div className="space-y-3">
            {activeRequests.filter((r) => r.stage === 'rejected').map((req) => {
              const find = req.talent_find as TalentFind | undefined
              const employer = req.employer as unknown as UserProfile | undefined
              const companyName = employer?.company_name ?? employer?.full_name ?? 'Employer'
              const roleTitle = find?.role_title ?? 'Role'
              return (
                <div key={req.id} className="card p-4 border-red-100 bg-red-50/30 opacity-75">
                  <div className="flex items-start gap-3">
                    <Avatar name={companyName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-700 text-sm leading-snug truncate">{companyName}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-red-100 text-red-500">
                          Not Selected
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{roleTitle}</p>
                      <p className="text-xs text-red-400 mt-2">This employer chose not to move your application forward.</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state when no inbox and no pipeline */}
      {pendingRequests.length === 0 && activeRequests.length === 0 && (
        <div className="card p-14 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="font-bold text-slate-900 text-base">No activity yet</p>
          <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
            Employer interview requests will appear here once you have a profile.
          </p>
          <Link href="/dashboard/talent/profiles" className="btn-primary mx-auto mt-6">
            Create Profile
          </Link>
        </div>
      )}

      {/* Pending request modal */}
      {selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onRespond={handleRespond}
          responding={responding === selectedRequest.id}
        />
      )}

      {/* Active opportunity detail modal */}
      {selectedActiveRequest && (
        <RequestModal
          request={selectedActiveRequest}
          onClose={() => setSelectedActiveRequest(null)}
          onRespond={() => {}}
          responding={false}
          isViewOnly
        />
      )}

    </div>
  )
}
