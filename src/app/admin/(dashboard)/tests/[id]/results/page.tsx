'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'

interface Attempt {
  id: string
  user_id: string
  test_id: string
  score: number
  passed: boolean
  completed_at: string
  user_name: string
  user_email: string
}

export default function TestResultsPage() {
  const params = useParams()
  const id = params.id as string

  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [testTitle, setTestTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/tests/${id}/results`).then((r) => r.json()),
      fetch(`/api/admin/tests/${id}`).then((r) => r.json()),
    ]).then(([attemptData, testData]) => {
      setAttempts(attemptData)
      setTestTitle(testData.title ?? 'Test')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const passed = attempts.filter((a) => a.passed).length
  const avg = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading results…</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/tests" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 mb-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tests
        </Link>
        <h1 className="text-2xl font-black text-white">{testTitle}</h1>
        <p className="text-sm text-slate-400 mt-1">Attempt Results</p>
      </div>

      {/* Summary stats */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Attempts', value: attempts.length },
            { label: 'Passed', value: passed },
            { label: 'Avg Score', value: `${avg}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 font-medium">No attempts yet for this test.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className={`h-0.5 ${attempt.passed ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <div className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300 font-bold text-sm">
                  {attempt.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-white text-sm">{attempt.user_name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      attempt.passed
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{attempt.user_email}</p>
                  <p className="text-xs text-slate-500 mt-1">{timeAgo(attempt.completed_at)}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className={`text-2xl font-black ${attempt.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {attempt.score}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
