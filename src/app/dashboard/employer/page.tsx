'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { PipelineView } from '@/components/employer/PipelineView'
import { Avatar } from '@/components/ui/Avatar'
import type { InterviewRequest, JobOpening, RequestStage } from '@/types'
import { STAGE_LABELS } from '@/types'

export default function EmployerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [openings, setOpenings] = useState<JobOpening[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [showArchived, setShowArchived] = useState(false)
  const [activeOpening, setActiveOpening] = useState<string | null>(null)
  const [newOpeningTitle, setNewOpeningTitle] = useState('')
  const [addingOpening, setAddingOpening] = useState(false)
  const [openingsExpanded, setOpeningsExpanded] = useState(false)

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'talent') { router.push('/dashboard/talent'); return }

    const loadData = async () => {
      const [reqResult, openingResult] = await Promise.all([
        supabase
          .from('interview_requests')
          .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*))')
          .eq('employer_id', userProfile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('job_openings')
          .select('*')
          .eq('employer_id', userProfile.id)
          .order('created_at', { ascending: false }),
      ])

      const loadedOpenings = (openingResult.data ?? []) as JobOpening[]
      setOpenings(loadedOpenings)

      if (reqResult.error) console.error('employer dashboard error', reqResult.error)
      if (reqResult.data) {
        const enriched = reqResult.data.map((r) => ({
          ...r,
          opening: loadedOpenings.find((o) => o.id === (r as { opening_id?: string }).opening_id),
        }))
        setRequests(enriched as InterviewRequest[])
      }
      setLoading(false)
    }

    loadData()
  }, [userProfile, loadingAuth, router, supabase])

  const handleStageChange = async (requestId: string, stage: RequestStage) => {
    await supabase.from('interview_requests').update({ stage }).eq('id', requestId)
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, stage } : r)))
  }

  const handleArchive = (requestId: string) => {
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, archived: true } : r)))
  }

  const handleAddOpening = async () => {
    const title = newOpeningTitle.trim()
    if (!title || !userProfile) return
    setAddingOpening(true)
    const { data } = await supabase
      .from('job_openings')
      .insert({ employer_id: userProfile.id, title })
      .select()
      .single()
    if (data) setOpenings((prev) => [data as JobOpening, ...prev])
    setNewOpeningTitle('')
    setAddingOpening(false)
  }

  const handleDeleteOpening = async (id: string) => {
    await supabase.from('job_openings').delete().eq('id', id)
    setOpenings((prev) => prev.filter((o) => o.id !== id))
    if (activeOpening === id) setActiveOpening(null)
  }

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const activeRequests = requests.filter((r) => !r.archived)
  const archivedRequests = requests.filter((r) => r.archived)
  const visibleRequests = showArchived ? archivedRequests : activeRequests

  const accepted = activeRequests.filter((r) => r.status === 'accepted').length
  const hired = activeRequests.filter((r) => r.stage === 'hired').length

  const stats = [
    { label: 'Requests Sent', value: activeRequests.length },
    { label: 'Accepted', value: accepted },
    { label: 'In Pipeline', value: activeRequests.filter((r) => r.stage !== 'discovered').length },
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-6">
        {stats.map(({ label, value }) => (
          <div key={label} className="card p-5 sm:p-6 text-center">
            <p className="text-3xl sm:text-4xl font-black text-slate-900">{value}</p>
            <p className="section-label mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* Job Openings */}
      <div className="card p-5 sm:p-6 mb-6">
        <button
          onClick={() => setOpeningsExpanded((v) => !v)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-base">Job Openings</h2>
            {openings.length > 0 && (
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {openings.length}
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${openingsExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {openingsExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {/* Add opening */}
            <div className="flex gap-2">
              <input
                type="text"
                className="input-base flex-1 text-sm py-2"
                placeholder="e.g. Senior Backend Engineer"
                value={newOpeningTitle}
                onChange={(e) => setNewOpeningTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddOpening() }}
              />
              <button
                onClick={handleAddOpening}
                disabled={addingOpening || !newOpeningTitle.trim()}
                className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {openings.length > 0 && (
              <ul className="space-y-1.5">
                {openings.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 text-sm">
                    <span className="text-slate-800 font-medium truncate">{o.title}</span>
                    <button
                      onClick={() => handleDeleteOpening(o.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Delete opening"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Candidate Pipeline</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {visibleRequests.length} candidate{visibleRequests.length !== 1 ? 's' : ''}
              {showArchived ? ' archived' : ' active'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Opening filter */}
            {openings.length > 0 && !showArchived && (
              <select
                value={activeOpening ?? ''}
                onChange={(e) => setActiveOpening(e.target.value || null)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All openings</option>
                {openings.map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>
            )}

            {/* Archived toggle */}
            {archivedRequests.length > 0 && (
              <button
                onClick={() => { setShowArchived((v) => !v); setActiveOpening(null) }}
                className={`text-xs px-3 py-2 rounded-xl font-semibold transition-colors ${
                  showArchived
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {showArchived ? 'Show Active' : `Archived (${archivedRequests.length})`}
              </button>
            )}

            {/* Board / List toggle */}
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
        </div>

        {visibleRequests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700 mb-2">
              {showArchived ? 'No archived candidates' : 'No candidates yet'}
            </p>
            {!showArchived && (
              <>
                <p className="text-sm text-slate-500 mb-6">Browse talent and send interview requests to start your pipeline.</p>
                <Link href="/search" className="btn-primary mx-auto inline-flex">Discover Talent</Link>
              </>
            )}
          </div>
        ) : view === 'pipeline' ? (
          <PipelineView
            requests={visibleRequests}
            onStageChange={handleStageChange}
            onArchive={handleArchive}
            openingFilter={activeOpening ?? undefined}
          />
        ) : (
          <div className="space-y-3">
            {visibleRequests.map((req) => {
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
                    {req.opening?.title && (
                      <span className="inline-block mt-1 text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                        {req.opening.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
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
                    {!req.archived && (
                      <button
                        onClick={async () => {
                          await supabase.from('interview_requests').update({ archived: true }).eq('id', req.id)
                          handleArchive(req.id)
                        }}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Archive
                      </button>
                    )}
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
