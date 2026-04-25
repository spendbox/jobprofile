'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileCard } from '@/components/talent/ProfileCard'
import { SearchFiltersPanel } from '@/components/employer/SearchFilters'
import type { TalentProfile, SearchFilters } from '@/types'

const PAGE_SIZE = 12

export default function SearchPage() {
  const supabase = createClient()
  const { userProfile } = useAuth()

  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [filters, setFilters] = useState<SearchFilters>({})
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())
  const [requestModal, setRequestModal] = useState<{ profileId: string } | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchProfiles = useCallback(async (currentFilters: SearchFilters, currentPage: number) => {
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('*, user_profiles!profiles_user_id_user_profiles_fkey(*)', { count: 'exact' })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)
      .order('times_shown', { ascending: true })
      .order('availability_updated_at', { ascending: false })

    if (currentFilters.role_title)
      query = query.ilike('role_title', `%${currentFilters.role_title}%`)
    if (currentFilters.location)
      query = query.ilike('location', `%${currentFilters.location}%`)
    if ((currentFilters.skills ?? []).length > 0)
      query = query.overlaps('skills', currentFilters.skills!)
    if (currentFilters.availability?.length)
      query = query.in('availability_status', currentFilters.availability)
    if (currentFilters.min_experience !== undefined)
      query = query.gte('years_experience', currentFilters.min_experience)
    if (currentFilters.max_experience !== undefined)
      query = query.lte('years_experience', currentFilters.max_experience)
    if (currentFilters.min_salary !== undefined)
      query = query.gte('salary_expectation', currentFilters.min_salary)
    if (currentFilters.max_salary !== undefined)
      query = query.lte('salary_expectation', currentFilters.max_salary)

    const { data, count, error } = await query

    if (error) { console.error('search error', error); setLoading(false); return }

    if (data) {
      setProfiles(data as TalentProfile[])
      // Fire-and-forget exposure tracking — does not block render
      const ids = data.map((p) => p.id)
      if (ids.length > 0)
        supabase.rpc('increment_times_shown_batch', { profile_ids: ids }).then(() => {})
    }
    if (count !== null) setTotal(count)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfiles(filters, page)
  }, [filters, page, fetchProfiles])

  useEffect(() => {
    if (!userProfile) return
    supabase
      .from('interview_requests')
      .select('profile_id')
      .eq('employer_id', userProfile.id)
      .then(({ data }) => {
        if (data) setRequestedIds(new Set(data.map((r) => r.profile_id)))
      })
  }, [userProfile, supabase])

  const submitRequest = async () => {
    if (!requestModal || !userProfile) return
    setRequesting(true)
    const { error } = await supabase.from('interview_requests').insert({
      employer_id: userProfile.id,
      profile_id: requestModal.profileId,
      message: requestMessage.trim() || null,
      status: 'pending',
      stage: 'discovered',
    })
    if (!error) {
      setRequestedIds((prev) => { const s = new Set(Array.from(prev)); s.add(requestModal.profileId); return s })
    }
    setRequesting(false)
    setRequestModal(null)
    setRequestMessage('')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isEmployer = userProfile?.user_role === 'employer'

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Discover Talent</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} profiles found</p>
        </div>
        <button onClick={() => setFiltersOpen(true)} className="md:hidden btn-secondary gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </div>

      <div className="flex gap-6">
        <SearchFiltersPanel filters={filters} onChange={(f) => { setFilters(f); setPage(0) }} isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded" />
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="font-semibold text-slate-700 mb-1">No profiles match your filters</p>
              <p className="text-sm text-slate-500">Try adjusting or clearing the filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    showRequestButton={isEmployer}
                    hasRequested={requestedIds.has(profile.id)}
                    onRequestInterview={(id) => setRequestModal({ profileId: id })}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Previous</button>
                  <span className="text-sm text-slate-500">{page + 1} / {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-slate-900 mb-1">Send Interview Request</h3>
            <p className="text-sm text-slate-500 mb-4">Add an optional message to introduce yourself.</p>
            <textarea
              className="input-base resize-none mb-4"
              rows={3}
              placeholder="Hi! We're looking for someone to join our team…"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setRequestModal(null)} className="btn-secondary flex-1">Cancel</button>
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
