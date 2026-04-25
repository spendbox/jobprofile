'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { PipelineView } from '@/components/employer/PipelineView'
import { Avatar } from '@/components/ui/Avatar'
import type { InterviewRequest, RequestStage } from '@/types'
import { STAGE_LABELS } from '@/types'

export default function EmployerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'talent') { router.push('/dashboard/talent'); return }

    supabase
      .from('interview_requests')
      .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*))')
      .eq('employer_id', userProfile.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('employer dashboard error', error)
        if (data) setRequests(data as InterviewRequest[])
        setLoading(false)
      })
  }, [userProfile, loadingAuth, router, supabase])

  const handleStageChange = async (requestId: string, stage: RequestStage) => {
    const { data } = await supabase
      .from('interview_requests')
      .update({ stage })
      .eq('id', requestId)
      .select()
      .single()
    if (data) setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, stage } : r)))
  }

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const accepted = requests.filter((r) => r.status === 'accepted').length
  const hired = requests.filter((r) => r.stage === 'hired').length

  const stats = [
    { label: 'Requests Sent', value: requests.length },
    { label: 'Accepted', value: accepted },
    { label: 'In Pipeline', value: requests.filter((r) => r.stage !== 'discovered').length },
    { label: 'Hired', value: hired },
  ]

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {userProfile && <Avatar name={userProfile.full_name} size="lg" />}
          <div>
            <p className="section-label mb-0.5">Employer Dashboard</p>
            <h1 className="text-xl font-bold text-slate-900">
              {userProfile?.company_name ?? userProfile?.full_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your candidate pipeline</p>
          </div>
        </div>
        <Link href="/search" className="btn-primary self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Find Talent
        </Link>
      </div>

      {/* Stats — 2×2 on mobile, 4 columns on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-10">
        {stats.map(({ label, value }) => (
          <div key={label} className="card p-5 sm:p-6 text-center">
            <p className="text-3xl sm:text-4xl font-black text-slate-900">{value}</p>
            <p className="section-label mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Candidate Pipeline</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {requests.length} candidate{requests.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['pipeline', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  view === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'pipeline' ? 'Board' : 'List'}
              </button>
            ))}
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700 mb-2">No candidates yet</p>
            <p className="text-sm text-slate-500 mb-6">Browse talent and send interview requests to start your pipeline.</p>
            <Link href="/search" className="btn-primary mx-auto inline-flex">Discover Talent</Link>
          </div>
        ) : view === 'pipeline' ? (
          <PipelineView requests={requests} onStageChange={handleStageChange} />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const name = req.profiles?.user_profiles?.full_name ?? 'Talent'
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <Avatar name={name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{req.profiles?.role_title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700'
                        : req.status === 'declined' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">{STAGE_LABELS[req.stage]}</span>
                    <Link
                      href={`/profile/${req.profile_id}`}
                      className="text-indigo-600 text-xs hover:text-indigo-700 font-semibold"
                    >
                      View
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
