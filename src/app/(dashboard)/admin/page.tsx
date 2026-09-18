'use client'

import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import {
  Heart, Plus, Eye, Calendar, TrendingUp, FileText, ChevronRight, Sparkles, CheckCircle2
} from 'lucide-react'
import { format, startOfMonth } from 'date-fns'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DemoDataManager } from '@/components/ui/DemoDataManager'
import { SkeletonStatCard, SkeletonEntryTable } from '@/components/ui/Skeleton'
import { useDashboardData } from '@/hooks/useDashboardData'
import {
  StatCard,
  EntriesOverTimeChart,
  ViewsByEntryChart,
  EntriesByTypeChart,
  PublishedStatusChart,
  EntryTypeIcon,
  type Stat,
  TYPE_COLORS,
} from '@/components/ui/DashboardCharts'

export default function AdminDashboardPage() {
  const { entries, loading, isDemoMode } = useDashboardData()
  const containerRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    if (loading || !containerRef.current) return

    const ctx = gsap.context(() => {}, containerRef.current)
    const elements = (ctx.selector ? ctx.selector('.gsap-section') : []) as Element[]

    if (elements.length) {
      gsap.from(elements, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
      })
    }

    return () => ctx.revert()
  }, [loading, entries])

  const stats: Stat[] = useMemo(
    () => [
      {
        label: 'Total Entries',
        value: loading ? '...' : entries.length,
        icon: Heart,
        color: 'sky',
      },
      {
        label: 'Published',
        value: loading ? '...' : entries.filter((e) => e.is_published).length,
        icon: Eye,
        color: 'green',
      },
      {
        label: 'Drafts',
        value: loading ? '...' : entries.filter((e) => !e.is_published).length,
        icon: FileText,
        color: 'amber',
      },
      {
        label: 'This Month',
        value:
          loading ? '...' : entries.filter((e) => new Date(e.created_at) >= startOfMonth(new Date())).length,
        icon: Calendar,
        color: 'blue',
      },
      {
        label: 'Total Views',
        value: loading ? '...' : entries.reduce((sum, e) => sum + (e.view_count || 0), 0),
        icon: TrendingUp,
        color: 'purple',
      },
    ],
    [entries, loading]
  )

  const recentEntries = entries.slice(0, 10)

  return (
    <AdminLayout>
      <div ref={containerRef} className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-script text-3xl md:text-4xl text-sky-700">Dashboard</h1>
            <p className="text-stone-600 mt-1">Track your progress and manage your surprises</p>
            {isDemoMode && (
              <p className="text-amber-600 text-xs mt-1 font-medium">Demo mode — data lives in your browser</p>
            )}
          </div>
          <button
            onClick={() => showToast('Preparing your new entry...')}
            className="btn-primary w-full sm:w-auto inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create Entry</span>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
            : stats.map((stat, index) => <StatCard key={stat.label} stat={stat} index={index} />)}
        </div>

        <section className="gsap-section">
          <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4">Progress Graphs</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <EntriesOverTimeChart entries={entries} />
            <ViewsByEntryChart entries={entries} />
            <EntriesByTypeChart entries={entries} />
            <PublishedStatusChart entries={entries} />
          </div>
        </section>

        <section className="gsap-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">Recent Entries</h2>
            <Link
              href="/admin/entries"
              className="text-sky-600 text-sm font-medium hover:text-sky-700 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">
                      Entry
                    </th>
                    <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-4 text-right text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12">
                        <SkeletonEntryTable rows={5} cells={6} />
                      </td>
                    </tr>
                  ) : recentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                        No entries yet. Create your first love letter!
                      </td>
                    </tr>
                  ) : (
                    recentEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl w-6 text-center">
                              <EntryTypeIcon type={entry.type} />
                            </span>
                            <div>
                              <p className="font-medium text-stone-800 dark:text-stone-200">{entry.title}</p>
                              <p className="text-stone-400 dark:text-stone-500 text-sm">{entry.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${TYPE_COLORS[entry.type]}20`,
                              color: TYPE_COLORS[entry.type],
                            }}
                          >
                            {entry.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              entry.is_published
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {entry.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-500 dark:text-stone-400">
                          {format(new Date(entry.publish_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-stone-500 dark:text-stone-400 font-mono">{entry.view_count || 0}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/daily/${entry.slug}`}
                              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 transition-colors"
                              aria-label="View entry"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 transition-colors"
                              aria-label="More options"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <DemoDataManager />

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
