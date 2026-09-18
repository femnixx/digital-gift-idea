'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Eye,
  Trash2,
  Heart,
  Mail,
  Flower2,
  Coffee,
  Music,
  Camera,
  Gamepad2,
  MessageSquare,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { saveEntryToStorage } from '@/lib/entryStorage'
import { TYPE_COLORS, EntryTypeIcon } from '@/components/ui/DashboardCharts'
import type { Entry, EntryType } from '@/types'

const ENTRY_TYPES: { type: EntryType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'letter', label: 'Love Letter', icon: MessageSquare },
  { type: 'bouquet', label: 'Digital Bouquet', icon: Flower2 },
  { type: 'coffee_date', label: 'Coffee Date', icon: Coffee },
  { type: 'voice_note', label: 'Voice Note', icon: Music },
  { type: 'polaroid', label: 'Polaroid', icon: Camera },
  { type: 'scratch_card', label: 'Scratch Card', icon: Gamepad2 },
]

function generateSlug(title: string): string {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const timestamp = Date.now().toString(36).slice(-6)
  return `${base}-${timestamp}`
}

export default function NewEntryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [selectedType, setSelectedType] = useState<EntryType | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setLoading(false)
  }

  async function handleCreate() {
    if (!title.trim() || !selectedType) {
      setError('Please enter a title and select a type')
      return
    }
    setCreating(true)
    setError(null)

    const slug = generateSlug(title)
    const entry: Entry = {
      id: `entry-${Date.now()}`,
      slug,
      title: title.trim(),
      type: selectedType,
      content: {},
      publish_at: new Date().toISOString(),
      unlock_at: null,
      unlock_condition: null,
      is_published: false,
      is_featured: false,
      view_count: 0,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { success } = await saveEntryToStorage(entry)
    if (success) {
      showToast('Entry created!')
      setTitle('')
      setSelectedType(null)
      setEntries((prev) => [entry, ...prev])
    } else {
      setError('Failed to create entry')
    }
    setCreating(false)
  }

  async function handleDelete(entryId: string) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await (supabase as any)
          .from('entries')
          .delete()
          .eq('id', entryId)
          .eq('created_by', user.id)

        if (error) {
          // Fall back to localStorage deletion
          removeFromLocal(entryId)
        }
      } else {
        removeFromLocal(entryId)
      }
    } catch {
      removeFromLocal(entryId)
    }
  }

  function removeFromLocal(entryId: string) {
    const raw = localStorage.getItem('digital-love-letters-demo')
    if (raw) {
      const data = JSON.parse(raw)
      data.entries = data.entries.filter((e: Entry) => e.id !== entryId)
      localStorage.setItem('digital-love-letters-demo', JSON.stringify(data))
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
      showToast('Entry deleted')
    }
  }

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    letter: MessageSquare,
    bouquet: Flower2,
    coffee_date: Coffee,
    voice_note: Music,
    polaroid: Camera,
    scratch_card: Gamepad2,
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-script text-3xl md:text-4xl text-sky-700">Create Love Entry</h1>
            <p className="text-stone-600 mt-1">Name your surprise and see your past entries</p>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 space-y-6">
          <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
            New Entry
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Entry Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Our First Anniversary"
              className="input focus:ring-sky-500"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Entry Type
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ENTRY_TYPES.map((type) => {
                const Icon = typeIcons[type.type] || Mail
                const isSelected = selectedType === type.type
                const color = TYPE_COLORS[type.type] || '#0284c7'
                return (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(isSelected ? null : type.type)}
                    className={`group text-left p-5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span style={{ color }}>
                        <Icon className="w-5 h-5 flex-shrink-0" />
                      </span>
                      <span className="text-lg">
                        <EntryTypeIcon type={type.type} />
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-semibold text-stone-800 dark:text-stone-200">
                      {type.label}
                    </h3>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !selectedType}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Entry
              </>
            )}
          </button>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">
            <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
              Your Past Entries
            </h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-stone-100 dark:bg-stone-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                <p className="text-stone-500 dark:text-stone-400">No entries yet</p>
                <p className="text-stone-400 text-sm mt-1">Your created entries will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200 dark:divide-stone-700">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${TYPE_COLORS[entry.type]}15` }}>
                      <span
                        className="text-xl"
                      >
                        <EntryTypeIcon type={entry.type} />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 dark:text-stone-200 truncate">
                        {entry.title}
                      </p>
                      <p className="text-stone-400 dark:text-stone-500 text-sm">
                        {entry.type.replace('_', ' ')} &middot; {entry.slug}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                      style={{
                        backgroundColor: `${TYPE_COLORS[entry.type]}20`,
                        color: TYPE_COLORS[entry.type],
                      }}
                    >
                      {entry.is_published ? 'Published' : 'Draft'}
                    </span>
                    <Link
                      href={`/daily/${entry.slug}`}
                      className="p-2 rounded-lg text-stone-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors flex-shrink-0"
                      aria-label="View entry"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
