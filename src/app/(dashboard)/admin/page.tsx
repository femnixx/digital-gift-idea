'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Plus, Eye, Calendar, TrendingUp, FileText, MoreVertical, ChevronRight } from 'lucide-react'
import { format, startOfMonth } from 'date-fns'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DemoDataManager } from '@/components/ui/DemoDataManager'
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

  const stats: Stat[] = useMemo(
    () => [
      {
        label: 'Total Entries',
        value: loading ? '...' : entries.length,
        icon: Heart,
        color: 'rose',
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
      <div className="space-y-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="font-script text-3xl md:text-4xl gradient-text">Dashboard</h1>
            <p className="text-rose-500 mt-1">Track your progress and manage your surprises</p>
            {isDemoMode && (
              <p className="text-amber-600 text-xs mt-1 font-medium">Demo mode — data lives in your browser</p>
            )}
          </div>
          <Link href="/admin/entries/new" className="btn-primary group w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span>Create Entry</span>
          </Link>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-serif text-xl font-semibold text-rose-900 mb-4">Progress Graphs</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <EntriesOverTimeChart entries={entries} />
            <ViewsByEntryChart entries={entries} />
            <EntriesByTypeChart entries={entries} />
            <PublishedStatusChart entries={entries} />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-rose-900">Recent Entries</h2>
            <Link
              href="/admin/entries"
              className="text-rose-500 text-sm font-medium hover:text-rose-600 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-50 border-b border-rose-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">
                      Entry
                    </th>
                    <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-4 text-right text-rose-500 text-sm font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-rose-400">
                        Loading your surprises...
                      </td>
                    </tr>
                  ) : recentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-rose-500">
                        No entries yet. Create your first love letter!
                      </td>
                    </tr>
                  ) : (
                    recentEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        className="hover:bg-rose-50/50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl w-6 text-center">
                              <EntryTypeIcon type={entry.type} />
                            </span>
                            <div>
                              <p className="font-medium text-rose-900">{entry.title}</p>
                              <p className="text-rose-400 text-sm">{entry.slug}</p>
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
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {entry.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-rose-600">
                          {format(new Date(entry.publish_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-rose-600 font-mono">{entry.view_count || 0}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/daily/${entry.slug}`}
                              className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                              aria-label="View entry"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                              aria-label="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        <DemoDataManager />
      </div>
    </AdminLayout>
  )
}
