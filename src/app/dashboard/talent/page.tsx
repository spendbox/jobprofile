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
import type { TalentProfile, AvailabilityStatus, InterviewRequest, TalentFind, UserProfile } from '@/types'
import { AVAILABILITY_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/types'

type ModalState = { type: 'create' } | { type: 'edit'; profile: TalentProfile } | null

// ─── AvailabilityToggle ───────────────────────────────────────────────────────
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

// ─── RequestCard ──────────────────────────────────────────────────────────────
function RequestCard({
  request,
  onRespond,
  responding,
}: {
  request: InterviewRequest
  onRespond: (id: string, decision: 'accepted' | 'declined') => void
  responding: boolean
}) {
  const find = request.talent_find as TalentFind | undefined
  const employer = request.employer as unknown as UserProfile | undefined
  const companyName = employer?.company_name ?? employer?.full_name ?? 'Employer'
  const roleTitle = find?.role_title ?? 'Interview Request'

  const salaryText = find && (find.salary_min || find.salary_max)
    ? `$${(find.salary_min ?? 0).toLocaleString()}${find.salary_max ? ` – $${find.salary_max.toLocaleString()}` : '+'}`
    : null

  return (
    <div className="card overflow-hidden">
      <div className="h-1 bg-amber-400" />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={companyName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 leading-snug">{companyName}</p>
            <p className="text-sm text-indigo-600 font-semibold mt-0.5">{roleTitle}</p>
            {find && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                  {EMPLOYMENT_TYPE_LABELS[find.employment_type]}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                  {WORK_ARRANGEMENT_LABELS[find.work_arrangement]}
                </span>
                {salaryText && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded">
                    {salaryText}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(request.created_at)}</span>
        </div>

        {request.message && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 mb-3 leading-relaxed">
            &ldquo;{request.message}&rdquo;
          </p>
        )}

        {find?.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{find.description}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onRespond(request.id, 'declined')}
            disabled={responding}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors disabled:opacity-50"
          >
            Not Interested
          </button>
          <button
            onClick={() => onRespond(request.id, 'accepted')}
            disabled={responding}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-colors disabled:opacity-50"
          >
            {responding ? 'Saving…' : "I'm Interested →"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TalentDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [pendingRequests, setPendingRequests] = useState<InterviewRequest[]>([])
  const [isVerified, setIsVerified] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    const load = async () => {
      const [{ data: upData }, { data: profileData }] = await Promise.all([
        supabase.from('user_profiles').select('is_verified').eq('id', userProfile.id).single(),
        supabase.from('profiles').select('*').eq('user_id', userProfile.id).order('created_at', { ascending: false }),
      ])

      setIsVerified(!!upData?.is_verified)

      if (profileData && profileData.length > 0) {
        setProfiles(profileData as TalentProfile[])
        const ids = profileData.map((p) => p.id)

        // Fetch pending interview requests with employer + job details
        const { data: reqData } = await supabase
          .from('interview_requests')
          .select('*, employer:user_profiles!ir_employer_user_profiles_fkey(*), talent_find:talent_finds(*)')
          .in('profile_id', ids)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
        setPendingRequests((reqData as InterviewRequest[]) ?? [])
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

  const handleRespond = async (requestId: string, decision: 'accepted' | 'declined') => {
    setResponding(requestId)
    const { data } = await supabase
      .from('interview_requests')
      .update({
        status: decision,
        stage: decision === 'accepted' ? 'interested' : 'discovered',
      })
      .eq('id', requestId)
      .select()
      .single()
    if (data) setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    setResponding(null)
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

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
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Profile
        </button>
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

      {/* ── Pending Requests Inbox ── */}
      {pendingRequests.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-label mb-0.5">Inbox</p>
              <h2 className="text-lg font-bold text-slate-900">
                {pendingRequests.length} Interview {pendingRequests.length === 1 ? 'Request' : 'Requests'}
              </h2>
            </div>
            <Link href="/requests" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View history →
            </Link>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onRespond={handleRespond}
                responding={responding === req.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Profiles list ── */}
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
              <div className={`h-1 ${
                profile.availability_status !== 'not_looking' ? 'bg-emerald-400' : 'bg-slate-300'
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
                    {profile.skills.slice(0, 5).map((s) => <SkillTag key={s} skill={s} />)}
                    {profile.skills.length > 5 && (
                      <span className="text-xs text-slate-400 self-center">+{profile.skills.length - 5}</span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{profile.profile_views} views</span>
                </div>

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
