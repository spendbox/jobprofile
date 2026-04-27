'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'
import type { InterviewRequest, UserProfile, RequestStatus } from '@/types'
import { STAGE_LABELS } from '@/types'

export default function RequestsPage() {
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived' | 'all'>('active')

  useEffect(() => {
    if (loadingAuth || !userProfile) return

    const load = async () => {
      setLoading(true)

      if (userProfile.user_role === 'talent') {
        const { data: myProfiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userProfile.id)
        const profileIds = myProfiles?.map((p) => p.id) ?? []

        if (profileIds.length > 0) {
          const { data, error } = await supabase
            .from('interview_requests')
            .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*)), employer:user_profiles!ir_employer_user_profiles_fkey(*)')
            .in('profile_id', profileIds)
            .order('created_at', { ascending: false })
          if (error) console.error('requests error', error)
          setRequests((data as InterviewRequest[]) ?? [])
        } else {
          setRequests([])
        }
      } else {
        const { data, error } = await supabase
          .from('interview_requests')
          .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*)), opening:job_openings(*)')
          .eq('employer_id', userProfile.id)
          .order('created_at', { ascending: false })
        if (error) console.error('requests error', error)
        setRequests((data as InterviewRequest[]) ?? [])
      }

      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, loadingAuth])

  const updateStatus = async (requestId: string, status: 'accepted' | 'declined') => {
    const { data } = await supabase
      .from('interview_requests')
      .update({ status, stage: status === 'accepted' ? 'interested' : 'discovered' })
      .eq('id', requestId)
      .select()
      .single()
    if (data) setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, ...data } : r)))
  }

  const filtered = useMemo(() => {
    const employer = userProfile?.user_role === 'employer'
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (employer) {
        if (archivedFilter === 'active' && r.archived) return false
        if (archivedFilter === 'archived' && !r.archived) return false
      }
      return true
    })
  }, [requests, statusFilter, archivedFilter, userProfile?.user_role])

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const isEmployer = userProfile?.user_role === 'employer'
  const isTalent = userProfile?.user_role === 'talent'

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
        <p className="section-label mb-1">Inbox</p>
        <h1 className="text-2xl font-black text-slate-900">Interview Requests</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isEmployer ? "Requests you've sent to talent" : 'Requests received from employers'}
          {requests.length > 0 && ` · ${requests.length} total`}
        </p>
      </div>

      {requests.length > 0 && (
        <div className="space-y-3 mb-6">
          {/* Status filter */}
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

          {/* Archived filter — employer only */}
          {isEmployer && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['active', 'archived', 'all'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setArchivedFilter(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    archivedFilter === v
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {v === 'active' ? 'Active' : v === 'archived' ? 'Archived' : 'All'}
                </button>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Empty state */}
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
              ? isTalent
                ? 'When employers discover your profile, their requests will appear here.'
                : 'Browse talent and send interview requests to start your pipeline.'
              : 'Try changing the filters above.'}
          </p>
          {isEmployer && requests.length === 0 && (
            <Link href="/search" className="btn-primary mx-auto mt-6 inline-flex">Find Talent</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const profile = req.profiles
            const talentName = profile?.user_profiles?.full_name ?? 'Talent'
            const employer = req.employer as unknown as UserProfile | undefined
            const companyName = employer?.company_name ?? employer?.full_name ?? 'Employer'
            const displayName = isTalent ? companyName : talentName
            const isPending = req.status === 'pending'

            return (
              <div key={req.id} className="card overflow-hidden">
                <div className={`h-1 ${
                  req.status === 'accepted' ? 'bg-emerald-400'
                  : req.status === 'declined' ? 'bg-red-300'
                  : 'bg-amber-400'
                }`} />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar name={displayName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-base leading-snug">{displayName}</p>
                      {profile?.role_title && (
                        <p className="text-sm text-indigo-600 font-semibold mt-0.5">{profile.role_title}</p>
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

                  {req.message && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4">
                      <p className="text-sm text-slate-700 leading-relaxed">&ldquo;{req.message}&rdquo;</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                    <p className="text-xs text-slate-400">{timeAgo(req.created_at)}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/profile/${req.profile_id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        View Profile
                      </Link>
                      {isTalent && isPending && (
                        <>
                          <button
                            onClick={() => updateStatus(req.id, 'declined')}
                            className="text-xs px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => updateStatus(req.id, 'accepted')}
                            className="text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-colors"
                          >
                            Accept
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
