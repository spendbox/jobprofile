'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PipelineView } from '@/components/employer/PipelineView'
import { Avatar } from '@/components/ui/Avatar'
import type { InterviewRequest, UserProfile, RequestStage } from '@/types'
import { STAGE_LABELS } from '@/types'

export default function EmployerDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }

      const { data: up } = await supabase.from('user_profiles').select('*').eq('id', authUser.id).single()
      if (up) {
        if (up.user_role === 'talent') { router.push('/dashboard/talent'); return }
        setUser(up as UserProfile)
      }

      const { data: reqData } = await supabase
        .from('interview_requests')
        .select('*, profiles(*, user_profiles(*))')
        .eq('employer_id', authUser.id)
        .order('created_at', { ascending: false })

      if (reqData) setRequests(reqData as InterviewRequest[])
      setLoading(false)
    }
    load()
  }, [])

  const handleStageChange = async (requestId: string, stage: RequestStage) => {
    const { data } = await supabase
      .from('interview_requests')
      .update({ stage })
      .eq('id', requestId)
      .select()
      .single()
    if (data) setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, stage } : r)))
  }

  if (loading) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {user && <Avatar name={user.full_name} size="md" />}
          <div>
            <h1 className="text-lg font-bold text-slate-900">Employer Dashboard</h1>
            <p className="text-sm text-slate-500">{user?.company_name ?? user?.full_name}</p>
          </div>
        </div>
        <Link href="/search" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Find Talent
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Requests Sent', value: requests.length },
          { label: 'Accepted', value: accepted },
          { label: 'In Pipeline', value: requests.filter((r) => !['discovered'].includes(r.stage)).length },
          { label: 'Hired', value: hired },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Candidate pipeline */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Candidate Pipeline</h2>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('pipeline')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${view === 'pipeline' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              List
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm mb-3">No candidates in your pipeline yet.</p>
            <Link href="/search" className="btn-primary mx-auto inline-flex">
              Discover Talent
            </Link>
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
                    }`}>
                      {req.status}
                    </span>
                    <span className="text-xs text-slate-500">{STAGE_LABELS[req.stage]}</span>
                    <Link href={`/profile/${req.profile_id}`} className="text-indigo-600 text-xs hover:text-indigo-700 font-medium">
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
