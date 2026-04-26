export type UserRole = 'talent' | 'employer'
export type AvailabilityStatus = 'available' | 'open' | 'not_looking'
export type RequestStatus = 'pending' | 'accepted' | 'declined'
export type RequestStage = 'discovered' | 'interested' | 'interview' | 'offer' | 'hired'

export interface UserProfile {
  id: string
  full_name: string
  user_role: UserRole
  company_name?: string
  avatar_url?: string
  is_verified?: boolean
  verified_at?: string
  created_at: string
}

export interface TestQuestion {
  id: string
  text: string
  options: string[]
  correct: number
}

export interface ProficiencyTest {
  id: string
  title: string
  description?: string
  skill_category: string
  questions: TestQuestion[]
  passing_score: number
  time_limit_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TestAttempt {
  id: string
  user_id: string
  test_id: string
  score: number
  passed: boolean
  answers: Record<string, number>
  completed_at: string
}

export interface TalentProfile {
  id: string
  user_id: string
  role_title: string
  bio?: string
  skills: string[]
  years_experience: number
  location?: string
  timezone?: string
  availability_status: AvailabilityStatus
  portfolio_url?: string
  cv_url?: string
  intro_video_url?: string
  profile_views: number
  times_shown: number
  availability_updated_at: string
  created_at: string
  updated_at: string
  user_profiles?: UserProfile
}

export interface InterviewRequest {
  id: string
  employer_id: string
  profile_id: string
  status: RequestStatus
  stage: RequestStage
  message?: string
  created_at: string
  updated_at: string
  profiles?: TalentProfile & { user_profiles?: UserProfile }
  employer?: UserProfile
}

export interface UserCV {
  id: string
  user_id: string
  display_name: string
  file_path: string
  file_url: string
  created_at: string
}

export interface SearchFilters {
  role_title?: string
  skills?: string[]
  min_experience?: number
  max_experience?: number
  availability?: AvailabilityStatus[]
  location?: string
  verified_only?: boolean
}

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available Now',
  open: 'Open to Offers',
  not_looking: 'Not Looking',
}

export const STAGE_LABELS: Record<RequestStage, string> = {
  discovered: 'Discovered',
  interested: 'Interested',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
}

export const TIMEZONES = [
  'UTC',
  'UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6',
  'UTC-5', 'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1',
  'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+5:30',
  'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12',
]
