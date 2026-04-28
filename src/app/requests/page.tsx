'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'
import type { InterviewRequest, TalentFind, UserProfile, RequestStatus } from '@/types'
import { STAGE_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'

export default function RequestsPage() {
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()
  const router = useRouter()

  // Employers manage candidates through the pipeline page, not here
  useEffect(() => {
    if (!loadingAuth && userProfile?.user_role === 'employer') {
      router.replace('/dashboard/employer')
    }
  }, [userProfile, loadingAuth, router])

  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  // Per-request question answers state (keyed by requestId)
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({})
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => {
    if (loadingAuth || !userProfile || userProfile.user_role === 'employer') return

    const load = async () => {
      setLoading(true)

      const { data: myProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userProfile.id)
      const profileIds = myProfiles?.map((p) => p.id) ?? []

      if (profileIds.length > 0) {
        const { data, error } = await supabase
          .from('interview_requests')
          .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*)), employer:user_profiles!ir_employer_user_profiles_fkey(*), talent_find:talent_finds(*)')
          .in('profile_id', profileIds)
          .order('created_at', { ascending: false })
        if (error) console.error('requests error', error)
        const loaded = (data as InterviewRequest[]) ?? []
        setRequests(loaded)
        const seedAnswers: Record<string, Record<string, string>> = {}
        for (const r of loaded) {
          if (r.question_answers) seedAnswers[r.id] = r.question_answers as Record<string, string>
        }
        setAnswers(seedAnswers)
      } else {
        setRequests([])
      }

      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, loadingAuth])

  const respond = async (requestId: string, decision: 'accepted' | 'declined') => {
    setResponding(requestId)
    const qa = answers[requestId] ?? {}
    const { data } = await supabase
      .from('interview_requests')
      .update({
        status: decision,
        stage: decision === 'accepted' ? 'interested' : 'discovered',
        question_answers: Object.keys(qa).length > 0 ? qa : null,
      })
      .eq('id', requestId)
      .select()
      .single()
    if (data) setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, ...data } : r)))
    setResponding(null)
  }

  const setAnswer = (requestId: string, key: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [requestId]: { ...(prev[requestId] ?? {}), [key]: value },
    }))
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [requests, statusFilter])

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
    declined: requests.filter((r) => r.status === 'declined').length,
  }

  return (
    <div className="page-container max-w-2xl">

      {/* Header */}
      <div className="mb-6">
        <p className="section-label mb-1">History</p>
        <h1 className="text-2xl font-black text-slate-900">Interview Requests</h1>
        <p className="text-sm text-slate-500 mt-1">
          All requests received from employers{requests.length > 0 && ` · ${requests.length} total`}
        </p>
      </div>

      {requests.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'pending', 'accepted', 'declined'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? s === 'accepted' ? 'bg-emerald-100 text-emerald-700'
                      : s === 'declined' ? 'bg-red-100 text-red-600'
                      : s === 'pending' ? 'bg-amber-100 text-amber-700'
                      : 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && statusCounts[s] > 0 && (
                  <span className="ml-1 opacity-75">({statusCounts[s]})</span>
                )}
              </button>
            ))}
          </div>

        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="font-bold text-slate-800 mb-2 text-base">
            {requests.length === 0 ? 'No requests yet' : 'No requests match filters'}
          </p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            {requests.length === 0
              ? true
                ? 'When employers discover your profile, their requests will appear here.'
                : 'Browse talent and send interview requests to start your pipeline.'
              : 'Try changing the filters above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const employer = req.employer as unknown as UserProfile | undefined
            const displayName = employer?.company_name ?? employer?.full_name ?? 'Employer'
            const isPending = req.status === 'pending'
            const find = req.talent_find as TalentFind | undefined

            return (
              <div key={req.id} className="card overflow-hidden">
                <div className={`h-1 ${
                  req.status === 'accepted' ? 'bg-emerald-400'
                  : req.status === 'declined' ? 'bg-red-300'
                  : 'bg-amber-400'
                }`} />

                <div className="p-5 sm:p-6">
                  {/* Sender row */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar name={displayName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-base leading-snug">{displayName}</p>
                      {find && (
                        <p className="text-sm text-indigo-600 font-semibold mt-0.5">{find.role_title}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700'
                            : req.status === 'declined' ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                          {STAGE_LABELS[req.stage]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {req.message && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4">
                      <p className="text-sm text-slate-700 leading-relaxed">&ldquo;{req.message}&rdquo;</p>
                    </div>
                  )}

                  {/* Job spec — talent view, talent-find-backed request */}
                  {true && find && (
                    <JobSpec find={find} defaultExpanded={isPending} />
                  )}

                  {/* Custom questions */}
                  {true && find && (find.custom_questions?.length ?? 0) > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Screening questions
                      </p>
                      {(find.custom_questions as string[]).map((q, i) => {
                        const key = `q${i}`
                        const existingAnswer = (req.question_answers as Record<string, string> | undefined)?.[key]
                        const currentAnswer = answers[req.id]?.[key] ?? existingAnswer ?? ''
                        const responded = !isPending

                        return (
                          <div key={i} className="space-y-1.5">
                            <label className="text-sm text-slate-700 font-medium block">{q}</label>
                            {responded ? (
                              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                {existingAnswer || <span className="text-slate-400 italic">Not answered</span>}
                              </p>
                            ) : (
                              <textarea
                                rows={2}
                                className="input-base w-full resize-none text-sm"
                                placeholder="Your answer…"
                                value={currentAnswer}
                                onChange={(e) => setAnswer(req.id, key, e.target.value)}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-3 flex-wrap pt-4 mt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400">{timeAgo(req.created_at)}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/profile/${req.profile_id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        View Profile
                      </Link>
                      {true && isPending && (
                        <>
                          <button
                            onClick={() => respond(req.id, 'declined')}
                            disabled={responding === req.id}
                            className="text-xs px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors disabled:opacity-50"
                          >
                            Not Interested
                          </button>
                          <button
                            onClick={() => respond(req.id, 'accepted')}
                            disabled={responding === req.id}
                            className="text-xs px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-colors disabled:opacity-50"
                          >
                            {responding === req.id ? 'Saving…' : "I'm Interested →"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function JobSpec({ find, defaultExpanded }: { find: TalentFind; defaultExpanded: boolean }) {
  const [open, setOpen] = useState(defaultExpanded)

  const salaryText = find.salary_min || find.salary_max
    ? `$${(find.salary_min ?? 0).toLocaleString()}${find.salary_max ? ` – $${find.salary_max.toLocaleString()}` : '+'}`
    : null

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{find.role_title}</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
            {EMPLOYMENT_TYPE_LABELS[find.employment_type]}
          </span>
          <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md font-medium">
            {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4 bg-white">
          {salaryText && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Salary</p>
              <p className="text-sm text-slate-800 font-semibold">{salaryText}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{find.description}</p>
          </div>
          {find.requirements_text && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Requirements</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{find.requirements_text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
