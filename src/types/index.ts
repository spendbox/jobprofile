export type UserRole = 'talent' | 'employer'
export type AvailabilityStatus = 'available' | 'open' | 'not_looking'
export type RequestStatus = 'pending' | 'accepted' | 'declined'
export type RequestStage = 'discovered' | 'interested' | 'interview' | 'offer' | 'hired'
export type PortfolioItemType = 'image' | 'document' | 'link' | 'video'

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

export interface PortfolioItem {
  id: string
  user_id: string
  label: string
  type: PortfolioItemType
  file_path?: string
  file_url?: string
  external_url?: string
  created_at: string
}

export interface CVExperience {
  title: string
  company: string
  period: string
  bullets: string[]
}

export interface CVEducation {
  degree: string
  school: string
  period: string
}

export interface CVData {
  summary?: string
  experience: CVExperience[]
  education: CVEducation[]
  certifications: string[]
  languages: string[]
}

export interface TalentProfile {
  id: string
  user_id: string
  role_title: string
  bio?: string
  skills: string[]
  years_experience: number
  timezone?: string
  availability_status: AvailabilityStatus
  cv_data?: CVData
  cv_file_path?: string
  portfolio_item_ids: string[]
  profile_views: number
  times_shown: number
  availability_updated_at: string
  created_at: string
  updated_at: string
  user_profiles?: UserProfile
}

export interface JobOpening {
  id: string
  employer_id: string
  title: string
  created_at: string
}

export interface InterviewRequest {
  id: string
  employer_id: string
  profile_id: string
  status: RequestStatus
  stage: RequestStage
  message?: string
  notes?: string
  archived: boolean
  opening_id?: string
  opening?: JobOpening
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
