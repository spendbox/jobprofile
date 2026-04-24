'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProfileForm } from '@/components/talent/ProfileForm'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { SkillTag } from '@/components/ui/SkillTag'
import { formatSalary, availabilityColor, availabilityDot, timeAgo } from '@/lib/utils'
import type { TalentProfile, UserProfile, AvailabilityStatus } from '@/types'
import { AVAILABILITY_LABELS } from '@/types'

type ModalState = { type: 'create' } | { type: 'edit'; profile: TalentProfile } | null

export default function TalentDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>({})
  const [modal, setModal] = useState<ModalState>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }

      const [{ data: up }, { data: profileData }] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('profiles').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
      ])

      if (up) {
        if (up.user_role === 'employer') { router.push('/dashboard/employer'); return }
        setUser(up as UserProfile)
      }

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
  }, [])

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {user && <Avatar name={user.full_name} size="md" src={user.avatar_url} />}
          <div>
            <h1 className="text-lg font-bold text-slate-900">My Profiles</h1>
            <p className="text-sm text-slate-500">{user?.full_name}</p>
          </div>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Profile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Profiles', value: profiles.length },
          { label: 'Total Views', value: totalViews },
          { label: 'Requests', value: totalRequests },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Profiles list */}
      {profiles.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-900">No profiles yet</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Create your first role profile to get discovered by employers.</p>
          <button onClick={() => setModal({ type: 'create' })} className="btn-primary mx-auto">
            Create Profile
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{profile.role_title}</h3>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${availabilityColor(profile.availability_status)}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${availabilityDot(profile.availability_status)}`} />
                      {AVAILABILITY_LABELS[profile.availability_status]}
                    </span>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{profile.bio}</p>
                  )}

                  {profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.skills.slice(0, 4).map((s) => <SkillTag key={s} skill={s} />)}
                      {profile.skills.length > 4 && (
                        <span className="text-xs text-slate-400">+{profile.skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{formatSalary(profile.salary_expectation)}</span>
                    {profile.location && <span>{profile.location}</span>}
                    <span>{profile.profile_views} views</span>
                    <span>{requestCounts[profile.id] ?? 0} requests</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setModal({ type: 'edit', profile })}
                    className="btn-ghost p-2"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteId(profile.id)}
                    className="btn-ghost p-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Availability quick-toggle */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2 font-medium">Update availability</p>
                <div className="flex gap-2 flex-wrap">
                  {(['available', 'open', 'not_looking'] as AvailabilityStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleAvailability(profile, s)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                        profile.availability_status === s
                          ? s === 'available' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : s === 'open' ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {AVAILABILITY_LABELS[s]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Last updated {timeAgo(profile.availability_updated_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && user && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-900">
                {modal.type === 'create' ? 'Create Role Profile' : 'Edit Profile'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ProfileForm
                userId={user.id}
                existing={modal.type === 'edit' ? modal.profile : undefined}
                onSaved={handleSaved}
                onCancel={() => setModal(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-slate-900 mb-2">Delete profile?</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove the profile and all related data.</p>
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
