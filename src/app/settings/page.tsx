'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth, refreshProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    setFullName(userProfile.full_name)
    setCompanyName(userProfile.company_name ?? '')
    setAvatarUrl(userProfile.avatar_url ?? '')
  }, [userProfile, loadingAuth, router])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setError('Please upload a JPG, PNG, WEBP, or GIF image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated — please refresh.'); return }

      const ext = file.name.split('.').pop()
      const path = `${userProfile.id}/avatar_${Date.now()}.${ext}`
      const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/avatars/${path}`

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', uploadUrl)
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.setRequestHeader('x-upsert', 'true')
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(file)
      })

      const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(pubData.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!userProfile || !fullName.trim()) return
    setSaving(true)
    setError('')
    setSuccess(false)

    const updates: Record<string, string | null> = {
      full_name: fullName.trim(),
      avatar_url: avatarUrl || null,
    }
    if (userProfile.user_role === 'employer') {
      updates.company_name = companyName.trim() || null
    }

    const { error: err } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userProfile.id)

    if (err) {
      setError(err.message)
    } else {
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loadingAuth) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const dashboardHref = userProfile?.user_role === 'employer' ? '/dashboard/employer' : '/dashboard/talent'
  const displayName = avatarUrl ? fullName : (userProfile?.full_name ?? '')

  return (
    <div className="page-container max-w-lg">
      <Link href={dashboardHref} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="mb-7">
        <p className="section-label mb-1">Account</p>
        <h1 className="text-2xl font-black text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Update your profile information.</p>
      </div>

      {/* Avatar */}
      <div className="card p-6 mb-4">
        <p className="section-label mb-4">Profile Photo</p>
        <div className="flex items-center gap-5">
          <Avatar name={displayName} src={avatarUrl || undefined} size="xl" />
          <div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={handleAvatarUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-sm"
            >
              {uploading ? 'Uploading…' : 'Change Photo'}
            </button>
            {avatarUrl && (
              <button
                onClick={() => setAvatarUrl('')}
                className="block mt-2 text-xs text-red-400 hover:text-red-600 font-medium"
              >
                Remove photo
              </button>
            )}
            <p className="text-xs text-slate-400 mt-2">JPG, PNG, WEBP or GIF · Max 5 MB</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="card p-6 space-y-5">
        <div>
          <label className="section-label mb-1.5 block">Full Name</label>
          <input
            type="text"
            className="input-base"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        {userProfile?.user_role === 'employer' && (
          <div>
            <label className="section-label mb-1.5 block">Company Name</label>
            <input
              type="text"
              className="input-base"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company or organisation"
            />
          </div>
        )}

        <div>
          <label className="section-label mb-1 block">Account Type</label>
          <p className="text-sm text-slate-700 capitalize font-medium">{userProfile?.user_role}</p>
          <p className="text-xs text-slate-400 mt-0.5">Account type cannot be changed after signup.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Settings saved successfully.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !fullName.trim()}
          className="btn-primary w-full"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="card p-6 mt-4 border-red-100">
        <p className="section-label text-red-400 mb-3">Account</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Delete Account</p>
            <p className="text-xs text-slate-500 mt-0.5">Contact support to permanently delete your account and all data.</p>
          </div>
          <a
            href="mailto:support@talentdeck.com"
            className="text-xs text-red-500 hover:text-red-700 font-semibold flex-shrink-0"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
