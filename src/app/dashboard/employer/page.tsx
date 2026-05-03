'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import type { TalentFind } from '@/types'
import { EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS, TIMEZONES } from '@/types'
import { COUNTRIES } from '@/lib/countries'
import { timeAgo } from '@/lib/utils'

interface FindStats {
  discovered: number
  interested: number
  pipeline: number
}

function CompanySetupModal({ onComplete }: { onComplete: () => void }) {
  const supabase = createClient()
  const { userProfile, refreshProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [companyName, setCompanyName] = useState(userProfile?.company_name ?? '')
  const [companyWebsite, setCompanyWebsite] = useState(userProfile?.company_website ?? '')
  const [companyContactEmail, setCompanyContactEmail] = useState(userProfile?.company_contact_email ?? '')
  const [companyDescription, setCompanyDescription] = useState(userProfile?.company_description ?? '')
  const [companyHqCountry, setCompanyHqCountry] = useState(userProfile?.company_hq_country ?? '')
  const [companyHqState, setCompanyHqState] = useState(userProfile?.company_hq_state ?? '')
  const [companyTimezone, setCompanyTimezone] = useState(userProfile?.company_timezone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { setError('Please upload a JPG, PNG, WEBP, or GIF.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); return }
    setUploading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated.'); return }
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
    if (!companyContactEmail.trim() || !companyDescription.trim() || !companyHqCountry || !companyHqState.trim()) {
      setError('Contact email, description, HQ country, and HQ state/region are required.')
      return
    }
    if (!userProfile) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('user_profiles').update({
      company_name: companyName.trim() || null,
      company_website: companyWebsite.trim() || null,
      company_contact_email: companyContactEmail.trim(),
      company_description: companyDescription.trim(),
      company_hq_country: companyHqCountry || null,
      company_hq_state: companyHqState.trim() || null,
      company_timezone: companyTimezone || null,
      company_profile_complete: true,
      avatar_url: avatarUrl || null,
    }).eq('id', userProfile.id)
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    await refreshProfile()
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">Set up your company profile</h2>
          <p className="text-sm text-slate-500 mt-1">Complete your company details before creating your first pipeline.</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Logo */}
          <div>
            <p className="section-label mb-3">Company Logo</p>
            <div className="flex items-center gap-4">
              <Avatar name={companyName || userProfile?.full_name || ''} src={avatarUrl || undefined} size="lg" />
              <div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={handleLogoUpload} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary text-sm">
                  {uploading ? 'Uploading…' : 'Upload Logo'}
                </button>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP or GIF · Max 5 MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="section-label mb-1.5 block">Company Name</label>
            <input type="text" className="input-base" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company or organisation" />
          </div>

          <div>
            <label className="section-label mb-1.5 block">Company Website</label>
            <input type="url" className="input-base" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://yourcompany.com" />
          </div>

          <div>
            <label className="section-label mb-1.5 block">
              Contact Email <span className="text-red-400">*</span>
            </label>
            <input type="email" className="input-base" value={companyContactEmail} onChange={(e) => setCompanyContactEmail(e.target.value)} placeholder="hiring@yourcompany.com" />
          </div>

          <div>
            <label className="section-label mb-1.5 block">
              Company Description <span className="text-red-400">*</span>
            </label>
            <textarea
              className="input-base resize-none"
              rows={3}
              maxLength={500}
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              placeholder="Brief description of your company, culture, and mission…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label mb-1.5 block">
                HQ Country <span className="text-red-400">*</span>
              </label>
              <select className="input-base" value={companyHqCountry} onChange={(e) => setCompanyHqCountry(e.target.value)}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label mb-1.5 block">
                HQ State / Region <span className="text-red-400">*</span>
              </label>
              <input type="text" className="input-base" value={companyHqState} onChange={(e) => setCompanyHqState(e.target.value)} placeholder="e.g. California" />
            </div>
          </div>

          <div>
            <label className="section-label mb-1.5 block">Timezone</label>
            <select className="input-base" value={companyTimezone} onChange={(e) => setCompanyTimezone(e.target.value)}>
              <option value="">Select timezone</option>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmployerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [finds, setFinds] = useState<TalentFind[]>([])
  const [findStats, setFindStats] = useState<Record<string, FindStats>>({})
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [globalStats, setGlobalStats] = useState({ activeFinds: 0, totalCandidates: 0, interested: 0, hired: 0 })
  const [showCompanySetup, setShowCompanySetup] = useState(false)

  const loadData = useCallback(async () => {
    const findsRes = await fetch('/api/talent-finds?status=all')
    if (!findsRes.ok) { setLoading(false); return }
    const allFinds: TalentFind[] = await findsRes.json()
    setFinds(allFinds)

    if (allFinds.length === 0) {
      setLoading(false)
      return
    }

    const findIds = allFinds.map((f) => f.id)

    const [candidatesResult, requestsResult] = await Promise.all([
      supabase
        .from('talent_find_candidates')
        .select('talent_find_id, contacted')
        .in('talent_find_id', findIds),
      supabase
        .from('interview_requests')
        .select('talent_find_id, stage')
        .in('talent_find_id', findIds),
    ])

    const candidates = candidatesResult.data ?? []
    const requests = requestsResult.data ?? []

    const statsMap: Record<string, FindStats> = {}
    for (const f of allFinds) {
      const fCandidates = candidates.filter((c) => c.talent_find_id === f.id)
      const fRequests = requests.filter((r) => r.talent_find_id === f.id)
      statsMap[f.id] = {
        discovered: fCandidates.length,
        interested: fRequests.filter((r) => r.stage === 'interested').length,
        pipeline: fRequests.length,
      }
    }
    setFindStats(statsMap)

    setGlobalStats({
      activeFinds: allFinds.filter((f) => f.status === 'active').length,
      totalCandidates: candidates.length,
      interested: requests.filter((r) => r.stage === 'interested').length,
      hired: requests.filter((r) => r.stage === 'hired').length,
    })

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'talent') { router.push('/dashboard/talent'); return }
    loadData()
  }, [userProfile, loadingAuth, router, loadData])

  const handleArchive = async (findId: string) => {
    setArchiving(findId)
    await fetch(`/api/talent-finds/${findId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    })
    setFinds((prev) => prev.map((f) => f.id === findId ? { ...f, status: 'archived' as const } : f))
    setGlobalStats((prev) => ({ ...prev, activeFinds: Math.max(0, prev.activeFinds - 1) }))
    setArchiving(null)
  }

  const handleReactivate = async (findId: string) => {
    setArchiving(findId)
    await fetch(`/api/talent-finds/${findId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    setFinds((prev) => prev.map((f) => f.id === findId ? { ...f, status: 'active' as const } : f))
    setGlobalStats((prev) => ({ ...prev, activeFinds: prev.activeFinds + 1 }))
    setArchiving(null)
  }

  const handleCreatePipeline = () => {
    if (!userProfile?.company_profile_complete) {
      setShowCompanySetup(true)
      return
    }
    router.push('/dashboard/employer/new-find')
  }

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const activeFinds = finds.filter((f) => f.status === 'active')
  const archivedFinds = finds.filter((f) => f.status === 'archived')
  const draftFinds = finds.filter((f) => f.status === 'draft')
  const visibleFinds = showArchived ? archivedFinds : activeFinds

  const profileIncomplete = !userProfile?.company_profile_complete

  return (
    <div className="page-container">
      {showCompanySetup && (
        <CompanySetupModal onComplete={() => {
          setShowCompanySetup(false)
          router.push('/dashboard/employer/new-find')
        }} />
      )}

      {/* Incomplete profile banner */}
      {profileIncomplete && finds.length > 0 && (
        <div className="mb-5 flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-800">Complete your company profile so talent know who you are.</p>
          </div>
          <Link href="/settings" className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex-shrink-0">
            Complete now →
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {userProfile && (
            <Avatar
              name={userProfile.company_name ?? userProfile.full_name}
              src={userProfile.avatar_url ?? undefined}
              size="lg"
            />
          )}
          <div>
            <p className="section-label mb-0.5">Employer Dashboard</p>
            <h1 className="text-xl font-bold text-slate-900">
              {userProfile?.company_name ?? userProfile?.full_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your talent pipeline</p>
          </div>
        </div>
        <button onClick={handleCreatePipeline} className="btn-primary self-start sm:self-auto flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Pipeline
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {[
          { label: 'Active Finds', value: globalStats.activeFinds },
          { label: 'Total Candidates', value: globalStats.totalCandidates },
          { label: 'Interested', value: globalStats.interested },
          { label: 'Hired', value: globalStats.hired },
        ].map(({ label, value }) => (
          <div key={label} className="card p-5 sm:p-6 text-center">
            <p className="text-3xl sm:text-4xl font-black text-slate-900">{value}</p>
            <p className="section-label mt-2">{label}</p>
          </div>
        ))}
      </div>

      {/* Draft finds strip */}
      {draftFinds.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-slate-900 text-base mb-3">
            Draft Pipelines <span className="text-slate-400 font-normal text-sm">({draftFinds.length})</span>
          </h2>
          <div className="space-y-3">
            {draftFinds.map((find) => (
              <div key={find.id} className="card p-4 sm:p-5 flex items-center justify-between gap-4 border-dashed border-slate-200">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-700 text-sm">{find.role_title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500">Draft</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {EMPLOYMENT_TYPE_LABELS[find.employment_type]} · {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
                  </p>
                </div>
                <Link href={`/dashboard/employer/pipeline/${find.id}`} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
                  Open →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 text-base">
          {showArchived ? 'Archived Talent Finds' : 'Active Talent Finds'}
          {' '}
          <span className="text-slate-400 font-normal text-sm">({visibleFinds.length})</span>
        </h2>
        {(showArchived || archivedFinds.length > 0) && (
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              showArchived
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {showArchived ? '← Active' : `Archived (${archivedFinds.length})`}
          </button>
        )}
      </div>

      {/* Finds list */}
      {visibleFinds.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {showArchived ? (
            <p className="text-slate-500">No archived talent finds.</p>
          ) : (
            <>
              <p className="font-semibold text-slate-700 mb-2">No talent finds yet</p>
              <p className="text-sm text-slate-500 mb-6">
                Create a Talent Find to start discovering and reaching out to candidates.
              </p>
              <button onClick={handleCreatePipeline} className="btn-primary mx-auto inline-flex">
                Create your first Talent Find
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleFinds.map((find) => {
            const s = findStats[find.id] ?? { discovered: 0, interested: 0, pipeline: 0 }
            return (
              <div key={find.id} className="card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{find.role_title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        find.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {find.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                      <span className="text-xs text-slate-400">Created {timeAgo(find.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                        {EMPLOYMENT_TYPE_LABELS[find.employment_type]}
                      </span>
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md font-medium">
                        {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
                      </span>
                      {find.hiring_country && (
                        <span className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {find.hiring_state ? `${find.hiring_state}, ` : ''}{find.hiring_country}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-5">
                      <div>
                        <span className="font-bold text-slate-900 text-lg">{s.discovered}</span>
                        <span className="text-slate-500 ml-1.5 text-xs">discovered</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-lg">{s.interested}</span>
                        <span className="text-slate-500 ml-1.5 text-xs">interested</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-lg">{s.pipeline}</span>
                        <span className="text-slate-500 ml-1.5 text-xs">in pipeline</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-3 flex-shrink-0">
                    <Link
                      href={`/dashboard/employer/pipeline/${find.id}`}
                      className="btn-primary text-sm py-2 px-4 whitespace-nowrap"
                    >
                      Open Pipeline →
                    </Link>
                    {find.status === 'active' ? (
                      <button
                        onClick={() => handleArchive(find.id)}
                        disabled={archiving === find.id}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                      >
                        {archiving === find.id ? 'Archiving…' : 'Archive'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(find.id)}
                        disabled={archiving === find.id}
                        className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {archiving === find.id ? 'Reactivating…' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
