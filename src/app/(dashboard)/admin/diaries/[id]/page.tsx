'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Heart,
  Eye,
  Trash2,
  Calendar,
  FileText,
  Image as ImageIcon,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { loadDiaryById, getDiaryMetrics, getDiaryWithMetrics, removeDiary, attachEntriesToDiary } from '@/lib/services/diaryService'
import { createClient } from '@/lib/supabase/client'
import type { LoveDiary } from '@/types'
import { TYPE_COLORS, EntryTypeIcon } from '@/components/ui/DashboardCharts'
import type { EntryType } from '@/types'

export default function AdminDiaryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const diaryId = params.id as string

  const [diary, setDiary] = useState<LoveDiary | null>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    loadDiary()
  }, [diaryId])

  async function loadDiary() {
    try {
      const data = await loadDiaryById(diaryId)
      if (!data) {
        setError('Diary not found')
        setLoading(false)
        return
      }
      setDiary(data)
      const metricsData = await getDiaryMetrics(diaryId)
      setMetrics(metricsData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const result = await removeDiary(diaryId)
      if (result.success) {
        showToast('Diary deleted successfully')
        setTimeout(() => {
          router.push('/admin/diaries')
        }, 800)
      } else {
        setError(result.error || 'Failed to delete diary')
        setConfirmDelete(false)
      }
    } catch (err: any) {
      setError(err.message)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    letter: MessageSquare,
    bouquet: ImageIcon,
    polaroid: ImageIcon,
    scratch_card: Sparkles,
    open_when: MessageSquare,
    voice_note: ImageIcon,
    coffee_date: ImageIcon,
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700">
              <ArrowLeft className="w-5 h-5 text-stone-400" />
            </div>
            <div className="h-10 w-64 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse" />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 p-6">
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-24 animate-pulse" />
                <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded w-16 mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Link href="/admin/diaries" className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <h1 className="font-script text-3xl md:text-4xl text-sky-700">Diary Not Found</h1>
          </div>
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 p-8 text-center">
            <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 dark:text-stone-400">{error}</p>
            <Link href="/admin/diaries" className="btn-primary inline-flex items-center gap-2 mt-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Diaries
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!diary) return null

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/diaries"
            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-script text-3xl md:text-4xl text-sky-700">{diary.title}</h1>
            <p className="text-stone-600 mt-1">ID: {diary.id}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Entries" value={metrics?.entry_count ?? diary.entry_count} icon={FileText} color="sky" />
          <MetricCard label="Total Views" value={metrics?.total_views ?? 0} icon={TrendingUp} color="blue" />
          <MetricCard label="Published" value={metrics?.published_count ?? 0} icon={CheckCircle2} color="green" />
          <MetricCard label="Drafts" value={metrics?.draft_count ?? 0} icon={AlertTriangle} color="amber" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 space-y-6">
              <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
                Description
              </h2>
              <p className="text-stone-600 dark:text-stone-400">
                {diary.description || 'No description provided'}
              </p>
            </div>

            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
                  Entries in this Diary
                </h2>
                <span className="text-sm text-stone-500">{diary.entry_count} items</span>
              </div>

              {diary.entry_count === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                  <p className="text-stone-500">No entries yet</p>
                  <Link href="/admin/entries/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                    <Sparkles className="w-4 h-4" />
                    Add Entry
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {(Object.entries(metrics?.type_breakdown || {}) as [string, number][]).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center gap-4 p-4 rounded-lg bg-stone-50 dark:bg-stone-900/50"
                    >
                      <span className="text-xl w-6 text-center">
                        <EntryTypeIcon type={type as EntryType} />
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-stone-800 dark:text-stone-200">
                          {type.replace('_', ' ')}
                        </p>
                      </div>
                      <span
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: `${TYPE_COLORS[type as EntryType]}20`,
                          color: TYPE_COLORS[type as EntryType],
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 space-y-6">
              <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
                Diary Info
              </h2>
              <div className="space-y-3">
                <InfoRow label="ID" value={diary.id} mono />
                <InfoRow
                  label="Created"
                  value={new Date(diary.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
                <InfoRow
                  label="Last Updated"
                  value={new Date(diary.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
                <InfoRow label="Entries" value={String(diary.entry_count)} />
              </div>
            </div>

            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 space-y-4">
              <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
                Actions
              </h2>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full p-3 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Diary
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                        Are you sure?
                      </p>
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                        This will permanently delete &quot;{diary.title}&quot;. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="flex-1 p-3 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 p-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800 p-6">
              <h3 className="font-medium text-sky-800 dark:text-sky-200 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Add Entries to This Diary
              </h3>
              <p className="text-sm text-stone-500 mt-2">
                Link existing entries to this diary to organize your gifts
              </p>
              <button
                onClick={async () => {
                  try {
                    const supabase = createClient()
                    const { data: { user } } = await supabase.auth.getUser()
                    const result = await attachEntriesToDiary(diaryId, [])
                    if (result.success) {
                      showToast('Entries updated')
                    }
                  } catch {}
                }}
                className="btn-primary inline-flex items-center gap-2 mt-4 w-full justify-center"
              >
                <Sparkles className="w-4 h-4" />
                Manage Entries
              </button>
            </div>
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

function MetricCard({
  label,
  value,
  icon: Icon,
  color = 'sky',
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color?: 'sky' | 'blue' | 'amber' | 'green' | 'purple' | 'rose' | 'stone'
}) {
  const colorMap = {
    sky: 'bg-sky-100 text-sky-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    rose: 'bg-rose-100 text-rose-600',
    stone: 'bg-stone-100 text-stone-600',
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</p>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-200 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-500 dark:text-stone-400">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono' : ''} text-stone-800 dark:text-stone-200`}>
        {value}
      </span>
    </div>
  )
}
