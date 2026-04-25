'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  totalTalent: number
  verified: number
  totalTests: number
  totalAttempts: number
  passedAttempts: number
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Overview</p>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading stats…</div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Talent Users" value={stats.totalTalent} />
          <StatCard
            label="Verified"
            value={stats.verified}
            sub={stats.totalTalent > 0 ? `${Math.round((stats.verified / stats.totalTalent) * 100)}% of talent` : undefined}
          />
          <StatCard
            label="Tests"
            value={stats.totalTests}
          />
          <StatCard label="Test Attempts" value={stats.totalAttempts} />
          <StatCard
            label="Passed"
            value={stats.passedAttempts}
            sub={stats.totalAttempts > 0 ? `${Math.round((stats.passedAttempts / stats.totalAttempts) * 100)}% pass rate` : undefined}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-500">Failed to load stats.</p>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/users"
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-6 group transition-colors"
        >
          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600/30 transition-colors">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-bold text-white mb-1">Manage Users</p>
          <p className="text-sm text-slate-400">Verify talent accounts and view test results.</p>
        </Link>

        <Link
          href="/admin/tests"
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-6 group transition-colors"
        >
          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600/30 transition-colors">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="font-bold text-white mb-1">Proficiency Tests</p>
          <p className="text-sm text-slate-400">Create and manage skill assessment tests.</p>
        </Link>
      </div>
    </div>
  )
}
