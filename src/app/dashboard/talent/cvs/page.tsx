'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { timeAgo } from '@/lib/utils'
import type { UserCV } from '@/types'

export default function CVManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [cvs, setCvs] = useState<UserCV[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    supabase
      .from('user_cvs')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCvs(data as UserCV[])
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, loadingAuth])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return
    setUploading(true)
    setProgress(0)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated — please refresh.'); return }

      const path = `${userProfile.id}/${Date.now()}_${file.name}`
      const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/cvs/${path}`

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', uploadUrl)
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.setRequestHeader('x-upsert', 'true')
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100))
        }
        xhr.onload = () => {
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`))
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
      })

      const { data: pubData } = supabase.storage.from('cvs').getPublicUrl(path)
      const { data: newCv, error: dbErr } = await supabase
        .from('user_cvs')
        .insert({ user_id: userProfile.id, display_name: file.name, file_path: path, file_url: pubData.publicUrl })
        .select()
        .single()
      if (dbErr) throw new Error(dbErr.message)
      if (newCv) setCvs((prev) => [newCv as UserCV, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (cv: UserCV) => {
    await supabase.storage.from('cvs').remove([cv.file_path])
    await supabase.from('user_cvs').delete().eq('id', cv.id)
    setCvs((prev) => prev.filter((c) => c.id !== cv.id))
    setDeleteId(null)
  }

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link href="/dashboard/talent" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-900">My CVs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload and manage your CVs to attach to role profiles.</p>
        </div>
        <div className="flex-shrink-0">
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary w-full sm:w-auto">
            {uploading ? `Uploading… ${progress ?? 0}%` : 'Upload CV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {uploading && progress !== null && (
        <div className="mb-4 card p-4">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {cvs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-900">No CVs uploaded yet</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Upload your CV to attach it to your role profiles.</p>
          <button onClick={() => fileRef.current?.click()} className="btn-primary mx-auto">
            Upload CV
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cvs.map((cv) => (
            <div key={cv.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{cv.display_name}</p>
                <p className="text-xs text-slate-400">{timeAgo(cv.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a
                  href={cv.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View
                </a>
                <button
                  onClick={() => setDeleteId(cv.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-slate-900 mb-2">Delete CV?</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove the file. Any profiles using this CV will lose the link.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => { const cv = cvs.find((c) => c.id === deleteId); if (cv) handleDelete(cv) }}
                className="flex-1 btn-primary bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
