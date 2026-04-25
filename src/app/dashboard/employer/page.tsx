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

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {userProfile && <Avatar name={userProfile.full_name} size="md" />}
          <div>
            <h1 className="text-lg font-bold text-slate-900">Employer Dashboard</h1>
            <p className="text-sm text-slate-500">{userProfile?.company_name ?? userProfile?.full_name}</p>
          </div>
        </div>
        <Link href="/search" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Find Talent
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Requests Sent', value: requests.length },
          { label: 'Accepted', value: accepted },
          { label: 'In Pipeline', value: requests.filter((r) => r.stage !== 'discovered').length },
          { label: 'Hired', value: hired },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Candidate Pipeline</h2>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['pipeline', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${view === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                {v === 'pipeline' ? 'Board' : 'List'}
              </button>
            ))}
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm mb-3">No candidates in your pipeline yet.</p>
            <Link href="/search" className="btn-primary mx-auto inline-flex">Discover Talent</Link>
          </div>
        ) : view === 'pipeline' ? (
          <PipelineView requests={requests} onStageChange={handleStageChange} />
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const name = req.profiles?.user_profiles?.full_name ?? 'Talent'
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <Avatar name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate">{req.profiles?.role_title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700'
                        : req.status === 'declined' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>{req.status}</span>
                    <span className="text-xs text-slate-500">{STAGE_LABELS[req.stage]}</span>
                    <Link href={`/profile/${req.profile_id}`} className="text-indigo-600 text-xs hover:text-indigo-700 font-medium">View</Link>
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
