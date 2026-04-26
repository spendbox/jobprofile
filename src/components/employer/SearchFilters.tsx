'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SkillTag } from '@/components/ui/SkillTag'
import type { SearchFilters } from '@/types'

interface SearchFiltersProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  isOpen: boolean
  onClose: () => void
}

export function SearchFiltersPanel({ filters, onChange, isOpen, onClose }: SearchFiltersProps) {
  const [skillInput, setSkillInput] = useState('')
  const [roleTitles, setRoleTitles] = useState<string[]>([])
  const [roleSearch, setRoleSearch] = useState('')
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('role_titles').select('title').order('title').then(({ data }) => {
      if (data) setRoleTitles(data.map((r) => r.title))
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const update = (patch: Partial<SearchFilters>) =>
    onChange({ ...filters, ...patch })

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !(filters.skills ?? []).includes(trimmed)) {
      update({ skills: [...(filters.skills ?? []), trimmed] })
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) =>
    update({ skills: (filters.skills ?? []).filter((s) => s !== skill) })

  const clear = () =>
    onChange({})

  const panelContent = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Filters</h2>
        <button onClick={clear} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
          Clear all
        </button>
      </div>

      <div ref={roleRef} className="relative">
        <label className="label text-xs uppercase tracking-wide text-slate-500">Role / Title</label>
        <div className="relative">
          <input
            className="input-base text-sm pr-8"
            placeholder="Search role titles…"
            value={roleSearch !== '' ? roleSearch : (filters.role_title ?? '')}
            onFocus={() => { setRoleSearch(''); setRoleDropdownOpen(true) }}
            onChange={(e) => { setRoleSearch(e.target.value); setRoleDropdownOpen(true) }}
          />
          {filters.role_title && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => { update({ role_title: undefined }); setRoleSearch('') }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {roleDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {roleTitles
              .filter((t) => t.toLowerCase().includes((roleSearch || filters.role_title || '').toLowerCase()))
              .slice(0, 30)
              .map((title) => (
                <button
                  key={title}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filters.role_title === title ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    update({ role_title: title })
                    setRoleSearch('')
                    setRoleDropdownOpen(false)
                  }}
                >
                  {title}
                </button>
              ))}
            {roleTitles.filter((t) => t.toLowerCase().includes((roleSearch || filters.role_title || '').toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No matching titles</div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="label text-xs uppercase tracking-wide text-slate-500">Skills</label>
        <div className="flex gap-2">
          <input
            className="input-base text-sm"
            placeholder="Add skill filter"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
          />
          <button type="button" onClick={addSkill} className="btn-secondary px-3 py-2 text-sm flex-shrink-0">
            Add
          </button>
        </div>
        {(filters.skills ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(filters.skills ?? []).map((s) => (
              <SkillTag key={s} skill={s} onRemove={() => removeSkill(s)} />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label text-xs uppercase tracking-wide text-slate-500">Experience (years)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            className="input-base text-sm"
            placeholder="Min"
            value={filters.min_experience ?? ''}
            onChange={(e) => update({ min_experience: e.target.value ? Number(e.target.value) : undefined })}
          />
          <input
            type="number"
            min={0}
            className="input-base text-sm"
            placeholder="Max"
            value={filters.max_experience ?? ''}
            onChange={(e) => update({ max_experience: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div>
        <label className="label text-xs uppercase tracking-wide text-slate-500">Trust</label>
        <label className="flex items-center gap-2 py-1.5 cursor-pointer">
          <input
            type="checkbox"
            className="accent-indigo-600 w-4 h-4"
            checked={filters.verified_only ?? false}
            onChange={(e) => update({ verified_only: e.target.checked || undefined })}
          />
          <span className="text-sm text-slate-700 flex items-center gap-1.5">
            Verified only
            <span className="inline-flex items-center justify-center w-4 h-4 bg-indigo-600 rounded-full flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          </span>
        </label>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="card p-5 sticky top-20">{panelContent}</div>
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative ml-auto w-80 max-w-full bg-white h-full overflow-y-auto p-5 pb-24">
            {panelContent}
            <button className="btn-primary w-full mt-6" onClick={onClose}>
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  )
}
