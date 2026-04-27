export type UserRole = 'talent' | 'employer'
export type AvailabilityStatus = 'available' | 'open' | 'not_looking'
export type RequestStatus = 'pending' | 'accepted' | 'declined'
export type RequestStage = 'discovered' | 'interested' | 'interview' | 'offer' | 'hired'
export type PortfolioItemType = 'image' | 'document' | 'link' | 'video'
export type EmploymentType = 'fulltime' | 'parttime' | 'contract' | 'volunteer' | 'internship'
export type WorkArrangement = 'remote' | 'hybrid' | 'onsite'
export type TalentFindStatus = 'active' | 'archived'

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

export interface TalentFind {
  id: string
  employer_id: string
  role_title: string
  employment_type: EmploymentType
  work_arrangement: WorkArrangement
  hiring_country?: string
  hiring_state?: string
  min_experience?: number
  max_experience?: number
  skills: string[]
  salary_min?: number
  salary_max?: number
  description: string
  requirements_text?: string
  custom_questions: string[]
  status: TalentFindStatus
  created_at: string
  updated_at: string
  // aggregates populated server-side
  candidate_count?: number
  interested_count?: number
  pipeline_count?: number
}

export interface TalentFindCandidate {
  id: string
  talent_find_id: string
  profile_id: string
  ai_score: number
  ai_summary?: string
  contacted: boolean
  created_at: string
  profiles?: TalentProfile & { user_profiles?: UserProfile }
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
  talent_find_id?: string
  talent_find?: TalentFind
  star_rating?: number
  question_answers?: Record<string, string>
  created_at: string
  updated_at: string
  profiles?: TalentProfile & { user_profiles?: UserProfile }
  employer?: UserProfile
  // from talent_find_candidates join (populated in pipeline view)
  ai_score?: number
  ai_summary?: string
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

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  fulltime: 'Full-time',
  parttime: 'Part-time',
  contract: 'Contract',
  volunteer: 'Volunteer',
  internship: 'Internship',
}

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

export const TIMEZONES = [
  'UTC',
  'UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6',
  'UTC-5', 'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1',
  'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+5:30',
  'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12',
]
