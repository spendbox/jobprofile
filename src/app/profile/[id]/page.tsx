'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { SkillTag } from '@/components/ui/SkillTag'
import { formatSalary, availabilityColor, availabilityDot, timeAgo } from '@/lib/utils'
import type { TalentProfile, UserProfile } from '@/types'
import { AVAILABILITY_LABELS } from '@/types'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<TalentProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [hasRequested, setHasRequested] = useState(false)
  const [loading, setLoading] = useState(true)
  const [requestModal, setRequestModal] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const id = params.id as string

      const [{ data: profileData }, { data: { user: authUser } }] = await Promise.all([
        supabase.from('profiles').select('*, user_profiles(*)').eq('id', id).single(),
        supabase.auth.getUser(),
      ])

      if (!profileData) { router.push('/search'); return }
      setProfile(profileData as TalentProfile)

      if (authUser) {
        const [{ data: up }, { data: reqData }] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('id', authUser.id).single(),
          supabase.from('interview_requests').select('id').eq('employer_id', authUser.id).eq('profile_id', id).maybeSingle(),
        ])
        if (up) setCurrentUser(up as UserProfile)
        if (reqData) setHasRequested(true)

        // Record profile view
        if (authUser.id !== profileData.user_id) {
          await supabase.from('profile_views').insert({ profile_id: id, viewer_id: authUser.id })
        }
      }

      setLoading(false)
    }
    load()
  }, [params.id])

  const handleRequestInterview = async () => {
    if (!currentUser || currentUser.user_role !== 'employer') {
      router.push('/auth/login')
      return
    }
    setRequestModal(true)
  }

  const submitRequest = async () => {
    if (!profile) return
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    setRequesting(true)

    await supabase.from('interview_requests').insert({
      employer_id: authUser.id,
      profile_id: profile.id,
      message: requestMessage.trim() || null,
      status: 'pending',
      stage: 'discovered',
    })

    setHasRequested(true)
    setRequestSuccess(true)
    setRequesting(false)
    setRequestModal(false)
    setRequestMessage('')
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  if (!profile) return null

  const name = profile.user_profiles?.full_name ?? 'Talent'
  const status = profile.availability_status

  return (
    <div className="page-container max-w-2xl">
      <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to search
      </Link>

      {/* Hero card */}
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-4">
          <Avatar name={name} size="lg" src={profile.user_profiles?.avatar_url} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{name}</h1>
            <p className="text-indigo-600 font-semibold">{profile.role_title}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-slate-500">
              {profile.location && <span>{profile.location}</span>}
              {profile.timezone && <span>{profile.timezone}</span>}
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${availabilityColor(status)}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${availabilityDot(status)}`} />
            {AVAILABILITY_LABELS[status]}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
          <div className="flex items-center gap-1.5 text-slate-700">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {profile.years_experience} {profile.years_experience === 1 ? 'year' : 'years'} experience
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatSalary(profile.salary_expectation)}
          </div>
          <div className="text-slate-500 text-xs ml-auto">
            Updated {timeAgo(profile.availability_updated_at)}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="card p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">About</h2>
          <p className="text-slate-700 leading-relaxed text-sm">{profile.bio}</p>
        </div>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <div className="card p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
          </div>
        </div>
      )}

      {/* Links & Downloads */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Resources</h2>
        <div className="space-y-2">
          {profile.cv_url && (
            <a
              href={profile.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Download CV / Resume</p>
                <p className="text-xs text-slate-500">PDF or Word document</p>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          )}

          {profile.portfolio_url && (
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">View Portfolio</p>
                <p className="text-xs text-slate-500 truncate">{profile.portfolio_url}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          {profile.intro_video_url && (
            <a
              href={profile.intro_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Watch Intro Video</p>
                <p className="text-xs text-slate-500">Self-introduction recording</p>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          {!profile.cv_url && !profile.portfolio_url && !profile.intro_video_url && (
            <p className="text-sm text-slate-400 text-center py-4">No resources added yet</p>
          )}
        </div>
      </div>

      {/* CTA for employers */}
      {currentUser?.user_role === 'employer' && (
        <div className="sticky bottom-20 md:bottom-4">
          {requestSuccess ? (
            <div className="bg-emerald-500 text-white rounded-2xl p-4 text-center font-medium shadow-lg">
              Interview request sent! They&apos;ll be notified shortly.
            </div>
          ) : (
            <button
              onClick={handleRequestInterview}
              disabled={hasRequested}
              className={`w-full py-4 rounded-2xl text-base font-semibold shadow-lg transition-all ${
                hasRequested
                  ? 'bg-slate-100 text-slate-500 cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {hasRequested ? 'Interview Request Sent' : 'Request Interview'}
            </button>
          )}
        </div>
      )}

      {!currentUser && (
        <div className="sticky bottom-20 md:bottom-4">
          <Link
            href="/auth/signup"
            className="block w-full py-4 rounded-2xl text-base font-semibold shadow-lg text-center bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Sign up to Request Interview
          </Link>
        </div>
      )}

      {/* Request modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-slate-900 mb-1">Request Interview with {name}</h3>
            <p className="text-sm text-slate-500 mb-4">
              Add an optional message to introduce yourself.
            </p>
            <textarea
              className="input-base resize-none mb-4"
              rows={3}
              placeholder="Hi! We love your profile and would love to chat…"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setRequestModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitRequest} disabled={requesting} className="btn-primary flex-1">
                {requesting ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
