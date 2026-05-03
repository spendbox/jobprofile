'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

// Horizontal mobile tab strip that sticks just below the main Navbar (top-14).
// Shown on mobile only for talent users.
export function BottomNav() {
  const pathname = usePathname()
  const { userProfile } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!userProfile || userProfile.user_role !== 'talent') { setPendingCount(0); return }
    const supabase = createClient()
    const fetch = async () => {
      const { data: profileIds } = await supabase
        .from('profiles').select('id').eq('user_id', userProfile.id)
      const ids = profileIds?.map((p) => p.id) ?? []
      if (ids.length === 0) return
      const { count } = await supabase
        .from('interview_requests')
        .select('id', { count: 'exact', head: true })
        .in('profile_id', ids)
        .eq('status', 'pending')
      setPendingCount(count ?? 0)
    }
    fetch()
  }, [userProfile])

  if (pathname.startsWith('/auth') || pathname.startsWith('/admin') || !userProfile) return null
  if (userProfile.user_role === 'employer') return null

  const links = [
    { href: '/dashboard/talent', label: 'Dashboard', exact: true, badge: pendingCount },
    { href: '/dashboard/talent/portfolio', label: 'Portfolio', exact: false, badge: 0 },
    { href: '/dashboard/talent/profiles', label: 'Job Profiles', exact: false, badge: 0 },
  ]

  return (
    <nav className="md:hidden sticky top-14 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
        {links.map(({ href, label, exact, badge }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
              {badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
