'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileCard } from '@/components/talent/ProfileCard'
import { SearchFiltersPanel } from '@/components/employer/SearchFilters'
import type { TalentProfile, SearchFilters, JobOpening } from '@/types'

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
  const [requestOpening, setRequestOpening] = useState<string>('')
  const [requesting, setRequesting] = useState(false)
  const [openings, setOpenings] = useState<JobOpening[]>([])
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
      .neq('availability_status', 'not_looking')

    if (currentFilters.role_title)
      query = query.ilike('role_title', `%${currentFilters.role_title}%`)
    if ((currentFilters.skills ?? []).length > 0)
      query = query.overlaps('skills', currentFilters.skills!)
    if (currentFilters.min_experience !== undefined)
      query = query.gte('years_experience', currentFilters.min_experience)
    if (currentFilters.max_experience !== undefined)
      query = query.lte('years_experience', currentFilters.max_experience)
    if (currentFilters.verified_only) {
      const { data: verifiedUsers } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('is_verified', true)
      const verifiedIds = verifiedUsers?.map((u) => u.id) ?? []
      if (verifiedIds.length === 0) {
        setProfiles([])
        setTotal(0)
        setLoading(false)
        return
      }
      query = query.in('user_id', verifiedIds)
    }

    const { data, count, error } = await query

    if (error) { console.error('search error', error); setLoading(false); return }

    if (data) {
      setProfiles(data as TalentProfile[])
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
    if (userProfile.user_role === 'employer') {
      supabase
        .from('job_openings')
        .select('*')
        .eq('employer_id', userProfile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { if (data) setOpenings(data as JobOpening[]) })
    }
  }, [userProfile, supabase])

  const submitRequest = async () => {
    if (!requestModal || !userProfile) return
    setRequesting(true)
    const { error } = await supabase.from('interview_requests').insert({
      employer_id: userProfile.id,
      profile_id: requestModal.profileId,
      message: requestMessage.trim() || null,
      opening_id: requestOpening || null,
      status: 'pending',
      stage: 'discovered',
    })
    if (!error) {
      setRequestedIds((prev) => { const s = new Set(Array.from(prev)); s.add(requestModal.profileId); return s })
    }
    setRequesting(false)
    setRequestModal(null)
    setRequestMessage('')
    setRequestOpening('')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isEmployer = userProfile?.user_role === 'employer'

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-label mb-1">Browse</p>
          <h1 className="text-2xl font-black text-slate-900">Discover Talent</h1>
          {!loading && (
            <p className="text-sm text-slate-500 mt-1">
              {total} profile{total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="md:hidden btn-secondary gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </div>

      <div className="flex gap-6">
        <SearchFiltersPanel
          filters={filters}
          onChange={(f) => { setFilters(f); setPage(0) }}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex gap-4 mb-5">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
                      <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded-lg" />
                    <div className="h-3 bg-slate-200 rounded-lg w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="card p-14 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-bold text-slate-700 mb-2">No profiles match your filters</p>
              <p className="text-sm text-slate-500">Try adjusting or clearing the filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-500 font-medium">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Request modal */}
      {requestModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 mb-1">Send Interview Request</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">Add an optional message to introduce yourself.</p>
            {openings.length > 0 && (
              <select
                className="input-base mb-4 text-sm"
                value={requestOpening}
                onChange={(e) => setRequestOpening(e.target.value)}
              >
                <option value="">No opening selected</option>
                {openings.map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>
            )}
            <textarea
              className="input-base resize-none mb-5"
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
