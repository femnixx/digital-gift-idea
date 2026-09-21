'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Heart,
  Plus,
  Eye,
  Calendar,
  FileText,
  Image,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { listDiaries } from '@/lib/services/diaryService'
import { createClient } from '@/lib/supabase/client'
import type { LoveDiary } from '@/types'
import { TYPE_COLORS, EntryTypeIcon } from '@/components/ui/DashboardCharts'
import type { EntryType } from '@/types'

export default function AdminDiariesPage() {
  const [diaries, setDiaries] = useState<LoveDiary[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    loadDiaries()
  }, [])

  async function loadDiaries() {
    const data = await listDiaries()
    setDiaries(data)
    setLoading(false)
  }

  const totalEntries = useMemo(
    () => diaries.reduce((sum, d) => sum + d.entry_count, 0),
    [diaries]
  )

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    diaries.forEach((d) => {
      d.entry_ids.forEach((entryId) => {
        counts[entryId] = (counts[entryId] || 0) + 1
      })
    })
    return counts
  }, [diaries])

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-script text-3xl md:text-4xl text-accent">Love Diaries</h1>
            <p className="text-text mt-1">Your collection of love letter diaries</p>
          </div>
          <Link
            href="/admin/diaries/new"
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Diary</span>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Diaries" value={loading ? '...' : diaries.length} icon={Heart} color="sky" />
          <StatCard label="Total Entries" value={loading ? '...' : totalEntries} icon={FileText} color="blue" />
          <StatCard label="Diary Types" value={loading ? '...' : Object.keys(typeCounts).length} icon={Image} color="stone" />
          <StatCard label="Created" value={loading ? '...' : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} icon={Calendar} color="amber" />
        </div>

        <div className="bg-card rounded-xl border-card-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-base-2 border-b border-card-border">
                <tr>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">
                    Diary
                  </th>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">
                    Entries
                  </th>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-muted text-sm font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-base-2 rounded-lg w-full" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : diaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Heart className="w-12 h-12 text-muted" />
                        <div>
                          <p className="text-text font-medium">No diaries yet</p>
                          <p className="text-muted text-sm">Create your first love diary to get started</p>
                        </div>
                        <Link
                          href="/admin/diaries/new"
                          className="btn-primary inline-flex items-center gap-2 mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create Diary
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  diaries.map((diary) => (
                    <tr
                      key={diary.id}
                      className="hover:bg-accent/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-text">{diary.title}</p>
                            <p className="text-muted text-sm">{diary.entry_count} entries</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-base-2 px-2 py-1 rounded font-mono text-text">
                          {diary.id.slice(0, 8)}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          {diary.entry_count} entries
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-muted text-sm max-w-xs truncate">
                          {diary.description || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-muted text-sm">
                        {new Date(diary.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/diaries/${diary.id}`}
                            className="p-2 rounded-lg bg-base-2 border-card-border text-text hover:bg-base transition-colors"
                            aria-label="View diary"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast">
            <div className="btn-primary px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">{toast}</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function StatCard({
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
    sky: 'bg-accent/10 text-accent',
    blue: 'bg-info/10 text-info',
    amber: 'bg-warning/10 text-warning',
    green: 'bg-success/10 text-success',
    purple: 'bg-accent/10 text-accent',
    rose: 'bg-error/10 text-error',
    stone: 'bg-base-2 text-muted',
  }

  return (
    <div className="bg-card rounded-xl border-card-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="text-2xl font-bold text-text mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
