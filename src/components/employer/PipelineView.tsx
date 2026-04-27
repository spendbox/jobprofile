'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import type { InterviewRequest, RequestStage } from '@/types'
import { STAGE_LABELS } from '@/types'

const STAGES: RequestStage[] = ['discovered', 'interested', 'interview', 'offer', 'hired']

const stageAccent: Record<RequestStage, string> = {
  discovered: 'bg-slate-400',
  interested: 'bg-indigo-500',
  interview: 'bg-violet-500',
  offer: 'bg-amber-500',
  hired: 'bg-emerald-500',
}

const stageHeaderColors: Record<RequestStage, string> = {
  discovered: 'bg-slate-100 text-slate-700',
  interested: 'bg-indigo-100 text-indigo-700',
  interview: 'bg-violet-100 text-violet-700',
  offer: 'bg-amber-100 text-amber-700',
  hired: 'bg-emerald-100 text-emerald-700',
}

interface PipelineViewProps {
  requests: InterviewRequest[]
  onStageChange: (requestId: string, stage: RequestStage) => void
  onArchive: (requestId: string) => void
  openingFilter?: string
}

function PipelineCard({
  request,
  onStageChange,
  onArchive,
}: {
  request: InterviewRequest
  onStageChange: (requestId: string, stage: RequestStage) => void
  onArchive: (requestId: string) => void
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(request.notes ?? '')
  const [archiving, setArchiving] = useState(false)

  const profile = request.profiles
  const name = profile?.user_profiles?.full_name ?? 'Talent'
  const currentStageIdx = STAGES.indexOf(request.stage)
  const prevStage = STAGES[currentStageIdx - 1]
  const nextStage = STAGES[currentStageIdx + 1]

  const saveNotes = async () => {
    await supabase.from('interview_requests').update({ notes }).eq('id', request.id)
  }

  const handleArchive = async () => {
    setArchiving(true)
    await supabase.from('interview_requests').update({ archived: true }).eq('id', request.id)
    onArchive(request.id)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Stage colour stripe */}
      <div className={`h-0.5 ${stageAccent[request.stage]}`} />

      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{profile?.role_title}</p>
            {request.opening?.title && (
              <span className="inline-block mt-1 text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                {request.opening.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {notes && !open && (
              <span title="Has notes" className="text-slate-300">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </span>
            )}
            <button
              onClick={() => setOpen(!open)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold ${
                request.status === 'accepted' ? 'text-emerald-600'
                : request.status === 'declined' ? 'text-red-600'
                : 'text-amber-600'
              }`}>
                {request.status}
              </span>
            </div>

            {/* Notes */}
            <textarea
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-300"
              rows={3}
              placeholder="Add notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
            />

            {/* Stage navigation */}
            <div className="flex gap-2">
              {prevStage && (
                <button
                  onClick={() => onStageChange(request.id, prevStage)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  ← {STAGE_LABELS[prevStage]}
                </button>
              )}
              {nextStage && (
                <button
                  onClick={() => onStageChange(request.id, nextStage)}
                  className="btn-primary flex-1 text-xs py-2"
                >
                  {STAGE_LABELS[nextStage]} →
                </button>
              )}
            </div>

            {/* Archive */}
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="w-full text-xs py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              Archive
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function PipelineView({ requests, onStageChange, onArchive, openingFilter }: PipelineViewProps) {
  const visible = openingFilter
    ? requests.filter((r) => r.opening_id === openingFilter)
    : requests

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = visible.filter((r) => r.stage === stage)
    return acc
  }, {} as Record<RequestStage, InterviewRequest[]>)

  return (
    <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
      <div className="flex gap-4 pb-4 min-w-max">
        {STAGES.map((stage) => (
          <div key={stage} className="w-56 flex-shrink-0">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-3 ${stageHeaderColors[stage]}`}>
              <span className="text-xs font-bold tracking-wide">{STAGE_LABELS[stage]}</span>
              <span className="text-xs font-black bg-white/60 px-1.5 py-0.5 rounded-md">
                {grouped[stage].length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {grouped[stage].length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8 rounded-2xl border-2 border-dashed border-slate-200">
                  Empty
                </div>
              ) : (
                grouped[stage].map((req) => (
                  <PipelineCard key={req.id} request={req} onStageChange={onStageChange} onArchive={onArchive} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
