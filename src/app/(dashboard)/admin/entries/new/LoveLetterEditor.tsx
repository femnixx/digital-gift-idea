'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ArrowLeft, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { useNav } from '@/hooks/useNav'
import { db } from '@/lib/storage/localStorageDB'
import { LetterEditor } from '@/components/features/LetterEditor'
import { useLocalEntries } from '@/hooks/useLocalData'
import type { EntryType, Entry as AppEntry } from '@/types'

interface LoveLetterEditorProps {
  initialTitle?: string
  initialSlug?: string
  existingEntry?: AppEntry | null
}

export function LoveLetterEditor({ initialTitle = '', initialSlug = '', existingEntry }: LoveLetterEditorProps) {
  const { push, back } = useNav()
  const { refresh } = useLocalEntries()

  const [title, setTitle] = useState(initialTitle || existingEntry?.title || '')
  const [slug, setSlug] = useState(initialSlug || existingEntry?.slug || '')
  const [isPublished, setIsPublished] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!existingEntry

  const generateSlug = (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSave = (content: { message: string }, extra?: Record<string, any>) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const finalSlug = slug || generateSlug(title || 'love-letter')

      if (isEditing && existingEntry) {
        const lsEntry = db.entries.get(existingEntry.id)
        if (lsEntry) {
          db.entries.update(existingEntry.id, {
            title,
            slug: finalSlug,
            content: { ...lsEntry.content, ...content, ...extra },
            is_published: isPublished,
            updated_at: new Date().toISOString(),
          })
        }
        refresh()
        setSaved(true)
        setTimeout(() => {
          push(`/daily/${finalSlug}`)
        }, 600)
      } else {
        const newEntry = {
          id: Math.random().toString(36).substring(2, 15),
          slug: finalSlug,
          title,
          type: 'letter',
          content: { message: content.message, ...extra },
          publish_at: new Date().toISOString(),
          is_published: isPublished,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        db.entries.insert(newEntry)
        refresh()
        setSaved(true)
        setTimeout(() => {
          push(`/daily/${finalSlug}`)
        }, 600)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save letter. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    back('/admin/entries/new')
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cream-50 to-lavender-50 flex items-center justify-center p-6">
        <motion.div
          className="text-center card p-8 md:p-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="font-script text-3xl gradient-text mb-2">Letter Saved!</h2>
          <p className="text-slate-500">Redirecting to your letter...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cream-50 to-lavender-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-2 text-sky-500 hover:text-sky-600 mb-6 transition-colors"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to types
        </motion.button>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">💌</span>
            <div>
              <h1 className="font-script text-3xl md:text-4xl gradient-text">
                {isEditing ? 'Edit Love Letter' : 'Write a Love Letter'}
              </h1>
              <p className="text-sky-500 text-sm mt-1">
                {isEditing ? 'Make your letter even more special' : 'Pour your heart out with style'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            className="card p-4 sm:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-serif text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-500" />
              Letter Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="My dearest..."
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Slug (URL)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^\w-]+/g, '-'))}
                  placeholder="my-love-letter"
                  className="input font-mono text-sm"
                  required
                />
                <p className="text-slate-400 text-xs mt-1">
                  Your letter will be at: /daily/{slug || 'your-slug'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-sky-50 border border-sky-100">
              <input
                type="checkbox"
                id="published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="published" className="text-sky-700 cursor-pointer">
                <span className="font-medium">Publish immediately</span>
                <p className="text-sm text-sky-500">Your partner will be able to see this right away</p>
              </label>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LetterEditor
              entry={existingEntry || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              mode="edit"
              showActions={isEditing}
            />
          </motion.div>

          {error && (
            <motion.div
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 text-sky-500 py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Saving your letter...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
