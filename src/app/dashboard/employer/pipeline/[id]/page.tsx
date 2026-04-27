'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'
import type { TalentFind, TalentFindCandidate, InterviewRequest, RequestStage } from '@/types'
import { STAGE_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'

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

  const questions = (find.custom_questions ?? []) as string[]
  const answers = (request.question_answers ?? {}) as Record<string, string>

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
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
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" src={profile?.user_profiles?.avatar_url} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900">{name}</p>
              {profile?.user_profiles?.is_verified && (
                <span className="inline-flex items-center justify-center w-4 h-4 bg-indigo-600 rounded-full" title="Verified">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{profile?.role_title}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                request.status === 'accepted' ? 'bg-emerald-100 text-emerald-700'
                : request.status === 'declined' ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
              }`}>
                {request.status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                request.stage === 'hired' ? 'bg-emerald-100 text-emerald-700'
                : request.stage === 'offer' ? 'bg-amber-100 text-amber-700'
                : request.stage === 'interview' ? 'bg-violet-100 text-violet-700'
                : request.stage === 'interested' ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-600'
              }`}>
                {STAGE_LABELS[request.stage]}
              </span>
            </div>
          </div>
        </div>

        {/* AI score */}
        {candidateScore && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">AI Match Score</p>
              <span className="text-xl font-black text-indigo-700">{candidateScore.ai_score}%</span>
            </div>
            {candidateScore.ai_summary && (
              <p className="text-xs text-indigo-600 leading-relaxed">{candidateScore.ai_summary}</p>
            )}
          </div>
        )}

        {/* Star rating */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your rating</p>
          <StarRating value={request.star_rating} onChange={handleStar} />
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</p>
          <textarea
            rows={3}
            className="input-base resize-none text-sm w-full"
            placeholder="Add private notes about this candidate…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
          />
          {saving && <p className="text-xs text-slate-400 mt-1">Saving…</p>}
        </div>

        {/* Q&A */}
        {questions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Screening Q&A</p>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold text-slate-700 mb-1">{q}</p>
                  <p className={`text-sm leading-relaxed p-2.5 rounded-lg border ${
                    answers[`q${i}`]
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-slate-50 border-slate-100 text-slate-400 italic'
                  }`}>
                    {answers[`q${i}`] || 'No answer yet'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stage nav */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Move stage</p>
          <div className="flex gap-2">
            {prevStage && (
              <button
                onClick={() => onStageChange(request.id, prevStage)}
                className="flex-1 btn-secondary text-xs py-2"
              >
                ← {STAGE_LABELS[prevStage]}
              </button>
            )}
            {nextStage && (
              <button
                onClick={() => onStageChange(request.id, nextStage)}
                className="flex-1 btn-primary text-xs py-2"
              >
                {STAGE_LABELS[nextStage]} →
              </button>
            )}
          </div>
        </div>

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

// ─── Candidate Row ────────────────────────────────────────────────────────────
function CandidateRow({
  request,
  candidateScore,
  selected,
  onSelect,
}: {
  request: InterviewRequest
  candidateScore?: TalentFindCandidate
  selected: boolean
  onSelect: () => void
}) {
  const profile = request.profiles
  const name = profile?.user_profiles?.full_name ?? 'Talent'

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-colors text-left ${
        selected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'
      }`}
    >
      <Avatar name={name} size="sm" src={profile?.user_profiles?.avatar_url} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
          {profile?.user_profiles?.is_verified && (
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-indigo-600 rounded-full flex-shrink-0" title="Verified">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
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
        {candidateScore && (
          <span className="text-[10px] font-bold text-indigo-500">{candidateScore.ai_score}%</span>
        )}
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
  const [candidateScores, setCandidateScores] = useState<Record<string, TalentFindCandidate>>({})
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | RequestStage>('all')
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null)
  const [starFilter, setStarFilter] = useState<number>(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'ai_score' | 'star_rating' | 'date' | 'name'>('ai_score')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [editReqs, setEditReqs] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

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

    let profileIds: string[] = []
    if (scoresRes.ok) {
      const scores: TalentFindCandidate[] = await scoresRes.json()
      const map: Record<string, TalentFindCandidate> = {}
      scores.forEach((c) => { map[c.profile_id] = c })
      setCandidateScores(map)
      profileIds = scores.map((c) => c.profile_id)
    }

    if (profileIds.length > 0) {
      const { data } = await supabase
        .from('interview_requests')
        .select('*, profiles(*, user_profiles!profiles_user_id_user_profiles_fkey(*))')
        .in('profile_id', profileIds)
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

  const saveSettings = async () => {
    if (!find) return
    setSavingSettings(true)
    const res = await fetch(`/api/talent-finds/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editDesc, requirements_text: editReqs || null }),
    })
    if (res.ok) {
      const updated = await res.json()
      setFind(updated)
    }
    setSavingSettings(false)
    setSettingsOpen(false)
  }

  const filteredRequests = requests.filter((r) => {
    if (!showArchived && r.archived) return false
    if (showArchived && !r.archived) return false
    if (activeFilter !== 'all' && r.stage !== activeFilter) return false
    if (starFilter > 0 && (r.star_rating ?? 0) < starFilter) return false
    if (verifiedOnly && !r.profiles?.user_profiles?.is_verified) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'star_rating') return (b.star_rating ?? 0) - (a.star_rating ?? 0)
    if (sortBy === 'ai_score') {
      return (candidateScores[b.profile_id]?.ai_score ?? 0) - (candidateScores[a.profile_id]?.ai_score ?? 0)
    }
    if (sortBy === 'name') {
      return (a.profiles?.user_profiles?.full_name ?? '').localeCompare(b.profiles?.user_profiles?.full_name ?? '')
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
      {/* Sidebar header */}
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
        {/* All */}
        <NavItem
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          label="All Candidates"
          count={requests.filter((r) => !r.archived).length}
          active={activeFilter === 'all'}
          onClick={() => { setActiveFilter('all'); setSidebarOpen(false) }}
        />

        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 mt-3 mb-1">Stages</p>

        <NavItem
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          label="Discovered"
          count={stageCounts['discovered']}
          active={activeFilter === 'discovered'}
          onClick={() => { setActiveFilter('discovered'); setSidebarOpen(false) }}
        />
        <NavItem
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          label="Interested"
          count={stageCounts['interested']}
          active={activeFilter === 'interested'}
          onClick={() => { setActiveFilter('interested'); setSidebarOpen(false) }}
        />
        <NavItem
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          label="Interview"
          count={stageCounts['interview']}
          active={activeFilter === 'interview'}
          onClick={() => { setActiveFilter('interview'); setSidebarOpen(false) }}
        />
        <NavItem
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          label="Offer"
          count={stageCounts['offer']}
          active={activeFilter === 'offer'}
          onClick={() => { setActiveFilter('offer'); setSidebarOpen(false) }}
        />
        <NavItem
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
          label="Hired"
          count={stageCounts['hired']}
          active={activeFilter === 'hired'}
          onClick={() => { setActiveFilter('hired'); setSidebarOpen(false) }}
        />

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
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-slate-500 w-3.5 h-3.5" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            <span className="text-[11px] text-slate-500 font-medium">Show archived</span>
          </label>
        </div>
      </nav>

      {/* Job settings button */}
      <div className="p-2 border-t border-slate-100">
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
      <div className="flex-1 md:pl-60 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 bg-white border-b border-slate-200 px-4 h-14 sticky top-0 z-40">
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
                    {activeFilter === 'all' ? 'All Candidates' : STAGE_LABELS[activeFilter as RequestStage]}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">{filteredRequests.length} candidates</p>
                </div>
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
              </div>

              {filteredRequests.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="font-semibold text-slate-700 mb-2">No candidates here yet</p>
                  <p className="text-sm text-slate-500">
                    {activeFilter !== 'all'
                      ? 'No candidates in this stage. Try selecting a different stage.'
                      : 'Candidates will appear here after your Talent Find processes.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRequests.map((req) => (
                    <CandidateRow
                      key={req.id}
                      request={req}
                      candidateScore={candidateScores[req.profile_id]}
                      selected={selectedPanel === req.id}
                      onSelect={() => setSelectedPanel(selectedPanel === req.id ? null : req.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right detail panel */}
          {selectedRequest && find && (
            <>
              {/* Mobile full-screen */}
              <div className="md:hidden fixed inset-0 z-[70] bg-white overflow-y-auto">
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

              {/* Desktop slide-over */}
              <div className="hidden md:flex flex-col w-80 xl:w-96 bg-white border-l border-slate-200 sticky top-0 h-screen overflow-hidden">
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
            </>
          )}
        </div>
      </div>

      {/* Job settings modal */}
      {settingsOpen && find && (
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
              {find.salary_min || find.salary_max ? (
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
                <textarea
                  rows={6}
                  className="input-base w-full resize-none text-sm"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Requirements</label>
                <textarea
                  rows={4}
                  className="input-base w-full resize-none text-sm"
                  placeholder="Additional requirements, process details…"
                  value={editReqs}
                  onChange={(e) => setEditReqs(e.target.value)}
                />
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
