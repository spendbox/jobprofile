'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Question {
  id: string
  text: string
  options: [string, string, string, string]
  correct: number
}

function newQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    text: '',
    options: ['', '', '', ''],
    correct: 0,
  }
}

export default function NewTestPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skillCategory, setSkillCategory] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [timeLimit, setTimeLimit] = useState(30)
  const [isActive, setIsActive] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([newQuestion()])

  const addQuestion = () => setQuestions((prev) => [...prev, newQuestion()])

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, field: keyof Question, value: unknown) => {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, [field]: value } : q))
  }

  const updateOption = (qId: string, idx: number, value: string) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== qId) return q
      const opts = [...q.options] as [string, string, string, string]
      opts[idx] = value
      return { ...q, options: opts }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate questions
    for (const q of questions) {
      if (!q.text.trim()) { setError('All questions must have a text.'); return }
      if (q.options.some((o) => !o.trim())) { setError('All options must be filled in.'); return }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          skill_category: skillCategory,
          passing_score: passingScore,
          time_limit_minutes: timeLimit,
          is_active: isActive,
          questions,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to save')
        return
      }
      router.push('/admin/tests')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/tests" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 mb-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tests
        </Link>
        <h1 className="text-2xl font-black text-white">New Proficiency Test</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white text-sm">Test Details</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. React Fundamentals"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Skill Category *</label>
            <input
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. React, Python, Design"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Brief description shown to candidates…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Passing Score (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Time Limit (min)</label>
              <input
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsActive(!isActive)}
              className={`relative w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isActive ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm text-slate-300 font-medium">Active (visible to talent)</span>
          </label>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Questions ({questions.length})</h2>
          </div>

          {questions.map((q, qIdx) => (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-0.5">Q{qIdx + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="mb-4">
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                  rows={2}
                  placeholder="Question text…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, 'correct', i)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center ${
                        q.correct === i
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {q.correct === i && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(q.id, i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-500 mt-1">Click the circle to mark the correct answer.</p>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl py-4 text-sm font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            + Add Question
          </button>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/admin/tests" className="flex-1 text-center px-4 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : `Create Test (${questions.length} questions)`}
          </button>
        </div>
      </form>
    </div>
  )
}
