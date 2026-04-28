'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileForm } from '@/components/talent/ProfileForm'
import { SkillTag } from '@/components/ui/SkillTag'
import { availabilityColor, availabilityDot, timeAgo } from '@/lib/utils'
import type { TalentProfile, AvailabilityStatus } from '@/types'
import { AVAILABILITY_LABELS } from '@/types'

type ModalState = { type: 'create' } | { type: 'edit'; profile: TalentProfile } | null

function AvailabilityToggle({
  profile,
  onToggle,
}: {
  profile: TalentProfile
  onToggle: (status: AvailabilityStatus) => void
}) {
  const isAvailable = profile.availability_status !== 'not_looking'
  return (
    <div className="mt-5 pt-5 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {isAvailable ? 'Available' : 'Not Available'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Updated {timeAgo(profile.availability_updated_at)}</p>
        </div>
        <button
          role="switch"
          aria-checked={isAvailable}
          onClick={() => onToggle(isAvailable ? 'not_looking' : 'available')}
          className={`relative inline-flex w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isAvailable ? 'bg-emerald-500' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
              isAvailable ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default function ProfilesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
      setProfiles((data as TalentProfile[]) ?? [])
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

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/talent" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Job Profiles</h1>
          <p className="text-sm text-slate-500 mt-1">
            {profiles.length === 0
              ? 'Create a profile to get discovered by employers'
              : `${profiles.length} profile${profiles.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary self-start">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="card p-14 text-center">
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
              <div className={`h-1 ${profile.availability_status !== 'not_looking' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              <div className="p-5 sm:p-6">
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
                      onClick={() => {
                        const url = `${window.location.origin}/profile/${profile.id}`
                        navigator.clipboard.writeText(url).catch(() => {})
                      }}
                      className="btn-ghost p-2.5 rounded-xl"
                      title="Copy public link"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
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

                {profile.bio && (
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">{profile.bio}</p>
                )}

                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.skills.slice(0, 6).map((s) => <SkillTag key={s} skill={s} />)}
                    {profile.skills.length > 6 && (
                      <span className="text-xs text-slate-400 self-center">+{profile.skills.length - 6}</span>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-500">{profile.profile_views} views</div>

                <AvailabilityToggle profile={profile} onToggle={(s) => toggleAvailability(profile, s)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-slate-900 mb-2">Delete profile?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">This will permanently remove the profile and all related data.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 btn-primary bg-red-600 hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
