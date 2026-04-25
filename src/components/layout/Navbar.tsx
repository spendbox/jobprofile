'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'

export function Navbar() {
  const { userProfile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const isAuthPage = pathname.startsWith('/auth')

  const dashboardHref = userProfile?.user_role === 'employer'
    ? '/dashboard/employer'
    : '/dashboard/talent'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
          <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          TalentDeck
        </Link>

        {!isAuthPage && (
          <nav className="flex items-center gap-2">
            {userProfile ? (
              <>
                <Link href="/search" className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                  Discover
                </Link>
                <Link href={dashboardHref} className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                  Dashboard
                </Link>
                <Link href="/requests" className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                  Requests
                </Link>
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 ml-1">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      {getInitials(userProfile.full_name)}
                    </div>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{userProfile.full_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{userProfile.user_role}</p>
                      </div>
                      <Link href={dashboardHref} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { setMenuOpen(false); signOut() }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm py-2 px-3">Sign in</Link>
                <Link href="/auth/signup" className="btn-primary text-sm py-2 px-4">Get started</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
