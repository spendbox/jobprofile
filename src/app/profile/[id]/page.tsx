'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { SkillTag } from '@/components/ui/SkillTag'
import { availabilityColor, availabilityDot, timeAgo } from '@/lib/utils'
import type { TalentProfile, UserProfile, PortfolioItem } from '@/types'
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
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
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

      const itemIds: string[] = profileData.portfolio_item_ids ?? []
      await Promise.all([
        supabase.rpc('get_passed_tests_for_user', { p_user_id: profileData.user_id }).then(({ data }) => {
          if (data) setPassedTests(data as PassedTest[])
        }),
        itemIds.length > 0
          ? supabase.from('portfolio_items').select('*').in('id', itemIds).then(({ data }) => {
              if (data) setPortfolioItems(data as PortfolioItem[])
            })
          : Promise.resolve(),
      ])

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
  const cvData = profile.cv_data

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

              {profile.timezone && (
                <div className="flex items-center gap-3 mt-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {profile.timezone}
                  </span>
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

      {/* Portfolio items */}
      {portfolioItems.length > 0 && (
        <div className="card p-6 sm:p-7 mb-5">
          <p className="section-label mb-4">Portfolio</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {portfolioItems.map((item) => {
              if (item.type === 'image' && item.file_url) {
                return (
                  <a
                    key={item.id}
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl overflow-hidden border border-slate-100 hover:border-indigo-200 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.file_url} alt={item.label} className="w-full h-28 object-cover" />
                    <div className="px-2.5 py-2 bg-white">
                      <p className="text-xs font-medium text-slate-700 truncate">{item.label}</p>
                    </div>
                  </a>
                )
              }

              const href = item.type === 'link' ? (item.external_url ?? '#') : (item.file_url ?? '#')
              const colors: Record<string, string> = {
                document: 'bg-blue-50 text-blue-600',
                video: 'bg-violet-50 text-violet-600',
                link: 'bg-emerald-50 text-emerald-600',
              }
              const iconColor = colors[item.type] ?? 'bg-slate-50 text-slate-500'

              const icons: Record<string, React.ReactNode> = {
                document: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                video: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                link: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
              }

              return (
                <a
                  key={item.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50 hover:bg-indigo-50 transition-colors text-center min-h-[100px] group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
                    {icons[item.type]}
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2">{item.label}</p>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* CV Timeline */}
      {cvData && (
        <>
          {(cvData.experience?.length > 0) && (
            <div className="card p-6 sm:p-7 mb-5">
              <p className="section-label mb-5">Experience</p>
              <div className="space-y-6">
                {cvData.experience.map((exp, i) => (
                  <div key={i} className="relative pl-5 border-l-2 border-slate-100">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-indigo-400" />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 mb-1">
                      <p className="text-sm font-bold text-slate-900">{exp.title}</p>
                      <p className="text-xs text-slate-400 flex-shrink-0">{exp.period}</p>
                    </div>
                    <p className="text-xs font-semibold text-indigo-600 mb-2">{exp.company}</p>
                    {exp.bullets?.length > 0 && (
                      <ul className="space-y-1">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                            <span className="text-slate-300 flex-shrink-0 mt-0.5">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {cvData.education?.length > 0 && (
            <div className="card p-6 sm:p-7 mb-5">
              <p className="section-label mb-4">Education</p>
              <div className="space-y-3">
                {cvData.education.map((edu, i) => (
                  <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{edu.degree}</p>
                      <p className="text-xs text-indigo-600 font-medium mt-0.5">{edu.school}</p>
                    </div>
                    <p className="text-xs text-slate-400 flex-shrink-0">{edu.period}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(cvData.certifications?.length > 0 || cvData.languages?.length > 0) && (
            <div className="card p-6 sm:p-7 mb-5">
              {cvData.certifications?.length > 0 && (
                <div className="mb-4">
                  <p className="section-label mb-3">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {cvData.certifications.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {cvData.languages?.length > 0 && (
                <div>
                  <p className="section-label mb-3">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {cvData.languages.map((l, i) => (
                      <span key={i} className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
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
