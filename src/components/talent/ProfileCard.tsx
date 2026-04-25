'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { SkillTag } from '@/components/ui/SkillTag'
import { formatSalary, availabilityColor, availabilityDot } from '@/lib/utils'
import type { TalentProfile, AvailabilityStatus, UserProfile } from '@/types'
import { AVAILABILITY_LABELS } from '@/types'

interface ProfileCardProps {
  profile: TalentProfile
  onRequestInterview?: (profileId: string) => void
  showRequestButton?: boolean
  hasRequested?: boolean
}

export function ProfileCard({
  profile,
  onRequestInterview,
  showRequestButton,
  hasRequested,
}: ProfileCardProps) {
  const name = profile.user_profiles?.full_name ?? 'Talent'
  const status = profile.availability_status as AvailabilityStatus
  const isVerified = (profile.user_profiles as UserProfile | undefined)?.is_verified

  return (
    <div className="card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Availability accent stripe */}
      <div className={`h-1 flex-shrink-0 ${
        status === 'available' ? 'bg-emerald-400'
        : status === 'open' ? 'bg-amber-400'
        : 'bg-slate-300'
      }`} />

      <div className="p-5 sm:p-6 flex flex-col gap-4 flex-1">
        {/* Identity row */}
        <div className="flex items-start gap-3">
          <Avatar name={name} size="md" src={profile.user_profiles?.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 truncate">{profile.role_title}</h3>
                {isVerified && (
                  <span title="Verified talent" className="inline-flex items-center justify-center w-4 h-4 bg-indigo-600 rounded-full flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            {(profile.location || profile.timezone) && (
              <p className="text-xs text-slate-500 mt-1 truncate">
                {[profile.location, profile.timezone].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${availabilityColor(status)}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${availabilityDot(status)}`} />
            {AVAILABILITY_LABELS[status]}
          </span>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{profile.bio}</p>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 5).map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
            {profile.skills.length > 5 && (
              <span className="text-xs text-slate-400 self-center">
                +{profile.skills.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Salary + experience */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatSalary(profile.salary_expectation)}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {profile.years_experience}yr exp
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-auto">
          <Link
            href={`/profile/${profile.id}`}
            className="btn-secondary flex-1 text-center text-sm py-2.5"
          >
            View Profile
          </Link>
          {showRequestButton && (
            <button
              onClick={() => onRequestInterview?.(profile.id)}
              disabled={hasRequested}
              className={`flex-1 text-sm py-2.5 rounded-xl font-semibold transition-colors ${
                hasRequested
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                  : 'btn-primary'
              }`}
            >
              {hasRequested ? 'Requested' : 'Interview'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
