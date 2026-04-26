'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const InboxIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
)
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export function BottomNav() {
  const pathname = usePathname()
  const { userProfile } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!userProfile) { setPendingCount(0); return }
    const supabase = createClient()

    const fetchCount = async () => {
      if (userProfile.user_role === 'talent') {
        const { data: profileIds } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userProfile.id)
        const ids = profileIds?.map((p) => p.id) ?? []
        if (ids.length === 0) { setPendingCount(0); return }
        const { count } = await supabase
          .from('interview_requests')
          .select('id', { count: 'exact', head: true })
          .in('profile_id', ids)
          .eq('status', 'pending')
        setPendingCount(count ?? 0)
      } else {
        const { count } = await supabase
          .from('interview_requests')
          .select('id', { count: 'exact', head: true })
          .eq('employer_id', userProfile.id)
          .eq('status', 'pending')
        setPendingCount(count ?? 0)
      }
    }

    fetchCount()
  }, [userProfile])

  if (pathname.startsWith('/auth') || pathname.startsWith('/admin') || !userProfile) return null

  const isTalent = userProfile.user_role === 'talent'
  const dashboardHref = isTalent ? '/dashboard/talent' : '/dashboard/employer'

  const links = [
    { href: dashboardHref, label: 'Dashboard', icon: <UserIcon />, badge: 0 },
    isTalent
      ? { href: '/dashboard/talent/portfolio', label: 'Portfolio', icon: <DocumentIcon />, badge: 0 }
      : { href: '/search', label: 'Discover', icon: <SearchIcon />, badge: 0 },
    { href: '/requests', label: 'Requests', icon: <InboxIcon />, badge: pendingCount },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {links.map(({ href, label, icon, badge }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="relative">
                {icon}
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
