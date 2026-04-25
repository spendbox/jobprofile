'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

interface AuthContextValue {
  userProfile: UserProfile | null
  loadingAuth: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  userProfile: null,
  loadingAuth: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUserProfile(null); setLoadingAuth(false); return }

    let { data: up } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

    // Recovery: create user_profiles row if the trigger didn't fire (e.g. tables
    // didn't exist at signup time). Reads from auth metadata set during signUp.
    if (!up && user.user_metadata?.user_role) {
      const meta = user.user_metadata
      const { data: created } = await supabase.from('user_profiles').insert({
        id: user.id,
        full_name: meta.full_name ?? user.email ?? 'User',
        user_role: meta.user_role ?? 'talent',
        company_name: meta.company_name ?? null,
      }).select().single()
      up = created
    }

    setUserProfile(up as UserProfile ?? null)
    setLoadingAuth(false)
  }, [supabase])

  useEffect(() => {
    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUserProfile(null)
        setLoadingAuth(false)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        loadProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserProfile(null)
    router.push('/')
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{ userProfile, loadingAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
