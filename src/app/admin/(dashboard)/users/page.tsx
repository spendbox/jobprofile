'use client'

import { useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'

interface AdminUser {
  id: string
  full_name: string
  email: string
  is_verified: boolean
  verified_at: string | null
  created_at: string
  attempts: { total: number; passed: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => { setUsers(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggleVerify = async (user: AdminUser) => {
    setToggling(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !user.is_verified }),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...updated } : u))
      }
    } finally {
      setToggling(null)
    }
  }

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading users…</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-black text-white">Talent Users</h1>
          <p className="text-sm text-slate-400 mt-1">{users.length} talent accounts</p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 font-medium">
            {search ? 'No users match your search.' : 'No talent users yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            >
              {/* Verification accent */}
              <div className={`h-0.5 ${user.is_verified ? 'bg-emerald-500' : 'bg-slate-700'}`} />

              <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold text-sm">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm">{user.full_name}</p>
                    {user.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    <span>Joined {timeAgo(user.created_at)}</span>
                    <span>{user.attempts.total} test{user.attempts.total !== 1 ? 's' : ''} taken</span>
                    {user.attempts.total > 0 && (
                      <span className={user.attempts.passed > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                        {user.attempts.passed} passed
                      </span>
                    )}
                    {user.is_verified && user.verified_at && (
                      <span className="text-emerald-500">Verified {timeAgo(user.verified_at)}</span>
                    )}
                  </div>
                </div>

                {/* Verify button */}
                <button
                  onClick={() => toggleVerify(user)}
                  disabled={toggling === user.id}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                    user.is_verified
                      ? 'bg-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 hover:border-red-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {toggling === user.id ? '…' : user.is_verified ? 'Unverify' : 'Verify'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
