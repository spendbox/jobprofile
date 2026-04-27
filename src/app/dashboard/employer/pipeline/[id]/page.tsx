'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { SkillTag } from '@/components/ui/SkillTag'
import { timeAgo } from '@/lib/utils'
import type {
  TalentFind, TalentFindCandidate, InterviewRequest, RequestStage
} from '@/types'
import {
  STAGE_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS
} from '@/types'

const STAGES: RequestStage[] = ['discovered', 'interested', 'interview', 'offer', 'hired']

type SidebarFilter = 'uncontacted' | 'all' | RequestStage

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-xl leading-none transition-colors"
        >
          <span className={(hover || value || 0) >= n ? 'text-amber-400' : 'text-slate-200'}>★</span>
        </button>
      ))}
    </div>
  )
}

// ─── Candidate Detail Panel ───────────────────────────────────────────────────
function CandidatePanel({
  request,
  find,
  candidateScore,
  onClose,
  onStageChange,
  onArchive,
  onStarChange,
}: {
  request: InterviewRequest
  find: TalentFind
  candidateScore?: TalentFindCandidate
  onClose: () => void
  onStageChange: (id: string, stage: RequestStage) => void
  onArchive: (id: string) => void
  onStarChange: (id: string, rating: number) => void
}) {
  const supabase = createClient()
  const profile = request.profiles
  const name = profile?.user_profiles?.full_name ?? 'Talent'
  const currentIdx = STAGES.indexOf(request.stage)
  const prevStage = STAGES[currentIdx - 1]
  const nextStage = STAGES[currentIdx + 1]

  const [notes, setNotes] = useState(request.notes ?? '')
  const [saving, setSaving] = useState(false)

  const saveNotes = async () => {
    setSaving(true)
    await supabase.from('interview_requests').update({ notes }).eq('id', request.id)
    setSaving(false)
  }

  const handleStar = async (rating: number) => {
    await supabase.from('interview_requests').update({ star_rating: rating }).eq('id', request.id)
    onStarChange(request.id, rating)
  }

  const questions = find.custom_questions ?? []
  const answers = request.question_answers ?? {}

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h3 className="font-bold text-slate-900 text-base truncate">{name}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Identity */}
        <div className="flex items-start gap-4">
          <Avatar name={name} size="lg" src={profile?.user_profiles?.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-900">{name}</p>
              {profile?.user_profiles?.is_verified && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 rounded-full flex-shrink-0" title="Verified">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-indigo-600 font-semibold mt-0.5">{profile?.role_title}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                request.status === 'accepted' ? 'bg-emerald-100 text-emerald-700'
                : request.status === 'declined' ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
              }`}>
                {request.status}
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {STAGE_LABELS[request.stage]}
              </span>
            </div>
          </div>
        </div>

        {/* AI Score */}
        {candidateScore && (
          <div className="bg-indigo-50 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI Match Score</span>
              <span className="text-lg font-black text-indigo-700">{candidateScore.ai_score}</span>
            </div>
            {candidateScore.ai_summary && (
              <p className="text-xs text-indigo-600 leading-relaxed">{candidateScore.ai_summary}</p>
            )}
          </div>
        )}

        {/* Star rating */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your Rating</p>
          <StarRating value={request.star_rating} onChange={handleStar} />
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Notes {saving && <span className="text-slate-400 normal-case font-normal">saving…</span>}
          </p>
          <textarea
            className="input-base resize-none text-sm"
            rows={4}
            placeholder="Add private notes about this candidate…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
          />
        </div>

        {/* Stage navigation */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Move Stage</p>
          <div className="flex gap-2">
            {prevStage && (
              <button onClick={() => onStageChange(request.id, prevStage)} className="btn-secondary flex-1 text-xs py-2">
                ← {STAGE_LABELS[prevStage]}
              </button>
            )}
            {nextStage && (
              <button onClick={() => onStageChange(request.id, nextStage)} className="btn-primary flex-1 text-xs py-2">
                {STAGE_LABELS[nextStage]} →
              </button>
            )}
          </div>
        </div>

        {/* Q&A */}
        {questions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Screening Q&A</p>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Q{i + 1}: {q}</p>
                  {answers[`q${i}`] ? (
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 leading-relaxed">
                      {answers[`q${i}`]}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No answer yet</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile links */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={`/profile/${request.profile_id}`}
            target="_blank"
            className="btn-secondary text-xs py-2"
          >
            View Full Profile →
          </Link>
          {(profile?.portfolio_item_ids?.length ?? 0) > 0 && (
            <Link href={`/profile/${request.profile_id}`} target="_blank" className="btn-secondary text-xs py-2">
              Portfolio
            </Link>
          )}
        </div>

        {/* Archive */}
        <button
          onClick={() => onArchive(request.id)}
          className="w-full text-xs py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          Archive candidate
        </button>
      </div>
    </div>
  )
}

// ─── Uncontacted Candidate Row ────────────────────────────────────────────────
function UncontactedRow({
  candidate,
  selected,
  onToggle,
}: {
  candidate: TalentFindCandidate
  selected: boolean
  onToggle: () => void
}) {
  const profile = candidate.profiles
  const name = profile?.user_profiles?.full_name ?? 'Talent'

  return (
    <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-1 w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
      />
      <Avatar name={name} size="md" src={profile?.user_profiles?.avatar_url} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          {profile?.user_profiles?.is_verified && (
            <span className="inline-flex items-center justify-center w-4 h-4 bg-indigo-600 rounded-full" title="Verified">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {candidate.ai_score}% match
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{profile?.role_title} · {profile?.years_experience}y exp</p>
        {candidate.ai_summary && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{candidate.ai_summary}</p>
        )}
        {(profile?.skills ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(profile?.skills ?? []).slice(0, 5).map((s) => <SkillTag key={s} skill={s} />)}
          </div>
        )}
      </div>
    </label>
  )
}

// ─── Pipeline Candidate Row ───────────────────────────────────────────────────
function CandidateRow({
  request,
  selected,
  onSelect,
}: {
  request: InterviewRequest
  selected: boolean
  onSelect: () => void
}) {
  const profile = request.profiles
  const name = profile?.user_profiles?.full_name ?? 'Talent'

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-colors text-left ${
        selected
          ? 'bg-indigo-50 border-indigo-200'
          : 'bg-white border-slate-100 hover:bg-slate-50'
      }`}
    >
      <Avatar name={name} size="sm" src={profile?.user_profiles?.avatar_url} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{profile?.role_title}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
          request.stage === 'hired' ? 'bg-emerald-100 text-emerald-700'
          : request.stage === 'offer' ? 'bg-amber-100 text-amber-700'
          : request.stage === 'interview' ? 'bg-violet-100 text-violet-700'
          : request.stage === 'interested' ? 'bg-indigo-100 text-indigo-700'
          : 'bg-slate-100 text-slate-600'
        }`}>
          {STAGE_LABELS[request.stage]}
        </span>
        {request.star_rating && (
          <span className="text-amber-400 text-xs leading-none">{'★'.repeat(request.star_rating)}</span>
        )}
      </div>
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
  const [requests, setRequests] = useState<InterviewRequest[]>([])
  const [uncontacted, setUncontacted] = useState<TalentFindCandidate[]>([])
  const [candidateScores, setCandidateScores] = useState<Record<string, TalentFindCandidate>>({})
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>('uncontacted')
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null)
  const [selectedUncontacted, setSelectedUncontacted] = useState<Set<string>>(new Set())
  const [contacting, setContacting] = useState(false)
  const [discoverMore, setDiscoverMore] = useState(false)
  const [starFilter, setStarFilter] = useState<number>(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'ai_score' | 'star_rating' | 'date' | 'name'>('ai_score')

  const loadData = useCallback(async () => {
    const [findRes, reqRes, candidatesRes] = await Promise.all([
      fetch(`/api/talent-finds/${id}`),
      supabase
        .from('interview_requests')
        .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*))')
        .eq('talent_find_id', id)
        .order('created_at', { ascending: false }),
      fetch(`/api/talent-finds/${id}/candidates?contacted=false`),
    ])

    if (findRes.ok) setFind(await findRes.json())
    if (reqRes.data) setRequests(reqRes.data as InterviewRequest[])

    if (candidatesRes.ok) {
      const data: TalentFindCandidate[] = await candidatesRes.json()
      setUncontacted(data)
    }

    // Also load all candidate scores for enriching the panel
    const scoresRes = await fetch(`/api/talent-finds/${id}/candidates`)
    if (scoresRes.ok) {
      const scores: TalentFindCandidate[] = await scoresRes.json()
      const map: Record<string, TalentFindCandidate> = {}
      scores.forEach((c) => { map[c.profile_id] = c })
      setCandidateScores(map)
    }
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    if (!loadingAuth && !userProfile) { router.push('/auth/login'); return }
    if (userProfile?.user_role === 'talent') { router.push('/dashboard/talent'); return }
    if (userProfile) loadData()
  }, [userProfile, loadingAuth, router, loadData])

  const handleStageChange = async (requestId: string, stage: RequestStage) => {
    await supabase.from('interview_requests').update({ stage }).eq('id', requestId)
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, stage } : r))
  }

  const handleArchive = async (requestId: string) => {
    await supabase.from('interview_requests').update({ archived: true }).eq('id', requestId)
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, archived: true } : r))
    setSelectedPanel(null)
  }

  const handleStarChange = (requestId: string, rating: number) => {
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, star_rating: rating } : r))
  }

  const handleBulkContact = async () => {
    if (selectedUncontacted.size === 0) return
    setContacting(true)
    const res = await fetch(`/api/talent-finds/${id}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_ids: Array.from(selectedUncontacted) }),
    })
    if (res.ok) {
      setUncontacted((prev) => prev.filter((c) => !selectedUncontacted.has(c.profile_id)))
      setSelectedUncontacted(new Set())
      await loadData()
      setActiveFilter('discovered')
    }
    setContacting(false)
  }

  const handleDiscoverMore = async () => {
    setDiscoverMore(true)
    const res = await fetch(`/api/talent-finds/${id}/candidates`, { method: 'POST' })
    if (res.ok) {
      const { new_candidates } = await res.json()
      if (new_candidates > 0) await loadData()
    }
    setDiscoverMore(false)
  }

  // Compute filtered requests
  const filteredRequests = requests.filter((r) => {
    if (!showArchived && r.archived) return false
    if (showArchived && !r.archived) return false
    if (activeFilter !== 'all' && activeFilter !== 'uncontacted' && r.stage !== activeFilter) return false
    if (starFilter > 0 && (r.star_rating ?? 0) < starFilter) return false
    if (verifiedOnly && !r.profiles?.user_profiles?.is_verified) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'star_rating') return (b.star_rating ?? 0) - (a.star_rating ?? 0)
    if (sortBy === 'ai_score') {
      const sa = candidateScores[a.profile_id]?.ai_score ?? 0
      const sb = candidateScores[b.profile_id]?.ai_score ?? 0
      return sb - sa
    }
    if (sortBy === 'name') {
      const na = a.profiles?.user_profiles?.full_name ?? ''
      const nb = b.profiles?.user_profiles?.full_name ?? ''
      return na.localeCompare(nb)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = requests.filter((r) => !r.archived && r.stage === s).length
    return acc
  }, {} as Record<string, number>)

  const selectedRequest = requests.find((r) => r.id === selectedPanel)

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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-100">
        <Link href="/dashboard/employer" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-4 transition-colors font-medium">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All pipelines
        </Link>
        <h2 className="font-bold text-slate-900 text-sm leading-snug">{find.role_title}</h2>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
            {EMPLOYMENT_TYPE_LABELS[find.employment_type]}
          </span>
          <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
            {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">View</p>

        <button
          onClick={() => { setActiveFilter('uncontacted'); setSidebarOpen(false) }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors mb-0.5 ${activeFilter === 'uncontacted' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <span>Uncontacted</span>
          <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${activeFilter === 'uncontacted' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
            {uncontacted.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveFilter('all'); setSidebarOpen(false) }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors mb-0.5 ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <span>All Candidates</span>
          <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${activeFilter === 'all' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
            {requests.filter((r) => !r.archived).length}
          </span>
        </button>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-4 mb-2">Stages</p>
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveFilter(s); setSidebarOpen(false) }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors mb-0.5 ${activeFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span>{STAGE_LABELS[s]}</span>
            <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${activeFilter === s ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
              {stageCounts[s]}
            </span>
          </button>
        ))}

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-4 mb-2">Filters</p>
        <div className="px-2 space-y-3">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1.5">Min star rating</p>
            <div className="flex gap-1.5 flex-wrap">
              {[0, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setStarFilter(v)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${starFilter === v ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {v === 0 ? 'Any' : `${v}+★`}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            <span className="text-xs text-slate-600 font-medium">Verified only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-slate-600 w-4 h-4" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            <span className="text-xs text-slate-600 font-medium">Show archived</span>
          </label>
        </div>
      </nav>

      {/* Discover more */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleDiscoverMore}
          disabled={discoverMore}
          className="btn-secondary w-full text-xs py-2.5 disabled:opacity-60"
        >
          {discoverMore ? 'Searching…' : '+ Discover More Candidates'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 md:pl-60 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 bg-white border-b border-slate-200 px-4 h-14 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-slate-900 text-sm truncate">{find.role_title}</span>
        </div>

        <div className={`flex flex-1 ${selectedPanel ? 'overflow-hidden' : ''}`}>

          {/* Candidate list */}
          <div className={`flex-1 min-w-0 ${selectedPanel ? 'hidden md:block md:flex-[2]' : ''}`}>
            <div className="p-5 sm:p-6">

              {/* List header */}
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div>
                  <h1 className="font-bold text-slate-900 text-base">
                    {activeFilter === 'uncontacted' ? 'Uncontacted Matches'
                      : activeFilter === 'all' ? 'All Candidates'
                      : STAGE_LABELS[activeFilter as RequestStage]}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {activeFilter === 'uncontacted' ? `${uncontacted.length} AI-matched profiles` : `${filteredRequests.length} candidates`}
                  </p>
                </div>
                {activeFilter !== 'uncontacted' && (
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

              {/* Uncontacted discovery mode */}
              {activeFilter === 'uncontacted' ? (
                <>
                  {uncontacted.length === 0 ? (
                    <div className="card p-12 text-center">
                      <p className="font-semibold text-slate-700 mb-2">No uncontacted candidates</p>
                      <p className="text-sm text-slate-500 mb-5">All matched candidates have been contacted, or no matches were found.</p>
                      <button onClick={handleDiscoverMore} disabled={discoverMore} className="btn-primary mx-auto inline-flex">
                        {discoverMore ? 'Searching…' : 'Search for New Candidates'}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Bulk action bar */}
                      <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-white rounded-2xl border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-indigo-600 w-4 h-4"
                            checked={selectedUncontacted.size === uncontacted.length && uncontacted.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUncontacted(new Set(uncontacted.map((c) => c.profile_id)))
                              else setSelectedUncontacted(new Set())
                            }}
                          />
                          <span className="text-sm font-semibold text-slate-700">
                            {selectedUncontacted.size > 0 ? `${selectedUncontacted.size} selected` : 'Select all'}
                          </span>
                        </label>
                        <button
                          onClick={handleBulkContact}
                          disabled={selectedUncontacted.size === 0 || contacting}
                          className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                        >
                          {contacting ? 'Sending…' : `Send Request to ${selectedUncontacted.size || '…'}`}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {uncontacted.map((c) => (
                          <UncontactedRow
                            key={c.id}
                            candidate={c}
                            selected={selectedUncontacted.has(c.profile_id)}
                            onToggle={() => setSelectedUncontacted((prev) => {
                              const next = new Set(Array.from(prev))
                              if (next.has(c.profile_id)) next.delete(c.profile_id)
                              else next.add(c.profile_id)
                              return next
                            })}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Pipeline candidates */
                filteredRequests.length === 0 ? (
                  <div className="card p-12 text-center">
                    <p className="font-semibold text-slate-700 mb-2">No candidates here yet</p>
                    <p className="text-sm text-slate-500">Send requests from the Uncontacted tab to start your pipeline.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRequests.map((req) => (
                      <CandidateRow
                        key={req.id}
                        request={req}
                        selected={selectedPanel === req.id}
                        onSelect={() => setSelectedPanel(selectedPanel === req.id ? null : req.id)}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selectedRequest && (
            <div className="fixed inset-0 z-50 md:static md:inset-auto md:flex-[1.2] md:min-w-[340px] md:max-w-[420px] bg-white md:border-l border-slate-200 md:h-[calc(100vh-0px)] md:sticky md:top-0 overflow-hidden">
              <CandidatePanel
                request={selectedRequest}
                find={find}
                candidateScore={candidateScores[selectedRequest.profile_id]}
                onClose={() => setSelectedPanel(null)}
                onStageChange={handleStageChange}
                onArchive={handleArchive}
                onStarChange={handleStarChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
