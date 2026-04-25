'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { TestAttempt } from '@/types'

interface AvailableTest {
  id: string
  title: string
  description?: string
  skill_category: string
  question_count: number
  passing_score: number
  time_limit_minutes: number
  created_at: string
}

export default function TalentTestsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [tests, setTests] = useState<AvailableTest[]>([])
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    const load = async () => {
      const [{ data: testData }, { data: attemptData }] = await Promise.all([
        supabase.rpc('get_available_tests'),
        supabase.from('test_attempts').select('*').eq('user_id', userProfile.id),
      ])
      setTests((testData as AvailableTest[]) ?? [])
      setAttempts((attemptData as TestAttempt[]) ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, loadingAuth])

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const attemptMap = Object.fromEntries(attempts.map((a) => [a.test_id, a]))

  return (
    <div className="page-container max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/talent" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <p className="section-label mb-1">Skill Assessment</p>
        <h1 className="text-2xl font-black text-slate-900">Proficiency Tests</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pass tests to earn badges that appear on your profile and boost credibility with employers.
        </p>
      </div>

      {tests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="font-bold text-slate-900">No tests available yet</p>
          <p className="text-sm text-slate-500 mt-1">Check back soon — the admin team will add proficiency tests here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const attempt = attemptMap[test.id]
            const hasPassed = attempt?.passed
            const hasFailed = attempt && !attempt.passed

            return (
              <div key={test.id} className="card overflow-hidden">
                {/* Status stripe */}
                <div className={`h-1 ${hasPassed ? 'bg-emerald-400' : hasFailed ? 'bg-amber-400' : 'bg-indigo-300'}`} />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      hasPassed ? 'bg-emerald-50' : 'bg-indigo-50'
                    }`}>
                      {hasPassed ? (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-bold text-slate-900">{test.title}</h3>
                          <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wide mt-1">
                            {test.skill_category}
                          </span>
                        </div>
                        {hasPassed && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Passed {attempt?.score}%
                          </span>
                        )}
                        {hasFailed && (
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0">
                            Score: {attempt?.score}%
                          </span>
                        )}
                      </div>

                      {test.description && (
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{test.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-3">
                        <span>{test.question_count} questions</span>
                        <span>{test.time_limit_minutes} min</span>
                        <span>{test.passing_score}% to pass</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      {hasPassed ? 'Badge earned — shows on your profile' : hasFailed ? 'Retake to improve your score' : 'Take this test to earn a skill badge'}
                    </p>
                    <Link
                      href={`/dashboard/talent/tests/${test.id}`}
                      className={`text-sm px-4 py-2 rounded-xl font-semibold transition-colors flex-shrink-0 ${
                        hasPassed
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'btn-primary'
                      }`}
                    >
                      {hasPassed ? 'Retake' : hasFailed ? 'Try Again' : 'Start Test'}
                    </Link>
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
