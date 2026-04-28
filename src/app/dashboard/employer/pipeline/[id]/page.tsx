'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { UncontactedRow, ContactedRow } from '@/components/employer/PipelineRows'
import type { TalentFind, TalentFindCandidate, InterviewRequest, RequestStage } from '@/types'
import { STAGE_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'

type ViewFilter = 'all' | 'uncontacted' | RequestStage

const STAGES: RequestStage[] = ['discovered', 'interested', 'interview', 'offer', 'hired']

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ icon, label, count, active, onClick }: {
  icon: React.ReactNode; label: string; count: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5 ${
        active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span className={active ? 'text-white/80' : 'text-slate-400'}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {count}
      </span>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const params = useParams()
  const router = useRouter()
  const { userProfile, loadingAuth } = useAuth()
  const supabase = createClient()
  const id = params.id as string

  const [find, setFind] = useState<TalentFind | null>(null)
  const [tfc, setTfc] = useState<TalentFindCandidate[]>([])
  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<ViewFilter>('all')
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null)
  const [selectedUncontacted, setSelectedUncontacted] = useState<Set<string>>(new Set())
  const [inviting, setInviting] = useState<string | null>(null)
  const [bulkInviting, setBulkInviting] = useState(false)
  const [starFilter, setStarFilter] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'ai_score' | 'star_rating' | 'date' | 'name'>('ai_score')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [editReqs, setEditReqs] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverResult, setDiscoverResult] = useState<number | null>(null)

  // ── loadData ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [findRes, scoresRes] = await Promise.all([
      fetch(`/api/talent-finds/${id}`),
      fetch(`/api/talent-finds/${id}/candidates`),
    ])

    if (findRes.ok) {
      const f = await findRes.json()
      setFind(f)
      setEditDesc(f.description ?? '')
      setEditReqs(f.requirements_text ?? '')
    }

    if (scoresRes.ok) {
      const scores: TalentFindCandidate[] = await scoresRes.json()
      setTfc(scores)

      // Fetch interview_requests scoped to this pipeline only
      const { data } = await supabase
        .from('interview_requests')
        .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*))')
        .eq('talent_find_id', id)
        .order('created_at', { ascending: false })
      if (data) setRequests(data as InterviewRequest[])
    }

    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    if (!loadingAuth && !userProfile) { router.push('/auth/login'); return }
    if (userProfile?.user_role === 'talent') { router.push('/dashboard/talent'); return }
    if (userProfile) loadData()
  }, [userProfile, loadingAuth, router, loadData])

  // ── Derived maps ────────────────────────────────────────────────────────────
  const tfcMap = useMemo(() => {
    const map: Record<string, TalentFindCandidate> = {}
    tfc.forEach((c) => { map[c.profile_id] = c })
    return map
  }, [tfc])

  const updateTfc = useCallback((profileId: string, patch: { notes?: string; star_rating?: number }) => {
    setTfc((prev) => prev.map((c) => c.profile_id === profileId ? { ...c, ...patch } : c))
  }, [])

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const filteredUncontacted = useMemo(() => {
    let list = tfc.filter((c) => !c.contacted)
    if (verifiedOnly) list = list.filter((c) => c.profiles?.user_profiles?.is_verified)
    if (starFilter > 0) list = list.filter((c) => (c.star_rating ?? 0) >= starFilter)
    return list.sort((a, b) => b.ai_score - a.ai_score)
  }, [tfc, verifiedOnly, starFilter])

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (!showArchived && r.archived) return false
      if (showArchived && !r.archived) return false
      if (activeFilter !== 'all' && activeFilter !== 'uncontacted' && r.stage !== activeFilter) return false
      if (starFilter > 0 && (tfcMap[r.profile_id]?.star_rating ?? 0) < starFilter) return false
      if (verifiedOnly && !r.profiles?.user_profiles?.is_verified) return false
      return true
    }).sort((a, b) => {
      const ta = tfcMap[a.profile_id]
      const tb = tfcMap[b.profile_id]
      if (sortBy === 'star_rating') return (tb?.star_rating ?? 0) - (ta?.star_rating ?? 0)
      if (sortBy === 'ai_score') return (tb?.ai_score ?? 0) - (ta?.ai_score ?? 0)
      if (sortBy === 'name') return (a.profiles?.user_profiles?.full_name ?? '').localeCompare(b.profiles?.user_profiles?.full_name ?? '')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [requests, activeFilter, showArchived, starFilter, verifiedOnly, sortBy, tfcMap])

  // ── Stage counts (non-archived only, for nav badges) ───────────────────────
  const stageCounts = useMemo(() =>
    STAGES.reduce((acc, s) => {
      acc[s] = requests.filter((r) => !r.archived && r.stage === s).length
      return acc
    }, {} as Record<string, number>),
  [requests])

  const uncontactedCount = tfc.filter((c) => !c.contacted).length

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleStageChange = async (requestId: string, stage: RequestStage) => {
    await supabase.from('interview_requests').update({ stage }).eq('id', requestId)
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, stage } : r))
  }

  const handleArchive = async (requestId: string) => {
    await supabase.from('interview_requests').update({ archived: true }).eq('id', requestId)
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, archived: true } : r))
    setExpandedProfileId(null)
  }

  const handleUnarchive = async (requestId: string) => {
    await supabase.from('interview_requests').update({ archived: false }).eq('id', requestId)
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, archived: false } : r))
  }

  const handleInvite = async (profileIds: string[]) => {
    if (profileIds.length === 1) setInviting(profileIds[0])
    else setBulkInviting(true)

    const res = await fetch(`/api/talent-finds/${id}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_ids: profileIds }),
    })
    if (res.ok) {
      await loadData()
      setSelectedUncontacted(new Set())
      setExpandedProfileId(null)
      if (activeFilter === 'uncontacted' && filteredUncontacted.length === profileIds.length) {
        setActiveFilter('all')
      }
    }
    setInviting(null)
    setBulkInviting(false)
  }

  const handleDiscoverMore = async () => {
    setDiscoverLoading(true)
    setDiscoverResult(null)
    const res = await fetch(`/api/talent-finds/${id}/candidates`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setDiscoverResult(data.new_candidates ?? 0)
      if ((data.new_candidates ?? 0) > 0) await loadData()
    }
    setDiscoverLoading(false)
  }

  const saveSettings = async () => {
    if (!find) return
    setSavingSettings(true)
    const res = await fetch(`/api/talent-finds/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editDesc, requirements_text: editReqs || null }),
    })
    if (res.ok) setFind(await res.json())
    setSavingSettings(false)
    setSettingsOpen(false)
  }

  const toggleExpanded = (profileId: string) =>
    setExpandedProfileId((prev) => (prev === profileId ? null : profileId))

  // ── Loading / not found ─────────────────────────────────────────────────────
  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading pipeline…</div>
      </div>
    )
  }

  if (!find) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-slate-500">Talent find not found.</p>
        <Link href="/dashboard/employer" className="btn-primary mt-4 inline-flex">Back to dashboard</Link>
      </div>
    )
  }

  const isUncontactedView = activeFilter === 'uncontacted'
  const listItems = isUncontactedView ? filteredUncontacted : filteredRequests
  const listTitle = activeFilter === 'all' ? 'All Candidates'
    : activeFilter === 'uncontacted' ? 'Uncontacted'
    : STAGE_LABELS[activeFilter as RequestStage]

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const navClick = (filter: ViewFilter) => { setActiveFilter(filter); setSidebarOpen(false) }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <Link
          href="/dashboard/employer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors font-medium"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Pipelines
        </Link>
        <p className="font-bold text-slate-900 text-sm leading-tight">{find.role_title}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.5 rounded">
            {EMPLOYMENT_TYPE_LABELS[find.employment_type]}
          </span>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
            {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <NavItem
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          label="All Candidates"
          count={requests.filter((r) => !r.archived).length}
          active={activeFilter === 'all'}
          onClick={() => navClick('all')}
        />
        <NavItem
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
          label="Uncontacted"
          count={uncontactedCount}
          active={activeFilter === 'uncontacted'}
          onClick={() => navClick('uncontacted')}
        />

        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 mt-3 mb-1">Stages</p>

        {[
          { filter: 'discovered', label: 'Discovered', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
          { filter: 'interested', label: 'Interested', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
          { filter: 'interview', label: 'Interview', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { filter: 'offer', label: 'Offer', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
          { filter: 'hired', label: 'Hired', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> },
        ].map(({ filter, label, icon }) => (
          <NavItem
            key={filter}
            icon={icon}
            label={label}
            count={stageCounts[filter] ?? 0}
            active={activeFilter === filter}
            onClick={() => navClick(filter as ViewFilter)}
          />
        ))}

        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 mt-3 mb-1">Filter</p>
        <div className="px-2 space-y-2.5">
          <div>
            <p className="text-[10px] text-slate-400 font-medium mb-1">Min stars</p>
            <div className="flex gap-1">
              {[0, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setStarFilter(v)}
                  className={`flex-1 text-[10px] py-1 rounded font-semibold transition-colors ${starFilter === v ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {v === 0 ? 'Any' : `${v}+★`}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-indigo-600 w-3.5 h-3.5" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            <span className="text-[11px] text-slate-500 font-medium">Verified only</span>
          </label>
          {!isUncontactedView && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-slate-500 w-3.5 h-3.5" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              <span className="text-[11px] text-slate-500 font-medium">Show archived</span>
            </label>
          )}
        </div>
      </nav>

      {/* Footer actions */}
      <div className="p-2 border-t border-slate-100 space-y-1">
        {/* Discover more */}
        <button
          onClick={handleDiscoverMore}
          disabled={discoverLoading}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {discoverLoading ? 'Searching…' : 'Discover more talent'}
        </button>
        {discoverResult !== null && (
          <p className="text-[10px] text-center text-slate-400 pb-1">
            {discoverResult > 0 ? `+${discoverResult} new candidates found` : 'No new candidates found'}
          </p>
        )}

        {/* Job settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Job settings
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-slate-50">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 fixed top-14 bottom-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 md:pl-60">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 bg-white border-b border-slate-200 px-4 h-14 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-slate-900 text-sm truncate">{find.role_title}</span>
        </div>

        <div className="p-5 sm:p-6">

          {/* List header */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div>
              <h1 className="font-bold text-slate-900 text-base">{listTitle}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{listItems.length} candidates</p>
            </div>
            {!isUncontactedView && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="ai_score">Sort: AI Score</option>
                <option value="star_rating">Sort: Star Rating</option>
                <option value="date">Sort: Date Added</option>
                <option value="name">Sort: Name</option>
              </select>
            )}
          </div>

          {/* Uncontacted view */}
          {isUncontactedView && (
            <>
              {selectedUncontacted.size > 0 && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-sm font-semibold text-indigo-700 flex-1">
                    {selectedUncontacted.size} selected
                  </span>
                  <button
                    onClick={() => handleInvite(Array.from(selectedUncontacted))}
                    disabled={bulkInviting}
                    className="btn-primary text-xs py-1.5 disabled:opacity-50"
                  >
                    {bulkInviting ? 'Inviting…' : 'Invite Selected'}
                  </button>
                </div>
              )}

              {filteredUncontacted.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-500 mb-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedUncontacted.size === filteredUncontacted.length}
                    onChange={(e) =>
                      setSelectedUncontacted(e.target.checked
                        ? new Set(filteredUncontacted.map((c) => c.profile_id))
                        : new Set())
                    }
                    className="accent-indigo-600 w-4 h-4"
                  />
                  Select all
                </label>
              )}

              {filteredUncontacted.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="font-semibold text-slate-700 mb-2">No uncontacted candidates</p>
                  <p className="text-sm text-slate-500">All candidates have been invited, or try "Discover more talent" in the sidebar.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUncontacted.map((candidate) => (
                    <UncontactedRow
                      key={candidate.profile_id}
                      candidate={candidate}
                      expanded={expandedProfileId === candidate.profile_id}
                      onExpand={() => toggleExpanded(candidate.profile_id)}
                      selected={selectedUncontacted.has(candidate.profile_id)}
                      onSelect={() => setSelectedUncontacted((prev) => {
                        const next = new Set(prev)
                        if (next.has(candidate.profile_id)) next.delete(candidate.profile_id)
                        else next.add(candidate.profile_id)
                        return next
                      })}
                      onInvite={() => handleInvite([candidate.profile_id])}
                      inviting={inviting === candidate.profile_id}
                      findId={id}
                      onTfcUpdate={updateTfc}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Contacted (stage) view */}
          {!isUncontactedView && (
            <>
              {filteredRequests.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="font-semibold text-slate-700 mb-2">No candidates here yet</p>
                  <p className="text-sm text-slate-500">
                    {activeFilter !== 'all'
                      ? 'No candidates in this stage.'
                      : 'Invited candidates will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRequests.map((req) => (
                    <ContactedRow
                      key={req.id}
                      request={req}
                      tfc={tfcMap[req.profile_id]}
                      find={find}
                      expanded={expandedProfileId === req.profile_id}
                      onExpand={() => toggleExpanded(req.profile_id)}
                      onStageChange={handleStageChange}
                      onArchive={handleArchive}
                      onUnarchive={handleUnarchive}
                      findId={id}
                      onTfcUpdate={updateTfc}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Job settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSettingsOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">Job Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">{find.role_title} · {EMPLOYMENT_TYPE_LABELS[find.employment_type]} · {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}</p>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {(find.salary_min || find.salary_max) ? (
                <div className="flex gap-4 text-sm">
                  <div><span className="text-slate-400 text-xs font-medium">Salary</span><p className="font-semibold text-slate-800">${(find.salary_min ?? 0).toLocaleString()} – ${(find.salary_max ?? 0).toLocaleString()}</p></div>
                  {(find.min_experience || find.max_experience) && (
                    <div><span className="text-slate-400 text-xs font-medium">Experience</span><p className="font-semibold text-slate-800">{find.min_experience ?? 0}–{find.max_experience ?? '∞'} yrs</p></div>
                  )}
                </div>
              ) : null}
              {find.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {find.skills.map((s) => <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{s}</span>)}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Job Description</label>
                <textarea rows={6} className="input-base w-full resize-none text-sm" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Requirements</label>
                <textarea rows={4} className="input-base w-full resize-none text-sm" placeholder="Additional requirements…" value={editReqs} onChange={(e) => setEditReqs(e.target.value)} />
              </div>
              {(find.custom_questions as string[])?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Screening Questions</p>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    {(find.custom_questions as string[]).map((q, i) => (
                      <li key={i} className="text-sm text-slate-700">{q}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setSettingsOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveSettings} disabled={savingSettings} className="btn-primary flex-1 disabled:opacity-60">
                {savingSettings ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
