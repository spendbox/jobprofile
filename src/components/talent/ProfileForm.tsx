'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SkillTag } from '@/components/ui/SkillTag'
import { TIMEZONES } from '@/types'
import type { TalentProfile, AvailabilityStatus } from '@/types'

interface ProfileFormProps {
  userId: string
  existing?: TalentProfile
  onSaved: (profile: TalentProfile) => void
  onCancel: () => void
}

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; desc: string }[] = [
  { value: 'available', label: 'Available Now', desc: 'Actively looking, available immediately' },
  { value: 'open', label: 'Open to Offers', desc: 'Employed but open to the right opportunity' },
  { value: 'not_looking', label: 'Not Looking', desc: 'Not seeking new opportunities right now' },
]

export function ProfileForm({ userId, existing, onSaved, onCancel }: ProfileFormProps) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [uploadingCv, setUploadingCv] = useState(false)

  const [form, setForm] = useState({
    role_title: existing?.role_title ?? '',
    bio: existing?.bio ?? '',
    skills: existing?.skills ?? ([] as string[]),
    years_experience: existing?.years_experience ?? 0,
    salary_expectation: existing?.salary_expectation ?? '',
    location: existing?.location ?? '',
    timezone: existing?.timezone ?? 'UTC',
    availability_status: (existing?.availability_status ?? 'open') as AvailabilityStatus,
    portfolio_url: existing?.portfolio_url ?? '',
    intro_video_url: existing?.intro_video_url ?? '',
    cv_url: existing?.cv_url ?? '',
  })

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !form.skills.includes(trimmed)) {
      set('skills', [...form.skills, trimmed])
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) =>
    set('skills', form.skills.filter((s) => s !== skill))

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCv(true)
    setError('')
    const path = `${userId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('cvs').upload(path, file, { upsert: true })
    if (uploadError) {
      setError(`CV upload failed: ${uploadError.message}`)
    } else {
      const { data } = supabase.storage.from('cvs').getPublicUrl(path)
      set('cv_url', data.publicUrl)
    }
    setUploadingCv(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.role_title.trim()) { setError('Role title is required'); return }
    setLoading(true)
    setError('')

    const payload = {
      user_id: userId,
      role_title: form.role_title.trim(),
      bio: form.bio.trim() || null,
      skills: form.skills,
      years_experience: Number(form.years_experience),
      salary_expectation: form.salary_expectation ? Number(form.salary_expectation) : null,
      location: form.location.trim() || null,
      timezone: form.timezone || null,
      availability_status: form.availability_status,
      portfolio_url: form.portfolio_url.trim() || null,
      intro_video_url: form.intro_video_url.trim() || null,
      cv_url: form.cv_url || null,
      availability_updated_at: new Date().toISOString(),
    }

    let data, dbError
    if (existing?.id) {
      ;({ data, error: dbError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', existing.id)
        .select('*, user_profiles(*)')
        .single())
    } else {
      ;({ data, error: dbError } = await supabase
        .from('profiles')
        .insert(payload)
        .select('*, user_profiles(*)')
        .single())
    }

    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    onSaved(data as TalentProfile)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label className="label">Role Title *</label>
        <input
          className="input-base"
          placeholder="e.g. Frontend Developer, Virtual Assistant…"
          value={form.role_title}
          onChange={(e) => set('role_title', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">Professional Bio</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          placeholder="A short intro about your experience and what you bring to the table…"
          value={form.bio}
          onChange={(e) => set('bio', e.target.value)}
        />
      </div>

      <div>
        <label className="label">Skills</label>
        <div className="flex gap-2">
          <input
            className="input-base"
            placeholder="Type a skill and press Enter"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addSkill() }
            }}
          />
          <button type="button" onClick={addSkill} className="btn-secondary px-3 py-2 flex-shrink-0">
            Add
          </button>
        </div>
        {form.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.skills.map((s) => (
              <SkillTag key={s} skill={s} onRemove={() => removeSkill(s)} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Years of Experience</label>
          <input
            type="number"
            min={0}
            max={50}
            className="input-base"
            value={form.years_experience}
            onChange={(e) => set('years_experience', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Monthly Salary (USD)</label>
          <input
            type="number"
            min={0}
            className="input-base"
            placeholder="e.g. 3000"
            value={form.salary_expectation}
            onChange={(e) => set('salary_expectation', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Location</label>
          <input
            className="input-base"
            placeholder="City, Country"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Timezone</label>
          <select
            className="input-base"
            value={form.timezone}
            onChange={(e) => set('timezone', e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Availability</label>
        <div className="space-y-2">
          {AVAILABILITY_OPTIONS.map(({ value, label, desc }) => (
            <label
              key={value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                form.availability_status === value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="availability_status"
                value={value}
                checked={form.availability_status === value}
                onChange={() => set('availability_status', value)}
                className="mt-0.5 accent-indigo-600"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Portfolio URL</label>
        <input
          type="url"
          className="input-base"
          placeholder="https://yourportfolio.com"
          value={form.portfolio_url}
          onChange={(e) => set('portfolio_url', e.target.value)}
        />
      </div>

      <div>
        <label className="label">Intro Video URL (optional)</label>
        <input
          type="url"
          className="input-base"
          placeholder="https://loom.com/share/…"
          value={form.intro_video_url}
          onChange={(e) => set('intro_video_url', e.target.value)}
        />
      </div>

      <div>
        <label className="label">CV / Resume</label>
        {form.cv_url && (
          <p className="text-xs text-emerald-700 mb-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            CV uploaded
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleCvUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadingCv}
          className="btn-secondary w-full text-sm"
        >
          {uploadingCv ? 'Uploading…' : form.cv_url ? 'Replace CV' : 'Upload CV (PDF, DOC)'}
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving…' : existing?.id ? 'Save Changes' : 'Create Profile'}
        </button>
      </div>
    </form>
  )
}
