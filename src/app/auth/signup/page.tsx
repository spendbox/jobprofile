'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<UserRole>('talent')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (!data.user) { setError('Something went wrong. Please try again.'); setLoading(false); return }

    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: data.user.id,
      full_name: fullName.trim(),
      user_role: role,
      company_name: role === 'employer' ? companyName.trim() : null,
    })

    if (profileError) { setError(profileError.message); setLoading(false); return }

    router.push(role === 'employer' ? '/dashboard/employer' : '/dashboard/talent')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1 text-sm">Join TalentDeck — it&apos;s free</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Role selector */}
            <div>
              <label className="label">I am a…</label>
              <div className="grid grid-cols-2 gap-2">
                {(['talent', 'employer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      role === r
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {r === 'talent' ? '🙋 Talent' : '🏢 Employer'}
                    <p className="text-xs font-normal mt-0.5 text-current opacity-70">
                      {r === 'talent' ? 'Get discovered' : 'Find talent'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input
                className="input-base"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            {role === 'employer' && (
              <div>
                <label className="label">Company Name</label>
                <input
                  className="input-base"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
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
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
