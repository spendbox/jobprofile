'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface TestQuestion {
  id: string
  text: string
  options: string[]
}

interface TestData {
  id: string
  title: string
  description?: string
  skill_category: string
  questions: TestQuestion[]
  passing_score: number
  time_limit_minutes: number
}

type Phase = 'loading' | 'ready' | 'taking' | 'submitting' | 'done'

interface Result {
  score: number
  passed: boolean
  correct_count: number
  total_questions: number
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TakeTestPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [phase, setPhase] = useState<Phase>('loading')
  const [test, setTest] = useState<TestData | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    supabase.rpc('get_test_for_attempt', { p_test_id: id }).then(({ data }) => {
      if (!data) { setError('Test not found or no longer available.'); setPhase('done'); return }
      setTest(data as TestData)
      setTimeLeft((data as TestData).time_limit_minutes * 60)
      setPhase('ready')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userProfile, loadingAuth])

  const submitTest = useCallback(async (answersToSubmit: Record<string, number>) => {
    setPhase('submitting')
    const { data, error: rpcErr } = await supabase.rpc('submit_test_attempt', {
      p_test_id: id,
      p_answers: answersToSubmit,
    })
    if (rpcErr || !data) {
      setError(rpcErr?.message ?? 'Submission failed. Please try again.')
      setPhase('taking')
      return
    }
    setResult(data as Result)
    setPhase('done')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Timer
  useEffect(() => {
    if (phase !== 'taking') return
    if (timeLeft <= 0) { submitTest(answers); return }
    const t = setInterval(() => setTimeLeft((prev) => {
      if (prev <= 1) { clearInterval(t); submitTest(answers); return 0 }
      return prev - 1
    }), 1000)
    return () => clearInterval(t)
  }, [phase, timeLeft, answers, submitTest])

  if (loadingAuth || phase === 'loading') {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading test…</div>
      </div>
    )
  }

  // Error / not found
  if (phase === 'done' && error) {
    return (
      <div className="page-container max-w-lg">
        <div className="card p-10 text-center">
          <p className="font-bold text-slate-900 mb-2">Test unavailable</p>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link href="/dashboard/talent/tests" className="btn-primary mx-auto">Back to Tests</Link>
        </div>
      </div>
    )
  }

  // Results screen
  if (phase === 'done' && result) {
    return (
      <div className="page-container max-w-lg">
        <div className="card overflow-hidden">
          <div className={`h-2 ${result.passed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <div className="p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
              result.passed ? 'bg-emerald-50' : 'bg-amber-50'
            }`}>
              {result.passed ? (
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-900 mb-1">
              {result.passed ? 'Test Passed!' : 'Keep Trying!'}
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              {result.passed
                ? 'You earned a skill badge that will appear on your profile.'
                : 'You can retake the test to improve your score.'}
            </p>

            <div className={`text-5xl font-black mb-1 ${result.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {result.score}%
            </div>
            <p className="text-sm text-slate-500 mb-6">
              {result.correct_count} of {result.total_questions} correct · {test?.passing_score}% needed to pass
            </p>

            <div className="flex gap-3">
              <Link href="/dashboard/talent/tests" className="flex-1 btn-secondary text-center">
                All Tests
              </Link>
              <Link href="/dashboard/talent" className="flex-1 btn-primary text-center">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Ready screen
  if (phase === 'ready' && test) {
    return (
      <div className="page-container max-w-lg">
        <Link href="/dashboard/talent/tests" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tests
        </Link>

        <div className="card p-8">
          <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wide mb-4">
            {test.skill_category}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{test.title}</h1>
          {test.description && (
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{test.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Questions', value: test.questions.length },
              { label: 'Time', value: `${test.time_limit_minutes}min` },
              { label: 'Pass at', value: `${test.passing_score}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="font-black text-slate-900 text-lg">{value}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              The timer starts when you begin. Answer all questions before time runs out. You can only submit once per test attempt.
            </p>
          </div>

          <button
            onClick={() => setPhase('taking')}
            className="btn-primary w-full text-center"
          >
            Start Test
          </button>
        </div>
      </div>
    )
  }

  // Test-taking screen
  if ((phase === 'taking' || phase === 'submitting') && test) {
    const q = test.questions[currentQ]
    const answered = Object.keys(answers).length
    const isLast = currentQ === test.questions.length - 1

    return (
      <div className="page-container max-w-lg">
        {/* Timer + progress */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {test.questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentQ ? 'w-6 bg-indigo-500'
                    : answers[test.questions[i].id] !== undefined ? 'w-2 bg-indigo-300'
                    : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">{currentQ + 1}/{test.questions.length}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${
            timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Question {currentQ + 1}</p>
          <p className="text-base font-semibold text-slate-900 leading-relaxed mb-6">{q.text}</p>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i
              return (
                <button
                  key={i}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className={`inline-block w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 align-middle transition-colors ${
                    selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                  }`} />
                  {opt}
                </button>
              )
            })}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
              disabled={currentQ === 0}
              className="btn-secondary px-4 py-2.5 disabled:opacity-30"
            >
              Back
            </button>
            <div className="flex-1" />
            {isLast ? (
              <button
                onClick={() => submitTest(answers)}
                disabled={phase === 'submitting' || answered < test.questions.length}
                className="btn-primary px-6 py-2.5 disabled:opacity-50"
              >
                {phase === 'submitting' ? 'Submitting…' : `Submit (${answered}/${test.questions.length})`}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ((prev) => Math.min(test.questions.length - 1, prev + 1))}
                className="btn-primary px-6 py-2.5"
              >
                Next
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}
      </div>
    )
  }

  return null
}
