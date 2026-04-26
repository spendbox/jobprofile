'use client'

import { useEffect, useState } from 'react'

interface RoleTitle {
  id: string
  title: string
  created_at: string
}

export default function AdminRoleTitlesPage() {
  const [titles, setTitles] = useState<RoleTitle[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/role-titles')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setTitles(d)
        } else {
          setError(d?.error ?? 'Failed to load titles — run migration 20260426000003 in Supabase SQL Editor')
        }
        setLoading(false)
      })
      .catch(() => { setError('Network error'); setLoading(false) })
  }, [])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/admin/role-titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setAdding(false); return }
    setTitles((prev) => [...prev, data].sort((a, b) => a.title.localeCompare(b.title)))
    setNewTitle('')
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const res = await fetch('/api/admin/role-titles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setTitles((prev) => prev.filter((t) => t.id !== id))
    setDeletingId(null)
  }

  const filtered = titles.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Role Titles</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage the searchable list of job titles shown to talents when creating a profile.
          {!loading && titles.length > 0 && <span className="ml-1 text-slate-500">({titles.length} total)</span>}
        </p>
      </div>

      {error && titles.length === 0 && (
        <div className="mb-6 bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* Add form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-2">Add Title</label>
        <div className="flex gap-3">
          <input
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Prompt Engineer"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newTitle.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* Search */}
      <input
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
        placeholder="Search titles…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* List */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-sm">{search ? 'No results.' : 'No titles yet.'}</p>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-slate-200">{t.title}</span>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 font-medium transition-colors"
              >
                {deletingId === t.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
