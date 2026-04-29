'use client'

import { useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'

interface AdminUser {
  id: string
  full_name: string
  email: string
  is_verified: boolean
  verified_at: string | null
  verification_doc_path: string | null
  verification_liveness_path: string | null
  verification_legal_name: string | null
  verification_liveness_phrase: string | null
  verification_requested_at: string | null
  created_at: string
}

type MediaModal = { type: 'doc' | 'video'; url: string; name: string } | null

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all')
  const [mediaModal, setMediaModal] = useState<MediaModal>(null)
  const [mediaLoading, setMediaLoading] = useState<string | null>(null)

  const loadUsers = () => {
    fetch(`/api/admin/users?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setUsers(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

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
        // Re-fetch to confirm DB state rather than trusting optimistic update
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...updated } : u))
      } else {
        const err = await res.json()
        alert(`Failed to update: ${err.error ?? 'Unknown error'}`)
      }
    } finally {
      setToggling(null)
    }
  }

  const openMedia = async (userId: string, type: 'doc' | 'video', userName: string) => {
    setMediaLoading(`${userId}-${type}`)
    try {
      const endpoint = type === 'doc' ? 'doc' : 'liveness'
      const res = await fetch(`/api/admin/users/${userId}/${endpoint}`)
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? 'Could not load file. Check storage configuration.')
        return
      }
      const { url } = await res.json()
      setMediaModal({ type, url, name: userName })
    } finally {
      setMediaLoading(null)
    }
  }

  const pendingCount = users.filter((u) => u.verification_doc_path && !u.is_verified).length

  const filtered = users
    .filter((u) => {
      if (filter === 'pending') return u.verification_doc_path && !u.is_verified
      if (filter === 'verified') return u.is_verified
      return true
    })
    .filter((u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
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

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {([
          { key: 'all', label: 'All' },
          { key: 'pending', label: `Pending Review${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { key: 'verified', label: 'Verified' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-sm text-slate-500">Loading users…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 font-medium">
            {search ? 'No users match your search.' : filter === 'pending' ? 'No pending verification requests.' : 'No talent users yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => {
            const hasPendingDoc = !!user.verification_doc_path && !user.is_verified
            const loadingDoc = mediaLoading === `${user.id}-doc`
            const loadingVid = mediaLoading === `${user.id}-video`
            return (
              <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className={`h-0.5 ${user.is_verified ? 'bg-emerald-500' : hasPendingDoc ? 'bg-amber-500' : 'bg-slate-700'}`} />
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
                      {hasPendingDoc && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          Pending Review
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                    {user.verification_legal_name && (
                      <p className="text-xs text-slate-300 mt-0.5">
                        <span className="text-slate-500">Legal name: </span>
                        {user.verification_legal_name}
                      </p>
                    )}
                    {user.verification_liveness_phrase && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2.5 py-1">
                        <svg className="w-3 h-3 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-indigo-300">Phrase: </span>
                        <span className="text-xs font-bold text-indigo-200 tracking-wide">{user.verification_liveness_phrase}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                      <span>Joined {timeAgo(user.created_at)}</span>
                      {hasPendingDoc && user.verification_requested_at && (
                        <span className="text-amber-500">Submitted {timeAgo(user.verification_requested_at)}</span>
                      )}
                      {user.is_verified && user.verified_at && (
                        <span className="text-emerald-500">Verified {timeAgo(user.verified_at)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {user.verification_liveness_path && (
                      <button
                        onClick={() => openMedia(user.id, 'video', user.full_name)}
                        disabled={!!mediaLoading}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {loadingVid ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                        View Video
                      </button>
                    )}
                    {user.verification_doc_path && (
                      <button
                        onClick={() => openMedia(user.id, 'doc', user.full_name)}
                        disabled={!!mediaLoading}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {loadingDoc ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        View Doc
                      </button>
                    )}
                    <button
                      onClick={() => toggleVerify(user)}
                      disabled={toggling === user.id}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                        user.is_verified
                          ? 'bg-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 hover:border-red-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {toggling === user.id ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : user.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Media viewer modal */}
      {mediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <p className="font-semibold text-white text-sm">
                  {mediaModal.type === 'video' ? 'Liveness Video' : 'Identity Document'} — {mediaModal.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mediaModal.type === 'video' ? 'Verify the candidate says the correct liveness phrase.' : 'Check identity document details.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={mediaModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in tab
                </a>
                <button
                  onClick={() => setMediaModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Media content */}
            <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4 min-h-0">
              {mediaModal.type === 'video' ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={mediaModal.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[60vh] rounded-xl"
                  style={{ maxHeight: '60vh' }}
                />
              ) : (
                <iframe
                  src={mediaModal.url}
                  className="w-full rounded-xl border border-slate-800"
                  style={{ height: '60vh' }}
                  title="Identity Document"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
