'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { timeAgo } from '@/lib/utils'
import type { PortfolioItem, PortfolioItemType } from '@/types'

const TYPE_META: Record<PortfolioItemType, { label: string; color: string; icon: React.ReactNode }> = {
  image: {
    label: 'Image',
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 10.5h18M3 7.5h18" />
      </svg>
    ),
  },
  document: {
    label: 'Document',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  link: {
    label: 'Link',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  video: {
    label: 'Video',
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
}

type FilterTab = 'all' | PortfolioItemType

export default function PortfolioPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userProfile, loadingAuth } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editLabelId, setEditLabelId] = useState<string | null>(null)
  const [editLabelValue, setEditLabelValue] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Add item form state
  const [addType, setAddType] = useState<PortfolioItemType>('image')
  const [addLabel, setAddLabel] = useState('')
  const [addUrl, setAddUrl] = useState('')
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addProgress, setAddProgress] = useState<number | null>(null)
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (loadingAuth) return
    if (!userProfile) { router.push('/auth/login'); return }
    if (userProfile.user_role === 'employer') { router.push('/dashboard/employer'); return }

    supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as PortfolioItem[])
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, loadingAuth])

  const resetAddForm = () => {
    setAddLabel('')
    setAddUrl('')
    setAddFile(null)
    setAddError('')
    setAddProgress(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleAdd = async () => {
    if (!userProfile) return
    if (!addLabel.trim()) { setAddError('Label is required'); return }
    if (addType === 'link' || addType === 'video') {
      if (!addUrl.trim()) { setAddError('URL is required'); return }
    } else {
      if (!addFile) { setAddError('Please select a file'); return }
    }

    setAdding(true)
    setAddError('')

    try {
      let file_path: string | undefined
      let file_url: string | undefined
      let external_url: string | undefined

      if (addType === 'link' || addType === 'video') {
        external_url = addUrl.trim()
      } else if (addFile) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        const ext = addFile.name.split('.').pop()
        const path = `${userProfile.id}/${Date.now()}_${addFile.name}`
        const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/portfolio/${path}`

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', uploadUrl)
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
          xhr.setRequestHeader('Content-Type', addFile.type || 'application/octet-stream')
          xhr.setRequestHeader('x-upsert', 'true')
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) setAddProgress(Math.round((evt.loaded / evt.total) * 100))
          }
          xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`))
          xhr.onerror = () => reject(new Error('Network error'))
          xhr.send(addFile)
        })

        const { data: pub } = supabase.storage.from('portfolio').getPublicUrl(path)
        file_path = path
        file_url = pub.publicUrl
      }

      const { data: newItem, error: dbErr } = await supabase
        .from('portfolio_items')
        .insert({
          user_id: userProfile.id,
          label: addLabel.trim(),
          type: addType,
          file_path,
          file_url,
          external_url,
        })
        .select()
        .single()

      if (dbErr) throw new Error(dbErr.message)
      if (newItem) setItems((prev) => [newItem as PortfolioItem, ...prev])
      resetAddForm()
      setShowAdd(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setAdding(false)
      setAddProgress(null)
    }
  }

  const saveLabel = async (id: string) => {
    if (!editLabelValue.trim()) return
    const { error } = await supabase
      .from('portfolio_items')
      .update({ label: editLabelValue.trim() })
      .eq('id', id)
    if (!error) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, label: editLabelValue.trim() } : i))
    }
    setEditLabelId(null)
  }

  const handleDelete = async (item: PortfolioItem) => {
    if (item.file_path) {
      await supabase.storage.from('portfolio').remove([item.file_path])
    }
    await supabase.from('portfolio_items').delete().eq('id', item.id)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setDeleteId(null)
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter)
  const counts = { image: 0, document: 0, link: 0, video: 0 }
  items.forEach((i) => { counts[i.type]++ })

  const fileAccept: Record<PortfolioItemType, string> = {
    image: 'image/jpeg,image/png,image/webp,image/gif',
    document: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    video: 'video/mp4,video/webm',
    link: '',
  }

  if (loadingAuth || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page-container max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link href="/dashboard/talent" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Portfolio</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage work samples — pick from these when building profiles.</p>
        </div>
        <button onClick={() => { resetAddForm(); setShowAdd(true) }} className="btn-primary flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        {([
          { key: 'all', label: `All (${items.length})` },
          { key: 'image', label: `Images (${counts.image})` },
          { key: 'document', label: `Documents (${counts.document})` },
          { key: 'link', label: `Links (${counts.link})` },
          { key: 'video', label: `Videos (${counts.video})` },
        ] as { key: FilterTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700">
            {filter === 'all' ? 'No portfolio items yet' : `No ${filter}s added yet`}
          </p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Add images, documents, links or videos to showcase your work.</p>
          <button onClick={() => { resetAddForm(); setShowAdd(true) }} className="btn-primary mx-auto">
            Add your first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const meta = TYPE_META[item.type]
            const href = item.file_url ?? item.external_url
            return (
              <div key={item.id} className="card overflow-hidden group flex flex-col">
                {/* Preview area */}
                <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                  {item.type === 'image' && item.file_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.file_url}
                      alt={item.label}
                      className="w-full h-36 object-cover bg-slate-100"
                    />
                  ) : (
                    <div className={`h-36 flex flex-col items-center justify-center border-b ${meta.color}`}>
                      <div className="w-10 h-10 flex items-center justify-center">
                        {meta.icon}
                      </div>
                      {item.type === 'link' && item.external_url && (
                        <p className="text-[10px] mt-1.5 px-3 text-center truncate max-w-full opacity-70">
                          {item.external_url.replace(/^https?:\/\//, '')}
                        </p>
                      )}
                    </div>
                  )}
                </a>

                {/* Footer */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.color} mb-1.5`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                    {editLabelId === item.id ? (
                      <input
                        className="input-base text-xs py-1 px-2 w-full"
                        value={editLabelValue}
                        onChange={(e) => setEditLabelValue(e.target.value)}
                        onBlur={() => saveLabel(item.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(item.id); if (e.key === 'Escape') setEditLabelId(null) }}
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 cursor-text"
                        onClick={() => { setEditLabelId(item.id); setEditLabelValue(item.label) }}
                        title="Click to edit label"
                      >
                        {item.label}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(item.created_at)}</p>
                  </div>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 font-medium mt-2 text-left"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add item modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Add portfolio item</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="label mb-2">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(TYPE_META) as PortfolioItemType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setAddType(t); setAddFile(null); setAddUrl(''); if (fileRef.current) fileRef.current.value = '' }}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                        addType === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {TYPE_META[t].icon}
                      {TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="label">Label *</label>
                <input
                  className="input-base"
                  placeholder={
                    addType === 'image' ? 'e.g. Product screenshots'
                    : addType === 'document' ? 'e.g. Case study PDF'
                    : addType === 'link' ? 'e.g. GitHub profile'
                    : 'e.g. Product demo video'
                  }
                  value={addLabel}
                  onChange={(e) => setAddLabel(e.target.value)}
                />
              </div>

              {/* File or URL */}
              {addType === 'link' || addType === 'video' ? (
                <div>
                  <label className="label">URL *</label>
                  <input
                    type="url"
                    className="input-base"
                    placeholder={addType === 'video' ? 'e.g. https://youtube.com/watch?v=…' : 'https://…'}
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                  />
                  {addType === 'video' && (
                    <p className="text-xs text-slate-400 mt-1">YouTube, Vimeo, Loom, or any video URL</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="label">File *</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={fileAccept[addType]}
                    className="hidden"
                    onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
                  />
                  {addFile ? (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{addFile.name}</p>
                        <p className="text-xs text-slate-400">{(addFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={() => { setAddFile(null); if (fileRef.current) fileRef.current.value = '' }}
                        className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} className="btn-secondary w-full">
                      Choose file
                    </button>
                  )}
                  {addProgress !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Uploading…</span><span>{addProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${addProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {addError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{addError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAdd} disabled={adding} className="btn-primary flex-1">
                  {adding ? 'Saving…' : 'Add item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-slate-900 mb-2">Remove item?</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              This will permanently delete the item and its file. Any profiles using it will lose the reference.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => { const item = items.find((i) => i.id === deleteId); if (item) handleDelete(item) }}
                className="flex-1 btn-primary bg-red-600 hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
