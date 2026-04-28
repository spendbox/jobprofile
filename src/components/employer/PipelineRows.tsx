'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import type { TalentFind, TalentFindCandidate, InterviewRequest, RequestStage } from '@/types'
import { STAGE_LABELS } from '@/types'

const STAGES: RequestStage[] = ['discovered', 'interested', 'interview', 'offer', 'hired']

// ─── StarRating ───────────────────────────────────────────────────────────────
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

// ─── Verified badge ───────────────────────────────────────────────────────────
function VerifiedBadge() {
  return (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-indigo-600 rounded-full flex-shrink-0" title="Verified">
      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </span>
  )
}

// ─── ChevronIcon ──────────────────────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

// ─── UncontactedRow ───────────────────────────────────────────────────────────
export function UncontactedRow({
  candidate,
  expanded,
  onExpand,
  selected,
  onSelect,
  onInvite,
  inviting,
  findId,
  onTfcUpdate,
}: {
  candidate: TalentFindCandidate
  expanded: boolean
  onExpand: () => void
  selected: boolean
  onSelect: () => void
  onInvite: () => void
  inviting: boolean
  findId: string
  onTfcUpdate: (profileId: string, patch: { notes?: string; star_rating?: number }) => void
}) {
  const profile = candidate.profiles
  const name = profile?.user_profiles?.full_name ?? 'Talent'
  const [notes, setNotes] = useState(candidate.notes ?? '')
  const [saving, setSaving] = useState(false)

  const saveNotes = async () => {
    if (notes === (candidate.notes ?? '')) return
    setSaving(true)
    const res = await fetch(`/api/talent-finds/${findId}/candidates/${candidate.profile_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    if (res.ok) onTfcUpdate(candidate.profile_id, { notes })
    setSaving(false)
  }

  const handleStar = async (rating: number) => {
    const res = await fetch(`/api/talent-finds/${findId}/candidates/${candidate.profile_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ star_rating: rating }),
    })
    if (res.ok) onTfcUpdate(candidate.profile_id, { star_rating: rating })
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${expanded ? 'border-indigo-200' : 'border-slate-100 bg-white'}`}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="accent-indigo-600 w-4 h-4 flex-shrink-0 cursor-pointer"
        />
        <button onClick={onExpand} className="flex-1 flex items-center gap-3 text-left min-w-0">
          <Avatar name={name} size="sm" src={profile?.user_profiles?.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
              {profile?.user_profiles?.is_verified && <VerifiedBadge />}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{profile?.role_title}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 mr-1">
            <span className="text-[10px] font-bold text-indigo-500">{candidate.ai_score}%</span>
            {candidate.star_rating && (
              <span className="text-amber-400 text-xs leading-none">{'★'.repeat(candidate.star_rating)}</span>
            )}
          </div>
          <ChevronIcon open={expanded} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onInvite() }}
          disabled={inviting}
          className="text-xs px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {inviting ? '…' : 'Invite'}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-white p-4 space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">AI Match Score</p>
              <span className="text-xl font-black text-indigo-700">{candidate.ai_score}%</span>
            </div>
            {candidate.ai_summary && (
              <p className="text-xs text-indigo-600 leading-relaxed">{candidate.ai_summary}</p>
            )}
          </div>

          {(profile?.skills ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {profile!.skills.slice(0, 10).map((s) => (
                  <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {profile?.bio && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Bio</p>
              <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">{profile.bio}</p>
            </div>
          )}

          {(profile?.years_experience ?? 0) > 0 && (
            <p className="text-xs text-slate-500">{profile!.years_experience} years experience</p>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your rating</p>
            <StarRating value={candidate.star_rating} onChange={handleStar} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</p>
            <textarea
              rows={3}
              className="input-base resize-none text-sm w-full"
              placeholder="Add private notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
            />
            {saving && <p className="text-xs text-slate-400 mt-1">Saving…</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <Link href={`/profile/${candidate.profile_id}`} target="_blank" className="btn-secondary text-xs py-2">
              View Profile →
            </Link>
            <button
              onClick={onInvite}
              disabled={inviting}
              className="btn-primary text-xs py-2 flex-1 disabled:opacity-50"
            >
              {inviting ? 'Inviting…' : 'Invite this candidate'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ContactedRow ─────────────────────────────────────────────────────────────
export function ContactedRow({
  request,
  tfc,
  find,
  expanded,
  onExpand,
  onStageChange,
  onArchive,
  onUnarchive,
  findId,
  onTfcUpdate,
}: {
  request: InterviewRequest
  tfc?: TalentFindCandidate
  find: TalentFind
  expanded: boolean
  onExpand: () => void
  onStageChange: (id: string, stage: RequestStage) => void
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  findId: string
  onTfcUpdate: (profileId: string, patch: { notes?: string; star_rating?: number }) => void
}) {
  const profile = request.profiles
  const name = profile?.user_profiles?.full_name ?? 'Talent'
  const currentIdx = STAGES.indexOf(request.stage)
  const [notes, setNotes] = useState(tfc?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const saveNotes = async () => {
    if (notes === (tfc?.notes ?? '')) return
    setSaving(true)
    const res = await fetch(`/api/talent-finds/${findId}/candidates/${request.profile_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    if (res.ok) onTfcUpdate(request.profile_id, { notes })
    setSaving(false)
  }

  const handleStar = async (rating: number) => {
    const res = await fetch(`/api/talent-finds/${findId}/candidates/${request.profile_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ star_rating: rating }),
    })
    if (res.ok) onTfcUpdate(request.profile_id, { star_rating: rating })
  }

  const questions = (find.custom_questions ?? []) as string[]
  const answers = (request.question_answers ?? {}) as Record<string, string>

  const stageBadgeClass =
    request.stage === 'hired' ? 'bg-emerald-100 text-emerald-700'
    : request.stage === 'offer' ? 'bg-amber-100 text-amber-700'
    : request.stage === 'interview' ? 'bg-violet-100 text-violet-700'
    : request.stage === 'interested' ? 'bg-indigo-100 text-indigo-700'
    : 'bg-slate-100 text-slate-600'

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${expanded ? 'border-indigo-200' : 'border-slate-100 bg-white'}`}>
      {/* Row header */}
      <button onClick={onExpand} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
        <Avatar name={name} size="sm" src={profile?.user_profiles?.avatar_url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
            {profile?.user_profiles?.is_verified && <VerifiedBadge />}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{profile?.role_title}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 mr-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${stageBadgeClass}`}>
            {STAGE_LABELS[request.stage]}
          </span>
          {tfc && <span className="text-[10px] font-bold text-indigo-500">{tfc.ai_score}%</span>}
          {tfc?.star_rating && (
            <span className="text-amber-400 text-xs leading-none">{'★'.repeat(tfc.star_rating)}</span>
          )}
        </div>
        <ChevronIcon open={expanded} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-white p-4 space-y-4">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <Avatar name={name} size="lg" src={profile?.user_profiles?.avatar_url} />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{name}</p>
                {profile?.user_profiles?.is_verified && <VerifiedBadge />}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{profile?.role_title}</p>
            </div>
          </div>

          {/* AI score */}
          {tfc && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">AI Match Score</p>
                <span className="text-xl font-black text-indigo-700">{tfc.ai_score}%</span>
              </div>
              {tfc.ai_summary && (
                <p className="text-xs text-indigo-600 leading-relaxed">{tfc.ai_summary}</p>
              )}
            </div>
          )}

          {/* Star rating */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your rating</p>
            <StarRating value={tfc?.star_rating} onChange={handleStar} />
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</p>
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
                    <p className={`text-sm leading-relaxed p-2.5 rounded-lg border ${answers[`q${i}`] ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-400 italic'}`}>
                      {answers[`q${i}`] || 'No answer yet'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage nav */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pipeline stage</p>
            {request.stage === 'discovered' ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                Waiting for candidate response…
              </p>
            ) : (
              <div className="flex gap-2">
                {/* For 'interested', prev would go back to 'discovered' (candidate-driven) — hide it.
                    For interview/offer/hired, show full prev/next. */}
                {request.stage !== 'interested' && currentIdx > 1 && (
                  <button
                    onClick={() => onStageChange(request.id, STAGES[currentIdx - 1])}
                    className="flex-1 btn-secondary text-xs py-2"
                  >
                    ← {STAGE_LABELS[STAGES[currentIdx - 1]]}
                  </button>
                )}
                {currentIdx < STAGES.length - 1 && (
                  <button
                    onClick={() => onStageChange(request.id, STAGES[currentIdx + 1])}
                    className="flex-1 btn-primary text-xs py-2"
                  >
                    {STAGE_LABELS[STAGES[currentIdx + 1]]} →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile link */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/profile/${request.profile_id}`} target="_blank" className="btn-secondary text-xs py-2">
              View Full Profile →
            </Link>
          </div>

          {/* Archive / Unarchive */}
          {request.archived ? (
            <button
              onClick={() => onUnarchive(request.id)}
              className="w-full text-xs py-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
            >
              Unarchive candidate
            </button>
          ) : (
            <button
              onClick={() => onArchive(request.id)}
              className="w-full text-xs py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              Archive candidate
            </button>
          )}
        </div>
      )}
    </div>
  )
}
