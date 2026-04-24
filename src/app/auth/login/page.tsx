'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard/talent'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', data.user.id)
      .single()

    const destination =
      redirectTo !== '/dashboard/talent'
        ? redirectTo
        : profile?.user_role === 'employer'
        ? '/dashboard/employer'
        : '/dashboard/talent'

    router.push(destination)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label className="label">Email</label>
        <input
          type="email"
          className="input-base"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label">Password</label>
        <input
          type="password"
          className="input-base"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to your TalentDeck account</p>
        </div>

        <div className="card p-6">
          <Suspense fallback={<div className="text-sm text-slate-500 text-center py-4">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          No account yet?{' '}
          <Link href="/auth/signup" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
