'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import type { TalentFind } from '@/types'
import { EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'

interface FindStats {
  discovered: number
  interested: number
  pipeline: number
}

export default function EmployerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [finds, setFinds] = useState<TalentFind[]>([])
  const [findStats, setFindStats] = useState<Record<string, FindStats>>({})
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [globalStats, setGlobalStats] = useState({ activeFinds: 0, totalCandidates: 0, interested: 0, hired: 0 })

  const loadData = useCallback(async () => {
    const findsRes = await fetch('/api/talent-finds?status=all')
    if (!findsRes.ok) { setLoading(false); return }
    const allFinds: TalentFind[] = await findsRes.json()
    setFinds(allFinds)

    if (allFinds.length === 0) {
      setLoading(false)
      return
    }

    const findIds = allFinds.map((f) => f.id)

    const [candidatesResult, requestsResult] = await Promise.all([
      supabase
        .from('talent_find_candidates')
        .select('talent_find_id, contacted')
        .in('talent_find_id', findIds),
      supabase
        .from('interview_requests')
        .select('talent_find_id, stage')
        .in('talent_find_id', findIds),
    ])

    const candidates = candidatesResult.data ?? []
    const requests = requestsResult.data ?? []

    const statsMap: Record<string, FindStats> = {}
    for (const f of allFinds) {
      const fCandidates = candidates.filter((c) => c.talent_find_id === f.id)
      const fRequests = requests.filter((r) => r.talent_find_id === f.id)
      statsMap[f.id] = {
        discovered: fCandidates.length,
        interested: fRequests.filter((r) => r.stage === 'interested').length,
        pipeline: fRequests.length,
      }
    }
    setFindStats(statsMap)

    setGlobalStats({
      activeFinds: allFinds.filter((f) => f.status === 'active').length,
      totalCandidates: candidates.length,
      interested: requests.filter((r) => r.stage === 'interested').length,
      hired: requests.filter((r) => r.stage === 'hired').length,
    })

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'talent') { router.push('/dashboard/talent'); return }
    loadData()
  }, [userProfile, loadingAuth, router, loadData])

  const handleArchive = async (findId: string) => {
    setArchiving(findId)
    await fetch(`/api/talent-finds/${findId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    })
    setFinds((prev) => prev.map((f) => f.id === findId ? { ...f, status: 'archived' as const } : f))
    setGlobalStats((prev) => ({ ...prev, activeFinds: Math.max(0, prev.activeFinds - 1) }))
    setArchiving(null)
  }

  const handleReactivate = async (findId: string) => {
    setArchiving(findId)
    await fetch(`/api/talent-finds/${findId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    setFinds((prev) => prev.map((f) => f.id === findId ? { ...f, status: 'active' as const } : f))
    setGlobalStats((prev) => ({ ...prev, activeFinds: prev.activeFinds + 1 }))
    setArchiving(null)
  }

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const activeFinds = finds.filter((f) => f.status === 'active')
  const archivedFinds = finds.filter((f) => f.status === 'archived')
  const visibleFinds = showArchived ? archivedFinds : activeFinds

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
            <p className="text-sm text-slate-500 mt-0.5">Manage your talent pipeline</p>
          </div>
        </div>
        <Link href="/dashboard/employer/new-find" className="btn-primary self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Pipeline
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {[
          { label: 'Active Finds', value: globalStats.activeFinds },
          { label: 'Total Candidates', value: globalStats.totalCandidates },
          { label: 'Interested', value: globalStats.interested },
          { label: 'Hired', value: globalStats.hired },
        ].map(({ label, value }) => (
          <div key={label} className="card p-5 sm:p-6 text-center">
            <p className="text-3xl sm:text-4xl font-black text-slate-900">{value}</p>
            <p className="section-label mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* List header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 text-base">
          {showArchived ? 'Archived Talent Finds' : 'Active Talent Finds'}
          {' '}
          <span className="text-slate-400 font-normal text-sm">({visibleFinds.length})</span>
        </h2>
        {(showArchived || archivedFinds.length > 0) && (
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              showArchived
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {showArchived ? '← Active' : `Archived (${archivedFinds.length})`}
          </button>
        )}
      </div>

      {/* Finds list */}
      {visibleFinds.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {showArchived ? (
            <p className="text-slate-500">No archived talent finds.</p>
          ) : (
            <>
              <p className="font-semibold text-slate-700 mb-2">No talent finds yet</p>
              <p className="text-sm text-slate-500 mb-6">
                Create a Talent Find to start discovering and reaching out to candidates.
              </p>
              <Link href="/dashboard/employer/new-find" className="btn-primary mx-auto inline-flex">
                Create your first Talent Find
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleFinds.map((find) => {
            const s = findStats[find.id] ?? { discovered: 0, interested: 0, pipeline: 0 }
            return (
              <div key={find.id} className="card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{find.role_title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        find.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {find.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                        {EMPLOYMENT_TYPE_LABELS[find.employment_type]}
                      </span>
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md font-medium">
                        {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
                      </span>
                      {find.hiring_country && (
                        <span className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {find.hiring_state ? `${find.hiring_state}, ` : ''}{find.hiring_country}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-5">
                      <div>
                        <span className="font-bold text-slate-900 text-lg">{s.discovered}</span>
                        <span className="text-slate-500 ml-1.5 text-xs">discovered</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-lg">{s.interested}</span>
                        <span className="text-slate-500 ml-1.5 text-xs">interested</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-lg">{s.pipeline}</span>
                        <span className="text-slate-500 ml-1.5 text-xs">in pipeline</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-3 flex-shrink-0">
                    <Link
                      href={`/dashboard/employer/pipeline/${find.id}`}
                      className="btn-primary text-sm py-2 px-4 whitespace-nowrap"
                    >
                      Open Pipeline →
                    </Link>
                    {find.status === 'active' ? (
                      <button
                        onClick={() => handleArchive(find.id)}
                        disabled={archiving === find.id}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                      >
                        {archiving === find.id ? 'Archiving…' : 'Archive'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(find.id)}
                        disabled={archiving === find.id}
                        className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {archiving === find.id ? 'Reactivating…' : 'Reactivate'}
                      </button>
                    )}
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
