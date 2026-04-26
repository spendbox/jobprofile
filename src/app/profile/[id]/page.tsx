'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { SkillTag } from '@/components/ui/SkillTag'
import { availabilityColor, availabilityDot, timeAgo } from '@/lib/utils'
import type { TalentProfile, UserProfile } from '@/types'
import { AVAILABILITY_LABELS } from '@/types'

interface PassedTest {
  test_id: string
  score: number
  completed_at: string
  title: string
  skill_category: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<TalentProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [passedTests, setPassedTests] = useState<PassedTest[]>([])
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

      // Load passed proficiency tests for this talent
      const { data: testsData } = await supabase.rpc('get_passed_tests_for_user', {
        p_user_id: profileData.user_id,
      })
      if (testsData) setPassedTests(testsData as PassedTest[])

      if (authUser) {
        const [{ data: up }, { data: reqData }] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('id', authUser.id).single(),
          supabase.from('interview_requests').select('id').eq('employer_id', authUser.id).eq('profile_id', id).maybeSingle(),
        ])
        if (up) setCurrentUser(up as UserProfile)
        if (reqData) setHasRequested(true)

        if (authUser.id !== profileData.user_id) {
          await supabase.from('profile_views').insert({ profile_id: id, viewer_id: authUser.id })
        }
      }

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const hasResources = profile.cv_url || profile.portfolio_url || profile.intro_video_url

  return (
    <div className="page-container max-w-2xl">

      {/* Back link */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to search
      </Link>

      {/* Hero card */}
      <div className="card overflow-hidden mb-5">
        {/* Availability stripe */}
        <div className={`h-1.5 ${
          status === 'available' ? 'bg-emerald-400'
          : status === 'open' ? 'bg-amber-400'
          : 'bg-slate-300'
        }`} />

        <div className="p-6 sm:p-8">
          {/* Identity */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-6">
            <Avatar name={name} size="xl" src={profile.user_profiles?.avatar_url} />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">{name}</h1>
                    {profile.user_profiles?.is_verified && (
                      <span
                        title="Verified talent"
                        className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-full flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-base text-indigo-600 font-bold mt-1">{profile.role_title}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${availabilityColor(status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${availabilityDot(status)}`} />
                  {AVAILABILITY_LABELS[status]}
                </span>
              </div>

              {(profile.location || profile.timezone) && (
                <div className="flex items-center gap-3 mt-3 text-sm text-slate-500 flex-wrap">
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </span>
                  )}
                  {profile.timezone && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {profile.timezone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{profile.years_experience}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Years exp.</p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-xl font-black text-slate-900">{profile.profile_views}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Profile views</p>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      {profile.bio && (
        <div className="card p-6 sm:p-7 mb-5">
          <p className="section-label mb-3">About</p>
          <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <div className="card p-6 sm:p-7 mb-5">
          <p className="section-label mb-4">Skills</p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
          </div>
        </div>
      )}

      {/* Proficiency Badges */}
      {passedTests.length > 0 && (
        <div className="card p-6 sm:p-7 mb-5">
          <p className="section-label mb-4">Verified Skills</p>
          <div className="flex flex-wrap gap-2.5">
            {passedTests.map((test) => (
              <div
                key={test.test_id}
                className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl"
              >
                <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold leading-none">{test.title}</span>
                <span className="text-[10px] text-emerald-600 font-bold">{test.score}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Skill badges are awarded after passing a verified proficiency test.
          </p>
        </div>
      )}

      {/* Resources */}
      {hasResources && (
        <div className="card p-6 sm:p-7 mb-8">
          <p className="section-label mb-4">Resources</p>
          <div className="space-y-3">
            {profile.cv_url && (
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
              >
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">CV / Resume</p>
                  <p className="text-xs text-slate-500 mt-0.5">View or download document</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 transition-colors group"
              >
                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Portfolio</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{profile.portfolio_url}</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {profile.intro_video_url && (
              <a
                href={profile.intro_video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group"
              >
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Intro Video</p>
                  <p className="text-xs text-slate-500 mt-0.5">Self-introduction recording</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Footer meta */}
      <p className="text-xs text-slate-400 text-center mb-8">
        Profile updated {timeAgo(profile.availability_updated_at)}
      </p>

      {/* Sticky CTA — employer only */}
      {currentUser?.user_role === 'employer' && (
        <div className="sticky bottom-20 md:bottom-6">
          {requestSuccess ? (
            <div className="bg-emerald-500 text-white rounded-2xl p-4 text-center font-semibold shadow-lg shadow-emerald-500/30">
              Interview request sent — they&apos;ll be notified shortly.
            </div>
          ) : (
            <button
              onClick={handleRequestInterview}
              disabled={hasRequested}
              className={`w-full py-4 rounded-2xl text-base font-bold shadow-lg transition-all ${
                hasRequested
                  ? 'bg-slate-100 text-slate-400 cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-500/25'
              }`}
            >
              {hasRequested ? 'Interview Request Sent' : 'Request Interview'}
            </button>
          )}
        </div>
      )}

      {/* CTA for logged-out visitors */}
      {!currentUser && (
        <div className="sticky bottom-20 md:bottom-6">
          <Link
            href="/auth/signup"
            className="block w-full py-4 rounded-2xl text-base font-bold shadow-lg text-center bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25 transition-colors"
          >
            Sign up to Request Interview
          </Link>
        </div>
      )}

      {/* Request modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 mb-1">Request Interview with {name}</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Add an optional message to introduce yourself and your company.
            </p>
            <textarea
              className="input-base resize-none mb-5"
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
