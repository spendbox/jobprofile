'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileForm } from '@/components/talent/ProfileForm'
import { Avatar } from '@/components/ui/Avatar'
import { SkillTag } from '@/components/ui/SkillTag'
import { availabilityColor, availabilityDot, timeAgo } from '@/lib/utils'
import type { TalentProfile, AvailabilityStatus } from '@/types'
import { AVAILABILITY_LABELS } from '@/types'

type ModalState = { type: 'create' } | { type: 'edit'; profile: TalentProfile } | null

export default function TalentDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>({})
  const [isVerified, setIsVerified] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    const load = async () => {
      const [{ data: userProfileData }, { data: profileData }] = await Promise.all([
        supabase.from('user_profiles').select('is_verified').eq('id', userProfile.id).single(),
        supabase.from('profiles').select('*').eq('user_id', userProfile.id).order('created_at', { ascending: false }),
      ])

      if (userProfileData?.is_verified) setIsVerified(true)

      if (profileData) {
        setProfiles(profileData as TalentProfile[])
        const ids = profileData.map((p) => p.id)
        if (ids.length > 0) {
          const { data: reqData } = await supabase
            .from('interview_requests')
            .select('profile_id')
            .in('profile_id', ids)
          const counts: Record<string, number> = {}
          reqData?.forEach((r) => { counts[r.profile_id] = (counts[r.profile_id] ?? 0) + 1 })
          setRequestCounts(counts)
        }
      }
      setLoading(false)
    }
    load()
  }, [userProfile, loadingAuth, router, supabase])

  const handleSaved = (saved: TalentProfile) => {
    setProfiles((prev) => {
      const exists = prev.find((p) => p.id === saved.id)
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
    })
    setModal(null)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id)
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    setDeleteId(null)
  }

  const toggleAvailability = async (profile: TalentProfile, status: AvailabilityStatus) => {
    const { data } = await supabase
      .from('profiles')
      .update({ availability_status: status, availability_updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single()
    if (data) setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, ...data } : p)))
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  const totalViews = profiles.reduce((sum, p) => sum + p.profile_views, 0)
  const totalRequests = Object.values(requestCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {userProfile && <Avatar name={userProfile.full_name} size="lg" src={userProfile.avatar_url} />}
          <div>
            <p className="section-label mb-0.5">Talent Dashboard</p>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {userProfile?.full_name}
              {isVerified && (
                <span title="Verified" className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 rounded-full flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your role profiles</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end gap-y-2">
          <Link href="/dashboard/talent/tests" className="btn-secondary text-sm">
            Tests
          </Link>
          <button onClick={() => setModal({ type: 'create' })} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Profile
          </button>
        </div>
      </div>

      {/* Unverified nudge */}
      {userProfile && !isVerified && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-6">
          <span className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700">Not yet verified</p>
            <p className="text-xs text-slate-500 mt-0.5">Submit an ID document to get a verified badge on your profile.</p>
          </div>
          <Link href="/dashboard/talent/verify" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex-shrink-0">
            Get Verified
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-10">
        {[
          { label: 'Profiles', value: profiles.length },
          { label: 'Total Views', value: totalViews },
          { label: 'Requests', value: totalRequests },
        ].map(({ label, value }) => (
          <div key={label} className="card px-5 py-4 sm:p-6 flex items-center justify-between sm:block sm:text-center">
            <p className="section-label sm:hidden">{label}</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900">{value.toLocaleString()}</p>
            <p className="section-label mt-0 sm:mt-2 hidden sm:block">{label}</p>
          </div>
        ))}
      </div>

      {/* Profiles list */}
      {profiles.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="font-bold text-slate-900 text-base">No profiles yet</p>
          <p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs mx-auto">Create your first role profile to get discovered by employers.</p>
          <button onClick={() => setModal({ type: 'create' })} className="btn-primary mx-auto">
            Create Profile
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {profiles.map((profile) => (
            <div key={profile.id} className="card overflow-hidden">
              {/* Availability accent stripe */}
              <div className={`h-1 ${
                profile.availability_status === 'available' ? 'bg-emerald-400'
                : profile.availability_status === 'open' ? 'bg-amber-400'
                : 'bg-slate-300'
              }`} />

              <div className="p-5 sm:p-6">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug truncate">
                      {profile.role_title}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mt-2 ${availabilityColor(profile.availability_status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${availabilityDot(profile.availability_status)}`} />
                      {AVAILABILITY_LABELS[profile.availability_status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 -mt-1">
                    <button
                      onClick={() => setModal({ type: 'edit', profile })}
                      className="btn-ghost p-2.5 rounded-xl"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteId(profile.id)}
                      className="btn-ghost p-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
                    {profile.bio}
                  </p>
                )}

                {/* Skills */}
                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.skills.slice(0, 5).map((s) => <SkillTag key={s} skill={s} />)}
                    {profile.skills.length > 5 && (
                      <span className="text-xs text-slate-400 self-center">+{profile.skills.length - 5}</span>
                    )}
                  </div>
                )}

                {/* Meta stats */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span>{profile.profile_views} views</span>
                  <span>{requestCounts[profile.id] ?? 0} requests</span>
                </div>

                {/* Availability toggle */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="section-label mb-3">Update availability</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['available', 'open', 'not_looking'] as AvailabilityStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleAvailability(profile, s)}
                        className={`text-xs px-2 py-2.5 rounded-xl border font-semibold transition-all text-center leading-snug ${
                          profile.availability_status === s
                            ? s === 'available' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              : s === 'open' ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {AVAILABILITY_LABELS[s]}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5">
                    Updated {timeAgo(profile.availability_updated_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal — full screen */}
      {modal && userProfile && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-white">
          <ProfileForm
            userId={userProfile.id}
            existing={modal.type === 'edit' ? modal.profile : undefined}
            onSaved={handleSaved}
            onCancel={() => setModal(null)}
          />
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-slate-900 mb-2">Delete profile?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">This will permanently remove the profile and all related data.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 btn-primary bg-red-600 hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
