'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { timeAgo } from '@/lib/utils'

// ─── Word list for liveness phrase ────────────────────────────────────────────
const WORDS = [
  'apple','beach','cabin','dance','eagle','fence','globe','hotel','igloo','jewel',
  'kite','lemon','mango','noble','ocean','piano','queen','river','solar','tiger',
  'uncle','venus','water','xenon','yacht','zebra','amber','brick','cloud','debug',
  'ember','flute','grace','honey','inner','judge','kneel','lunar','mirth','nerve',
  'olive','patch','quote','radar','scout','thorn','ultra','vivid','waltz','xerox',
  'yield','zonal','azure','brave','coral','dusty','enjoy','float','guard','haste',
  'input','joker','knife','logic','marsh','north','order','prose','query','rapid',
  'store','tribe','ultra','voice','wheat','pixel','youth','zest','acorn','blade',
  'chess','drift','exist','flame','grain','heron','ideal','joint','karma','label',
]

function randomPhrase(): string {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).join(' · ')
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type RecordState = 'idle' | 'starting' | 'recording' | 'preview' | 'cam-error'

export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [alreadyVerified, setAlreadyVerified] = useState(false)
  const [alreadyPending, setAlreadyPending] = useState(false)
  const [pendingAt, setPendingAt] = useState<string | null>(null)

  // Step 1
  const [legalName, setLegalName] = useState('')

  // Step 2
  const [phrase, setPhrase] = useState<string>(() => randomPhrase())
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [countdown, setCountdown] = useState(10)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [camError, setCamError] = useState('')
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Step 3
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docError, setDocError] = useState('')
  const docFileRef = useRef<HTMLInputElement>(null)

  // Step 4
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    if (userProfile.is_verified) { setAlreadyVerified(true); return }

    supabase
      .from('user_profiles')
      .select('verification_doc_path, verification_requested_at, verification_legal_name')
      .eq('id', userProfile.id)
      .single()
      .then(({ data }) => {
        if (data?.verification_doc_path) {
          setAlreadyPending(true)
          setPendingAt(data.verification_requested_at)
        }
        if (data?.verification_legal_name) setLegalName(data.verification_legal_name)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, loadingAuth])

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    setCamError('')
    setRecordState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream
        liveVideoRef.current.muted = true
        await liveVideoRef.current.play().catch(() => {})
      }
      setRecordState('idle')
    } catch {
      setCamError('Camera access denied. Please allow camera and microphone access and try again.')
      setRecordState('cam-error')
    }
  }, [])

  useEffect(() => {
    if (step === 2) {
      startCamera()
    } else {
      stopStream()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    setCountdown(10)
    setRecordState('recording')

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : ''

    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      setVideoBlob(blob)
      if (previewVideoRef.current) {
        previewVideoRef.current.src = URL.createObjectURL(blob)
      }
      stopStream()
      setRecordState('preview')
    }
    recorder.start(100)

    let secs = 10
    timerRef.current = setInterval(() => {
      secs--
      setCountdown(secs)
      if (secs <= 0) {
        clearInterval(timerRef.current!)
        recorder.stop()
      }
    }, 1000)
  }

  const retryRecording = () => {
    setVideoBlob(null)
    setPhrase(randomPhrase())
    setCountdown(10)
    setRecordState('idle')
    startCamera()
  }

  const handleDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocError('')
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) { setDocError('Only JPG, PNG, WEBP or PDF files are accepted.'); return }
    if (file.type.startsWith('video/')) { setDocError('Video files are not accepted here.'); return }
    if (file.size > 10 * 1024 * 1024) { setDocError('File must be under 10 MB.'); return }
    setDocFile(file)
  }

  const handleSubmit = async () => {
    if (!userProfile || !videoBlob || !docFile) return
    setSubmitting(true)
    setSubmitError('')
    setUploadProgress(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setSubmitError('Not authenticated — please refresh.'); return }

      const now = Date.now()
      const livenessExt = videoBlob.type.includes('mp4') ? 'mp4' : 'webm'
      const livenessPat = `${userProfile.id}/liveness_${now}.${livenessExt}`
      const docExt = docFile.name.split('.').pop()
      const docPath = `${userProfile.id}/id_${now}.${docExt}`
      const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/verification-docs`

      // Upload liveness video (0–50%)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${baseUrl}/${livenessPat}`)
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('Content-Type', videoBlob.type || 'video/webm')
        xhr.setRequestHeader('x-upsert', 'true')
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) setUploadProgress(Math.round((evt.loaded / evt.total) * 50))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Liveness upload failed (${xhr.status})`))
        xhr.onerror = () => reject(new Error('Network error uploading liveness video'))
        xhr.send(videoBlob)
      })

      // Upload ID document (50–100%)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${baseUrl}/${docPath}`)
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('Content-Type', docFile.type || 'application/octet-stream')
        xhr.setRequestHeader('x-upsert', 'true')
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) setUploadProgress(50 + Math.round((evt.loaded / evt.total) * 50))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Document upload failed (${xhr.status})`))
        xhr.onerror = () => reject(new Error('Network error uploading document'))
        xhr.send(docFile)
      })

      const submittedAt = new Date().toISOString()
      const { error: dbErr } = await supabase
        .from('user_profiles')
        .update({
          verification_legal_name: legalName.trim(),
          verification_liveness_path: livenessPat,
          verification_doc_path: docPath,
          verification_requested_at: submittedAt,
        })
        .eq('id', userProfile.id)

      if (dbErr) throw new Error(dbErr.message)
      setUploadProgress(100)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingAuth) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  if (alreadyVerified) {
    return (
      <div className="page-container max-w-lg">
        <div className="card overflow-hidden">
          <div className="h-1 bg-indigo-500" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">You&apos;re Verified!</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              Your identity has been confirmed. A verified badge appears on your profile.
            </p>
            <Link href="/dashboard/talent" className="btn-primary mx-auto mt-6 inline-flex">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  if (submitted || alreadyPending) {
    return (
      <div className="page-container max-w-lg">
        <Link href="/dashboard/talent" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </Link>
        <div className="card overflow-hidden">
          <div className="h-1 bg-amber-400" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              {submitted ? 'Verification Submitted!' : 'Under Review'}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              {submitted
                ? 'Your identity documents have been sent to our team.'
                : `Your submission was received ${pendingAt ? timeAgo(pendingAt) : 'recently'}.`}
              {' '}Our team reviews within 1–2 business days.
            </p>
            <Link href="/dashboard/talent" className="btn-primary mx-auto mt-6 inline-flex">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const stepLabels = ['Legal Name', 'Liveness', 'Document', 'Confirm']

  return (
    <div className="page-container max-w-lg">
      <Link href="/dashboard/talent" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <p className="section-label mb-1">Identity</p>
        <h1 className="text-2xl font-black text-slate-900">Account Verification</h1>
        <p className="text-sm text-slate-500 mt-1">Complete all steps to earn a verified badge on your profile.</p>
      </div>

      {/* Step progress bar */}
      <div className="flex items-center gap-0 mb-8">
        {stepLabels.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4
          const done = n < step
          const active = n === step
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  done ? 'bg-indigo-600 text-white'
                  : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-slate-100 text-slate-400'
                }`}>
                  {done
                    ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    : n}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${active ? 'text-indigo-600' : done ? 'text-slate-400' : 'text-slate-300'}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 sm:mb-5 transition-colors ${done ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Legal Name ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="font-bold text-slate-900 mb-1">Enter your legal name</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your full name exactly as it appears on your government-issued ID.
            </p>
          </div>
          <div>
            <label className="section-label mb-1.5 block">Full Legal Name</label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. Jane Marie Doe"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1.5">Must match the name on your ID document exactly.</p>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={legalName.trim().split(/\s+/).filter(Boolean).length < 2}
            className="btn-primary w-full"
          >
            Continue
          </button>
        </div>
      )}

      {/* ── Step 2: Liveness Check ─────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="font-bold text-slate-900 mb-1">Liveness check</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Look at the camera and read the phrase aloud during the 10-second recording.
              </p>
            </div>

            {recordState !== 'cam-error' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-4 text-center">
                <p className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-2">Say this phrase</p>
                <p className="text-2xl font-black text-indigo-700 tracking-wide leading-snug">{phrase}</p>
              </div>
            )}

            {/* Camera / preview area */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
              <video
                ref={liveVideoRef}
                className={`w-full h-full object-cover ${recordState === 'preview' ? 'hidden' : 'block'}`}
                playsInline
                muted
              />
              <video
                ref={previewVideoRef}
                className={`w-full h-full object-cover ${recordState === 'preview' ? 'block' : 'hidden'}`}
                controls
                playsInline
              />

              {recordState === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <p className="text-white text-sm font-medium">Starting camera…</p>
                </div>
              )}

              {recordState === 'recording' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-red-500/90 flex items-center justify-center">
                    <span className="text-3xl font-black text-white">{countdown}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-bold">Recording</span>
                  </div>
                </div>
              )}

              {recordState === 'cam-error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <svg className="w-8 h-8 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-300 text-sm font-medium mb-1">Camera unavailable</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{camError}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {recordState === 'cam-error' && (
                <button onClick={startCamera} className="btn-secondary w-full">Retry Camera Access</button>
              )}
              {recordState === 'idle' && (
                <button onClick={startRecording} className="btn-primary w-full flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  Start Recording
                </button>
              )}
              {recordState === 'recording' && (
                <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Recording — {countdown}s remaining…
                </div>
              )}
              {recordState === 'preview' && (
                <>
                  <button onClick={retryRecording} className="btn-secondary w-full">Retry (new phrase)</button>
                  <button onClick={() => setStep(3)} className="btn-primary w-full">Looks good — Continue</button>
                </>
              )}
            </div>

            <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-slate-600 text-center w-full pt-1">
              Back
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Document Upload ────────────────────────────────────────── */}
      {step === 3 && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="font-bold text-slate-900 mb-1">Upload your ID document</h2>
            <p className="text-sm text-slate-500 leading-relaxed">A clear photo or scan of a government-issued ID.</p>
          </div>

          <div>
            <p className="section-label mb-2">Accepted documents</p>
            <ul className="space-y-1.5">
              {['National ID card', 'Passport (photo page)', "Driver's licence", 'Residence permit'].map((doc) => (
                <li key={doc} className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
            Stored securely. Only accessible to TalentDeck admins for verification. Never shared with employers.
          </div>

          {docError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{docError}</div>
          )}

          {docFile ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{docFile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatBytes(docFile.size)}</p>
              </div>
              <button
                onClick={() => { setDocFile(null); if (docFileRef.current) docFileRef.current.value = '' }}
                className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <input
                ref={docFileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={handleDocFile}
              />
              <button onClick={() => docFileRef.current?.click()} className="btn-secondary w-full">Choose File</button>
              <p className="text-xs text-center text-slate-400">JPG, PNG, WEBP or PDF · Max 10 MB · No videos</p>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
            <button onClick={() => setStep(4)} disabled={!docFile} className="btn-primary flex-1">Continue</button>
          </div>
        </div>
      )}

      {/* ── Step 4: Review & Confirm ───────────────────────────────────────── */}
      {step === 4 && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="font-bold text-slate-900 mb-1">Review &amp; confirm</h2>
            <p className="text-sm text-slate-500">Check everything before submitting.</p>
          </div>

          <div className="space-y-3">
            {([
              {
                label: 'Legal Name',
                value: legalName.trim(),
                icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
                badge: null,
              },
              {
                label: 'Liveness Recording',
                value: 'Video recorded (10 seconds)',
                icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
                badge: 'check',
              },
              {
                label: 'ID Document',
                value: docFile?.name ?? '',
                sub: docFile ? formatBytes(docFile.size) : '',
                icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                badge: null,
              },
            ] as const).map(({ label, value, icon, badge, ...rest }) => (
              <div key={label} className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
                  {'sub' in rest && rest.sub && <p className="text-xs text-slate-400">{rest.sub}</p>}
                </div>
                {badge === 'check' && (
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-indigo-600 w-4 h-4 flex-shrink-0"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="text-sm text-slate-700 leading-relaxed">
              I confirm all details above are accurate and this is my own identity. I understand that providing false information may result in account termination.
            </span>
          </label>

          {submitting && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{submitError}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setStep(3)} disabled={submitting} className="btn-secondary flex-1">Back</button>
            <button onClick={handleSubmit} disabled={!confirmed || submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting…' : 'Submit Verification'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
