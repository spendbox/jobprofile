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
}

function PipelineCard({
  request,
  onStageChange,
}: {
  request: InterviewRequest
  onStageChange: (requestId: string, stage: RequestStage) => void
}) {
  const [open, setOpen] = useState(false)
  const profile = request.profiles
  const name = profile?.user_profiles?.full_name ?? 'Talent'
  const currentStageIdx = STAGES.indexOf(request.stage)
  const nextStage = STAGES[currentStageIdx + 1]

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
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
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
            {nextStage && (
              <button
                onClick={() => onStageChange(request.id, nextStage)}
                className="btn-primary w-full text-xs py-2"
              >
                Move to {STAGE_LABELS[nextStage]}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function PipelineView({ requests, onStageChange }: PipelineViewProps) {
  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = requests.filter((r) => r.stage === stage)
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
                  <PipelineCard key={req.id} request={req} onStageChange={onStageChange} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
