'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'
import type { InterviewRequest, UserProfile } from '@/types'
import { STAGE_LABELS } from '@/types'

export default function RequestsPage() {
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'received' | 'sent'>('received')

  const loadRequests = async (role: string, currentTab: string) => {
    if (!userProfile) return
    setLoading(true)

    if (role === 'talent' || currentTab === 'received') {
      const { data: myProfiles } = await supabase.from('profiles').select('id').eq('user_id', userProfile.id)
      const profileIds = myProfiles?.map((p) => p.id) ?? []

      if (profileIds.length > 0) {
        const { data, error } = await supabase
          .from('interview_requests')
          .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*)), employer:user_profiles!ir_employer_user_profiles_fkey(*)')
          .in('profile_id', profileIds)
          .order('created_at', { ascending: false })
        if (error) console.error('requests error', error)
        if (data) setRequests(data as InterviewRequest[])
        else setRequests([])
      } else {
        setRequests([])
      }
    } else {
      const { data, error } = await supabase
        .from('interview_requests')
        .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*))')
        .eq('employer_id', userProfile.id)
        .order('created_at', { ascending: false })
      if (error) console.error('requests error', error)
      if (data) setRequests(data as InterviewRequest[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (loadingAuth || !userProfile) return
    const defaultTab = userProfile.user_role === 'employer' ? 'sent' : 'received'
    setTab(defaultTab)
    loadRequests(userProfile.user_role, defaultTab)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, loadingAuth])

  const handleTabChange = (newTab: 'received' | 'sent') => {
    setTab(newTab)
    if (userProfile) loadRequests(userProfile.user_role, newTab)
  }

  const updateStatus = async (requestId: string, status: 'accepted' | 'declined') => {
    const { data } = await supabase
      .from('interview_requests')
      .update({ status, stage: status === 'accepted' ? 'interested' : 'discovered' })
      .eq('id', requestId)
      .select()
      .single()
    if (data) setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, ...data } : r)))
  }

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const isEmployer = userProfile?.user_role === 'employer'

  return (
    <div className="page-container max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Interview Requests</h1>

      {isEmployer && (
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {(['received', 'sent'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'received' ? 'Received' : 'Sent'}
            </button>
          ))}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="font-medium text-slate-700 mb-1">No requests yet</p>
          <p className="text-sm text-slate-500">
            {tab === 'received'
              ? 'When employers discover your profile, their requests appear here.'
              : 'Browse talent and send interview requests to start your pipeline.'}
          </p>
          {isEmployer && (
            <Link href="/search" className="btn-primary mx-auto mt-4 inline-flex">Find Talent</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const profile = req.profiles
            const talentName = profile?.user_profiles?.full_name ?? 'Talent'
            const employer = req.employer as unknown as UserProfile | undefined
            const companyName = employer?.company_name ?? employer?.full_name ?? 'Employer'

            return (
              <div key={req.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={tab === 'received' ? companyName : talentName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {tab === 'received' ? companyName : talentName}
                        </p>
                        <p className="text-xs text-indigo-600 font-medium">{profile?.role_title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700'
                            : req.status === 'declined' ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>{req.status}</span>
                        <span className="text-xs text-slate-400">{STAGE_LABELS[req.stage]}</span>
                      </div>
                    </div>

                    {req.message && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-slate-400">{timeAgo(req.created_at)}</p>
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${req.profile_id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                          View Profile
                        </Link>
                        {tab === 'received' && req.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(req.id, 'declined')} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                              Decline
                            </button>
                            <button onClick={() => updateStatus(req.id, 'accepted')} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors">
                              Accept
                            </button>
                          </>
                        )}
                      </div>
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
