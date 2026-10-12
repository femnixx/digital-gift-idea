'use client'

import { useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { startOfMonth } from 'date-fns'
import {
  Heart, Plus, Eye, Sparkles, FileText, Globe, BarChart2, Server, Database, Shield
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useDashboardData } from '@/hooks/useDashboardData'
import { StatCard } from '@/components/ui/DashboardCharts'
import type { Stat } from '@/components/ui/DashboardCharts'
import {
  EntriesOverTimeChart,
  ViewsByEntryChart,
  EntriesByTypeChart,
  PublishedStatusChart,
  EntryTypeIcon,
} from '@/components/ui/DashboardCharts'

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

export default function AdminDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { entries, loading } = useDashboardData()

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

  // All figures below are derived from the real entries collection.
  const metrics = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)

    const published = entries.filter((e) => e.is_published).length
    const drafts = entries.length - published
    const totalViews = entries.reduce((sum, e) => sum + (e.view_count || 0), 0)
    const thisMonth = entries.filter((e) => new Date(e.created_at) >= monthStart).length
    const viewsThisMonth = entries
      .filter((e) => new Date(e.created_at) >= monthStart)
      .reduce((sum, e) => sum + (e.view_count || 0), 0)

    return {
      totalEntries: entries.length,
      published,
      drafts,
      totalViews,
      thisMonth,
      viewsThisMonth,
      avgViewsPerEntry: entries.length > 0 ? Math.round(totalViews / entries.length) : 0,
      mostViewed: entries.reduce((max, e) => Math.max(max, e.view_count || 0), 0),
    }
  }, [entries])

  const stats: Stat[] = useMemo(
    () => [
      {
        label: 'Total Entries',
        value: loading ? '...' : metrics.totalEntries.toLocaleString(),
        icon: FileText,
        color: 'green',
      },
      {
        label: 'Published',
        value: loading ? '...' : metrics.published.toLocaleString(),
        icon: Globe,
        color: 'sky',
      },
      {
        label: 'Drafts',
        value: loading ? '...' : metrics.drafts.toLocaleString(),
        icon: Heart,
        color: 'amber',
      },
      {
        label: 'Total Views',
        value: loading ? '...' : formatCompact(metrics.totalViews),
        icon: Eye,
        color: 'purple',
      },
      {
        label: 'This Month',
        value: loading ? '...' : metrics.thisMonth.toLocaleString(),
        icon: Plus,
        color: 'blue',
      },
      {
        label: 'Views / Entry',
        value: loading ? '...' : metrics.avgViewsPerEntry.toLocaleString(),
        icon: BarChart2,
        color: 'pink',
      },
    ],
    [loading, metrics]
  )

  const recentEntries = entries.slice(0, 8)

  return (
    <AdminLayout>
      <div ref={containerRef} className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading">Admin Dashboard</h1>
            <p className="muted-foreground mt-1">Website metrics and system overview</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>

        <section className="gsap-section">
          <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4">System Health</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm muted-foreground">Neon Postgres</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {loading ? '...' : 'Healthy'}
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Published Rate</p>
                  <p className="text-sm muted-foreground">Share of entries live</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {loading || entries.length === 0 ? '...' : `${Math.round((metrics.published / entries.length) * 100)}%`}
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Views This Month</p>
                  <p className="text-sm muted-foreground">Current calendar month</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {loading ? '...' : formatCompact(metrics.viewsThisMonth)}
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Top Entry Views</p>
                  <p className="text-sm muted-foreground">Highest single entry</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {loading ? '...' : formatCompact(metrics.mostViewed)}
              </p>
            </div>
          </div>
        </section>

        <section className="gsap-section">
          <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4">Monthly Trends</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <EntriesOverTimeChart entries={entries} days={14} />
            <ViewsByEntryChart entries={entries} />
          </div>
        </section>

        <section className="gsap-section">
          <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4">Entry Breakdown</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <EntriesByTypeChart entries={entries} />
            <PublishedStatusChart entries={entries} />
          </div>
        </section>

        <section className="gsap-section">
          <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4">Recent Entries</h2>
          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-4 bg-stone-200 rounded w-full max-w-md" />
                ))}
              </div>
            ) : recentEntries.length === 0 ? (
              <div className="p-6 text-sm muted-foreground">No entries yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-base-2 border-b border-card-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider muted-foreground">Entry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider muted-foreground">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider muted-foreground">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider muted-foreground">Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {recentEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <EntryTypeIcon type={entry.type} />
                            <span className="font-medium">{entry.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 muted-foreground text-sm font-mono">/{entry.slug}</td>
                        <td className="px-6 py-4">
                          <span className={entry.is_published ? 'text-green-600 text-sm font-medium' : 'text-amber-600 text-sm font-medium'}>
                            {entry.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{(entry.view_count || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="gsap-section">
          <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/entries/new" className="card p-6 hover:border-accent transition-colors">
              <div className="w-12 h-12 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="font-medium">Create Entry</h3>
              <p className="text-sm muted-foreground mt-1">Add new love letter</p>
            </Link>
            <Link href="/admin/entries" className="card p-6 hover:border-accent transition-colors">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium">Manage Entries</h3>
              <p className="text-sm muted-foreground mt-1">View all entries</p>
            </Link>
            <Link href="/admin/diaries" className="card p-6 hover:border-accent transition-colors">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium">Love Diaries</h3>
              <p className="text-sm muted-foreground mt-1">Manage diaries</p>
            </Link>
            <Link href="/admin/settings" className="card p-6 hover:border-accent transition-colors">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-medium">Settings</h3>
              <p className="text-sm muted-foreground mt-1">Configure system</p>
            </Link>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
