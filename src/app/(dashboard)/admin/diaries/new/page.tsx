'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { createNewDiary } from '@/lib/services/diaryService'
import { createClient } from '@/lib/supabase/client'
import type { EntryType } from '@/types'
import { TYPE_COLORS, EntryTypeIcon } from '@/components/ui/DashboardCharts'

export default function NewDiaryPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    try {
      const raw = localStorage.getItem('digital-love-letters-demo')
      if (raw) {
        const data = JSON.parse(raw)
        setEntries(data.entries || [])
      }
    } catch {}
    setLoadingEntries(false)
  }

  const toggleEntry = (entryId: string) => {
    setSelectedEntries((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await createClient().auth.getUser()

      const result = await createNewDiary(
        { title, description, entry_ids: selectedEntries },
        user?.id || 'demo-user'
      )

      if ('success' in result && !result.success) {
        setError(result.error)
        setLoading(false)
        return
      }

      showToast('Love diary created successfully!')
      setTimeout(() => {
        router.push('/admin/diaries')
      }, 800)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/diaries"
            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-script text-3xl md:text-4xl text-sky-700">Create Love Diary</h1>
            <p className="text-stone-600 mt-1">Start a new collection of love letters and gifts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 space-y-6">
            <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
              Diary Details
            </h2>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Diary Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Our First Year Together"
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of this diary..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-shadow resize-none"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
                Select Entries
              </h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="text-sky-600 text-sm font-medium hover:text-sky-700 flex items-center gap-1 transition-colors"
              >
                {previewOpen ? 'Hide Preview' : 'Preview'}
                <ChevronRight className={`w-4 h-4 transition-transform ${previewOpen ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {previewOpen && selectedEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-toast">
                {selectedEntries.map((id) => {
                  const entry = entries.find((e) => e.id === id)
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                    >
                      {entry ? entry.title : id.slice(0, 8)}
                    </span>
                  )
                })}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Choose love entries to include in this diary
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {loadingEntries ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-stone-100 dark:bg-stone-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                    <Heart className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                    <p>No entries available</p>
                    <p className="text-sm mt-1">Create entries from the Entries page first</p>
                    <Link
                      href="/admin/entries/new"
                      className="btn-primary inline-flex items-center gap-2 mt-4"
                    >
                      <Sparkles className="w-4 h-4" />
                      Create Entry
                    </Link>
                  </div>
                ) : (
                  entries.map((entry: any) => (
                    <label
                      key={entry.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedEntries.includes(entry.id)
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                          : 'border-stone-200 dark:border-stone-700 hover:border-sky-300 dark:hover:border-sky-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => toggleEntry(entry.id)}
                        className="w-5 h-5 rounded border-stone-300 text-sky-600 focus:ring-sky-500"
                      />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className="text-xl w-6 text-center flex-shrink-0"
                          style={{ color: TYPE_COLORS[entry.type as EntryType] || '#0284c7' }}
                        >
                          <EntryTypeIcon type={entry.type} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-stone-800 dark:text-stone-200 truncate">
                            {entry.title}
                          </p>
                          <p className="text-stone-400 text-sm">{entry.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                          entry.is_published
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
                        }`}
                      >
                        {entry.is_published ? 'Published' : 'Draft'}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 animate-toast">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/diaries')}
              className="px-6 py-3 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Diary
                </>
              )}
            </button>
          </div>
        </form>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast">
            <div className="bg-sky-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">{toast}</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
