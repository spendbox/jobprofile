'use client'

import { useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'

interface AdminEmployer {
  id: string
  full_name: string
  email: string
  company_name: string | null
  company_website: string | null
  company_contact_email: string | null
  company_description: string | null
  company_hq_country: string | null
  company_hq_state: string | null
  company_timezone: string | null
  company_profile_complete: boolean | null
  avatar_url: string | null
  created_at: string
}

export default function AdminEmployersPage() {
  const [employers, setEmployers] = useState<AdminEmployer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/employers?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setEmployers(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const completeCount = employers.filter((e) => e.company_profile_complete).length

  const filtered = employers
    .filter((e) => {
      if (filter === 'complete') return e.company_profile_complete
      if (filter === 'incomplete') return !e.company_profile_complete
      return true
    })
    .filter((e) =>
      (e.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.company_name ?? '').toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-black text-white">Employers</h1>
          <p className="text-sm text-slate-400 mt-1">
            {employers.length} employer accounts · {completeCount} profiles complete
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or company…"
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-72"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {([
          { key: 'all', label: 'All' },
          { key: 'complete', label: 'Profile Complete' },
          { key: 'incomplete', label: 'Incomplete' },
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
          <div className="text-sm text-slate-500">Loading employers…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 font-medium">
            {search ? 'No employers match your search.' : 'No employer accounts yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((employer) => {
            const isExpanded = expanded === employer.id
            return (
              <div key={employer.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className={`h-0.5 ${employer.company_profile_complete ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar / Logo */}
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {employer.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={employer.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 font-bold text-sm">
                          {(employer.company_name ?? employer.full_name).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm">
                          {employer.company_name ?? employer.full_name}
                        </p>
                        {employer.company_profile_complete ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Profile Complete
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            Incomplete
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{employer.email}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Contact: {employer.full_name}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                        {employer.company_hq_country && (
                          <span>{employer.company_hq_country}{employer.company_hq_state ? `, ${employer.company_hq_state}` : ''}</span>
                        )}
                        {employer.company_timezone && <span>{employer.company_timezone}</span>}
                        <span>Joined {timeAgo(employer.created_at)}</span>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : employer.id)}
                      className="text-slate-400 hover:text-white transition-colors p-1 flex-shrink-0"
                    >
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                      {employer.company_description && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{employer.company_description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {employer.company_website && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Website</p>
                            <a href={employer.company_website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 truncate block">
                              {employer.company_website}
                            </a>
                          </div>
                        )}
                        {employer.company_contact_email && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contact Email</p>
                            <a href={`mailto:${employer.company_contact_email}`} className="text-xs text-indigo-400 hover:text-indigo-300 truncate block">
                              {employer.company_contact_email}
                            </a>
                          </div>
                        )}
                        {employer.company_timezone && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timezone</p>
                            <p className="text-xs text-slate-300">{employer.company_timezone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
