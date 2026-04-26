'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SkillTag } from '@/components/ui/SkillTag'
import { TIMEZONES } from '@/types'
import type { TalentProfile, AvailabilityStatus, UserCV } from '@/types'

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

const STEP_LABELS = ['The Role', 'Skills', 'Availability', 'CV & Links']

export function ProfileForm({ userId, existing, onSaved, onCancel }: ProfileFormProps) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [uploadingCv, setUploadingCv] = useState(false)
  const [cvProgress, setCvProgress] = useState<number | null>(null)
  const [userCvs, setUserCvs] = useState<UserCV[]>([])

  useEffect(() => {
    supabase
      .from('user_cvs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setUserCvs(data as UserCV[]) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const [form, setForm] = useState({
    role_title: existing?.role_title ?? '',
    bio: existing?.bio ?? '',
    skills: existing?.skills ?? ([] as string[]),
    years_experience: existing?.years_experience ?? 0,
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
    setCvProgress(0)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated — please refresh.'); setUploadingCv(false); return }

      const path = `${userId}/${Date.now()}_${file.name}`
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/cvs/${path}`

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.setRequestHeader('x-upsert', 'true')
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) setCvProgress(Math.round((evt.loaded / evt.total) * 100))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`))
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
      })

      const { data: pubData } = supabase.storage.from('cvs').getPublicUrl(path)
      const { data: newCv } = await supabase
        .from('user_cvs')
        .insert({ user_id: userId, display_name: file.name, file_path: path, file_url: pubData.publicUrl })
        .select()
        .single()
      if (newCv) {
        setUserCvs((prev) => [newCv as UserCV, ...prev])
        set('cv_url', pubData.publicUrl)
      }
      setCvProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CV upload failed')
      setCvProgress(null)
    } finally {
      setUploadingCv(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.role_title.trim()) { setError('Role title is required'); setStep(1); return }
    setLoading(true)
    setError('')

    const payload = {
      user_id: userId,
      role_title: form.role_title.trim(),
      bio: form.bio.trim() || null,
      skills: form.skills,
      years_experience: Number(form.years_experience),
      timezone: form.timezone || null,
      availability_status: form.availability_status,
      portfolio_url: form.portfolio_url.trim() || null,
      intro_video_url: form.intro_video_url.trim() || null,
      cv_url: form.cv_url || null,
      availability_updated_at: new Date().toISOString(),
    }

    try {
      let data, dbError
      if (existing?.id) {
        ;({ data, error: dbError } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', existing.id)
          .select('*')
          .single())
      } else {
        ;({ data, error: dbError } = await supabase
          .from('profiles')
          .insert(payload)
          .select('*')
          .single())
      }

      if (dbError) { setError(dbError.message); return }
      onSaved(data as TalentProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const advance = () => {
    if (step === 1 && !form.role_title.trim()) { setError('Role title is required'); return }
    setError('')
    setStep((s) => (s + 1) as 1 | 2 | 3 | 4)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky header */}
      <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-4 sticky top-0 bg-white z-10">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-slate-500">
              Step {step} of {STEP_LABELS.length} · {STEP_LABELS[step - 1]}
            </p>
            <p className="text-xs font-bold text-slate-900">
              {existing?.id ? 'Edit Profile' : 'New Profile'}
            </p>
          </div>
          <div className="flex gap-1">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-indigo-600' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step body */}
      <div className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* ── Step 1: The Role ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">What role are you offering?</h2>
              <p className="text-sm text-slate-500">This is the headline employers see on your profile card.</p>
            </div>

            <div>
              <label className="label">Role Title *</label>
              <input
                className="input-base text-base"
                placeholder="e.g. Frontend Developer, Virtual Assistant…"
                value={form.role_title}
                onChange={(e) => set('role_title', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && form.role_title.trim()) advance() }}
                autoFocus
              />
            </div>

            <div>
              <label className="label">
                Professional Bio
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                className="input-base resize-none"
                rows={5}
                placeholder="A short intro about your experience and what you bring to the table…"
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Skills ───────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">What are your skills?</h2>
              <p className="text-sm text-slate-500">Add keywords employers can search for.</p>
            </div>

            <div>
              <label className="label">Skills</label>
              <div className="flex gap-2">
                <input
                  className="input-base"
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  autoFocus
                />
                <button type="button" onClick={addSkill} className="btn-secondary px-3 py-2 flex-shrink-0">
                  Add
                </button>
              </div>
              {form.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {form.skills.map((s) => (
                    <SkillTag key={s} skill={s} onRemove={() => removeSkill(s)} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">No skills added yet.</p>
              )}
            </div>

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
          </div>
        )}

        {/* ── Step 3: Availability ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">What&apos;s your availability?</h2>
              <p className="text-sm text-slate-500">Employers see this on your profile card.</p>
            </div>

            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
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
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
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
        )}

        {/* ── Step 4: CV & Links ───────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">CV &amp; portfolio links</h2>
              <p className="text-sm text-slate-500">Optional — help employers learn more about you.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">CV / Resume</label>
                <Link href="/dashboard/talent/cvs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Manage CVs
                </Link>
              </div>

              {userCvs.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${!form.cv_url ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      checked={!form.cv_url}
                      onChange={() => set('cv_url', '')}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-slate-500">No CV attached</span>
                  </label>
                  {userCvs.map((cv) => (
                    <label
                      key={cv.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${form.cv_url === cv.file_url ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <input
                        type="radio"
                        checked={form.cv_url === cv.file_url}
                        onChange={() => set('cv_url', cv.file_url)}
                        className="accent-indigo-600"
                      />
                      <span className="flex-1 text-sm text-slate-900 truncate">{cv.display_name}</span>
                      <a
                        href={cv.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex-shrink-0"
                      >
                        View
                      </a>
                    </label>
                  ))}
                </div>
              )}

              {uploadingCv && cvProgress !== null && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Uploading…</span>
                    <span>{cvProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-150"
                      style={{ width: `${cvProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCvUpload} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingCv}
                className="btn-secondary w-full text-sm"
              >
                {uploadingCv ? `Uploading… ${cvProgress ?? 0}%` : '+ Upload New CV'}
              </button>
              {userCvs.length === 0 && !uploadingCv && (
                <p className="text-xs text-slate-400 mt-1.5 text-center">No CVs yet — upload one above.</p>
              )}
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
              <label className="label">
                Intro Video URL
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="url"
                className="input-base"
                placeholder="https://loom.com/share/…"
                value={form.intro_video_url}
                onChange={(e) => set('intro_video_url', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer nav */}
      <div className="border-t border-slate-100 px-5 py-4 flex items-center gap-3 sticky bottom-0 bg-white">
        {step > 1 ? (
          <button
            onClick={() => { setError(''); setStep((s) => (s - 1) as 1 | 2 | 3 | 4) }}
            className="btn-secondary"
          >
            Back
          </button>
        ) : (
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}

        {step < 4 ? (
          <button onClick={advance} className="btn-primary flex-1">
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Saving…' : existing?.id ? 'Save Changes' : 'Create Profile'}
          </button>
        )}
      </div>
    </div>
  )
}
