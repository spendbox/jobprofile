'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { userProfile, loadingAuth, refreshProfile } = useAuth()
  const [pins, setPins] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.email_verified) {
      router.push(userProfile.user_role === 'employer' ? '/dashboard/employer' : '/dashboard/talent')
    }
  }, [userProfile, loadingAuth, router])

  // Auto-send on mount
  useEffect(() => {
    if (!loadingAuth && userProfile && !userProfile.email_verified) {
      handleSendCode()
    }
  }, [loadingAuth]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendCode = async () => {
    if (resendCooldown > 0) return
    setSending(true)
    setError('')
    const res = await fetch('/api/auth/send-verification', { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to send code')
    } else {
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((v) => {
          if (v <= 1) { clearInterval(interval); return 0 }
          return v - 1
        })
      }, 1000)
    }
    setSending(false)
  }

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...pins]
    next[index] = digit
    setPins(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every((d) => d !== '')) {
      submitPin(next.join(''))
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      e.preventDefault()
      setPins(text.split(''))
      submitPin(text)
    }
  }

  const submitPin = async (pin: string) => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Verification failed')
      setPins(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } else {
      setSuccess(true)
      await refreshProfile()
      setTimeout(() => {
        router.push(userProfile?.user_role === 'employer' ? '/dashboard/employer' : '/dashboard/talent')
      }, 1500)
    }
    setLoading(false)
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Check your email</h1>
          <p className="text-sm text-slate-500 mt-2">
            We&apos;ve sent a 6-digit verification code to<br />
            <strong className="text-slate-700">{userProfile?.full_name ? `your email address` : 'your email'}</strong>
          </p>
        </div>

        <div className="card p-6 space-y-5">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-slate-900">Email verified!</p>
              <p className="text-sm text-slate-500 mt-1">Redirecting you now…</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center mb-4">Enter your 6-digit code</p>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {pins.map((pin, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={pin}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      disabled={loading}
                      className={`w-11 h-14 text-center text-2xl font-black rounded-xl border-2 transition-colors outline-none
                        ${pin ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-900'}
                        focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                        disabled:opacity-50`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">{error}</div>
              )}

              {loading && (
                <p className="text-xs text-slate-400 text-center">Verifying…</p>
              )}

              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">Didn&apos;t receive the code?</p>
                <button
                  onClick={handleSendCode}
                  disabled={sending || resendCooldown > 0}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          The code expires in 15 minutes.
        </p>
      </div>
    </div>
  )
}
