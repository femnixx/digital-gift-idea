'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Share2, Copy, Check, Send } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { Scrapbook } from '@/components/features/Scrapbook'
import type { Entry, ScrapbookPage, Media } from '@/types'

interface ScrapbookPageProps {
  params: { slug: string }
  searchParams: { token?: string }
}

export default function ScrapbookEditorPage({ params, searchParams }: ScrapbookPageProps) {
  const { slug } = params
  const { token } = searchParams
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scrapbookPages, setScrapbookPages] = useState<ScrapbookPage[]>([])
  const [mediaItems, setMediaItems] = useState<Media[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const entryUrl = `/api/entries/${encodeURIComponent(slug)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
        const res = await fetch(entryUrl, { redirect: 'manual' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load')
        setEntry(data.entry)
        setScrapbookPages(data.entry.scrapbook_pages || [])
        setMediaItems(data.entry.media || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, token])

  const handlePublish = async () => {
    if (!token) return
    setPublishing(true)
    try {
      const url = `/api/entries/${encodeURIComponent(entry?.id || slug)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Publish failed')
      const data = await res.json()
      setEntry(data.entry)
      setPublished(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  const handleCopyUrl = async () => {
    const publicUrl = `${window.location.origin}/daily/${slug}`
    await navigator.clipboard.writeText(publicUrl)
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 2000)
  }

  if (loading) {
    return (
      <PublicShell>
        <div className="container-wide py-8 lg:py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-base-2 rounded w-3/4" />
            <div className="h-4 bg-base-2 rounded w-1/2" />
            <div className="h-96 bg-base-2 rounded" />
          </div>
        </div>
      </PublicShell>
    )
  }

  if (error) {
    return (
      <PublicShell>
        <div className="container-wide py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </PublicShell>
    )
  }

  if (!entry) return null

  return (
    <PublicShell>
      <div className="container-wide py-8 lg:py-12">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
           <motion.header
             className="mb-8 text-center"
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
           >
             <h1 className="heading">{entry.title || 'Memory Scrapbook'}</h1>
             <p className="muted-foreground mt-1">
               Arrange your photos, add captions, and decorate your story
             </p>
           </motion.header>

           {token && (
             <div className="mb-6 flex justify-center gap-3">
               <button
                 onClick={() => setPreviewMode(!previewMode)}
                 className="btn btn-ghost flex items-center gap-2"
               >
                 <Eye className="w-4 h-4" />
                 {previewMode ? 'Back to Edit' : 'Preview'}
               </button>
               <button
                 onClick={handlePublish}
                 disabled={publishing || entry.is_published}
                 className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
               >
                 {publishing ? (
                   <>
                     <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                     Publishing…
                   </>
                 ) : entry.is_published ? (
                   <>
                     <Check className="w-4 h-4" />
                     Published
                   </>
                 ) : (
                   <>
                     <Send className="w-4 h-4" />
                     Publish
                   </>
                 )}
               </button>
             </div>
           )}

           <AnimatePresence>
             {published && (
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center"
               >
                 <p className="text-green-800 dark:text-green-300 font-medium mb-2">Your scrapbook is published and ready to share!</p>
                 <div className="flex items-center justify-center gap-2">
                   <code className="text-sm bg-surface px-3 py-1 rounded border border-line">
                     /daily/{slug}
                   </code>
                   <button
                     onClick={handleCopyUrl}
                     className="p-1.5 rounded-lg bg-surface border border-line hover:bg-surface-2 transition-colors"
                     aria-label="Copy link"
                   >
                     {urlCopied ? (
                       <Check className="w-4 h-4 text-green-600" />
                     ) : (
                       <Copy className="w-4 h-4 text-body" />
                     )}
                   </button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="card card-lg">
             <div className="p-4 sm:p-6">
               <Scrapbook
                 pages={scrapbookPages}
                 media={mediaItems}
                 entryId={entry.id}
                 isEditing={!!token && !previewMode}
                 onSave={(updated) => {
                   setScrapbookPages(updated)
                   setEntry({ ...entry, scrapbook_pages: updated })
                 }}
                 onMediaChange={(updated) => setMediaItems(updated)}
               />
             </div>
           </div>
        </motion.div>
      </div>
    </PublicShell>
  )
}
