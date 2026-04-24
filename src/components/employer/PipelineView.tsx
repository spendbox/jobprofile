'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import type { InterviewRequest, RequestStage } from '@/types'
import { STAGE_LABELS } from '@/types'

const STAGES: RequestStage[] = ['discovered', 'interested', 'interview', 'offer', 'hired']

const stageColors: Record<RequestStage, string> = {
  discovered: 'border-slate-300',
  interested: 'border-indigo-400',
  interview: 'border-violet-400',
  offer: 'border-amber-400',
  hired: 'border-emerald-400',
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
    <div className={`bg-white rounded-xl border-l-4 ${stageColors[request.stage]} border border-slate-200 p-3 shadow-sm`}>
      <div className="flex items-center gap-2">
        <Avatar name={name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
          <p className="text-xs text-slate-500 truncate">{profile?.role_title}</p>
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-slate-600">
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <p className="text-xs text-slate-500">
            Status:{' '}
            <span className={`font-medium ${request.status === 'accepted' ? 'text-emerald-600' : request.status === 'declined' ? 'text-red-600' : 'text-amber-600'}`}>
              {request.status}
            </span>
          </p>
          <div className="flex gap-2">
            {nextStage && (
              <button
                onClick={() => onStageChange(request.id, nextStage)}
                className="btn-primary flex-1 text-xs py-1.5"
              >
                Move to {STAGE_LABELS[nextStage]}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function PipelineView({ requests, onStageChange }: PipelineViewProps) {
  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = requests.filter((r) => r.stage === stage)
    return acc
  }, {} as Record<RequestStage, InterviewRequest[]>)

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 pb-4 min-w-max">
        {STAGES.map((stage) => (
          <div key={stage} className="w-52 flex-shrink-0">
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-2 ${stageHeaderColors[stage]}`}>
              <span className="text-xs font-semibold">{STAGE_LABELS[stage]}</span>
              <span className="text-xs font-bold">{grouped[stage].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[stage].length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6 rounded-xl border border-dashed border-slate-200">
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
