'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { timeAgo } from '@/lib/utils'

type VerifyStatus = 'none' | 'pending' | 'verified'

export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<VerifyStatus>('none')
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    if (userProfile.is_verified) {
      setStatus('verified')
    } else {
      // Check if they've already submitted a doc
      supabase
        .from('user_profiles')
        .select('verification_doc_path, verification_requested_at')
        .eq('id', userProfile.id)
        .single()
        .then(({ data }) => {
          if (data?.verification_doc_path) {
            setStatus('pending')
            setSubmittedAt(data.verification_requested_at)
          }
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, loadingAuth])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      setError('Please upload a JPG, PNG, WEBP, or PDF file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.')
      return
    }

    setUploading(true)
    setProgress(0)
    setError('')
    setSuccess(false)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated — please refresh.'); return }

      const ext = file.name.split('.').pop()
      const path = `${userProfile.id}/id_${Date.now()}.${ext}`
      const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/verification-docs/${path}`

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', uploadUrl)
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.setRequestHeader('x-upsert', 'true')
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100))
        }
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(file)
      })

      const now = new Date().toISOString()
      const { error: dbErr } = await supabase
        .from('user_profiles')
        .update({ verification_doc_path: path, verification_requested_at: now })
        .eq('id', userProfile.id)

      if (dbErr) throw new Error(dbErr.message)

      setStatus('pending')
      setSubmittedAt(now)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loadingAuth) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page-container max-w-lg">
      <Link href="/dashboard/talent" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="mb-7">
        <p className="section-label mb-1">Identity</p>
        <h1 className="text-2xl font-black text-slate-900">Account Verification</h1>
        <p className="text-sm text-slate-500 mt-1">
          Get a verified badge on your profile to build trust with employers.
        </p>
      </div>

      {/* Verified */}
      {status === 'verified' && (
        <div className="card overflow-hidden">
          <div className="h-1 bg-indigo-500" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">You&apos;re Verified!</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              Your identity has been confirmed. A verified badge appears on your profile and role cards, increasing employer trust.
            </p>
            <Link href="/dashboard/talent" className="btn-primary mx-auto mt-6 inline-flex">
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Pending */}
      {status === 'pending' && !success && (
        <div className="card overflow-hidden">
          <div className="h-1 bg-amber-400" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Under Review</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              Your document was submitted {submittedAt ? timeAgo(submittedAt) : 'recently'}. Our team will review it shortly — usually within 1–2 business days.
            </p>
            <p className="text-xs text-slate-400 mt-4">
              Need to update your document?
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold mt-1"
            >
              Upload a new one
            </button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={handleUpload} />
          </div>
        </div>
      )}

      {/* Just submitted */}
      {success && (
        <div className="card overflow-hidden mb-4">
          <div className="h-1 bg-emerald-400" />
          <div className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Document submitted!</p>
              <p className="text-xs text-slate-500 mt-0.5">Our team will review it within 1–2 business days.</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload form — shown when not yet verified and not pending (or after success) */}
      {status === 'none' && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="font-bold text-slate-900 mb-1">Submit your ID</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Upload a clear photo or scan of a government-issued ID. Accepted documents:
            </p>
            <ul className="mt-3 space-y-1.5">
              {['National ID card', 'Passport (photo page)', "Driver's licence", 'Residence permit'].map((doc) => (
                <li key={doc} className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
            Your document is stored securely and only accessible to TalentDeck admins for verification. It will not be shared with employers.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {uploading && progress !== null && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-primary w-full"
          >
            {uploading ? `Uploading… ${progress ?? 0}%` : 'Upload Document'}
          </button>
          <p className="text-xs text-center text-slate-400">JPG, PNG, WEBP or PDF · Max 10 MB</p>
        </div>
      )}
    </div>
  )
}
