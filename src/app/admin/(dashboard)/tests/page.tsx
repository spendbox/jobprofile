'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'

interface TestListItem {
  id: string
  title: string
  description?: string
  skill_category: string
  passing_score: number
  time_limit_minutes: number
  is_active: boolean
  created_at: string
  attempts: { total: number; passed: number }
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<TestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    fetch('/api/admin/tests')
      .then((r) => r.json())
      .then((d) => { setTests(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/admin/tests/${deleteId}`, { method: 'DELETE' })
    setTests((prev) => prev.filter((t) => t.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const toggleActive = async (test: TestListItem) => {
    const res = await fetch(`/api/admin/tests/${test.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !test.is_active }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTests((prev) => prev.map((t) => t.id === test.id ? { ...t, ...updated } : t))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading tests…</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Assessment</p>
          <h1 className="text-2xl font-black text-white">Proficiency Tests</h1>
          <p className="text-sm text-slate-400 mt-1">{tests.length} test{tests.length !== 1 ? 's' : ''} created</p>
        </div>
        <Link href="/admin/tests/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-semibold text-white mb-2">No tests yet</p>
          <p className="text-sm text-slate-400 mb-6">Create your first proficiency test for talent to take.</p>
          <Link href="/admin/tests/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors inline-flex">
            Create Test
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className={`h-0.5 ${test.is_active ? 'bg-indigo-500' : 'bg-slate-700'}`} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-white">{test.title}</p>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {test.skill_category}
                      </span>
                      {!test.is_active && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {test.description && (
                      <p className="text-sm text-slate-400 mb-2 line-clamp-1">{test.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span>{test.passing_score}% to pass</span>
                      <span>{test.time_limit_minutes}min</span>
                      <span>{test.attempts.total} attempt{test.attempts.total !== 1 ? 's' : ''}</span>
                      {test.attempts.total > 0 && (
                        <span className="text-emerald-400">{test.attempts.passed} passed</span>
                      )}
                      <span>Created {timeAgo(test.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/tests/${test.id}/results`}
                      className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                      Results
                    </Link>
                    <Link
                      href={`/admin/tests/${test.id}`}
                      className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleActive(test)}
                      className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                      {test.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteId(test.id)}
                      className="text-xs text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-white mb-2">Delete test?</h3>
            <p className="text-sm text-slate-400 mb-6">All attempts associated with this test will also be deleted. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
