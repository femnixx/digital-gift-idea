'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Eye, Calendar, TrendingUp, Edit, Trash2, ChevronLeft, Sparkles, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useDashboardData } from '@/hooks/useDashboardData'
import { TYPE_COLORS, EntryTypeIcon } from '@/components/ui/DashboardCharts'
import type { EntryType } from '@/types'

const typeIcons: Record<EntryType, React.ComponentType<{ className?: string }>> = {
  letter: FileText,
  bouquet: Sparkles,
  polaroid: FileText,
  scratch_card: Sparkles,
  open_when: FileText,
  voice_note: FileText,
  coffee_date: FileText,
}

export default function AdminEntriesPage() {
  const { entries, loading, isDemoMode } = useDashboardData()

  const formattedEntries = useMemo(() => {
    return entries.map((entry) => ({
      ...entry,
      formattedDate: format(new Date(entry.publish_at), 'MMM d, yyyy'),
      typeColor: TYPE_COLORS[entry.type as EntryType] || '#881337',
    }))
  }, [entries])

  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-script text-3xl md:text-4xl gradient-text">All Entries</h1>
              <p className="text-rose-500 mt-1">Manage your gifts and surprises</p>
              {isDemoMode && (
                <p className="text-amber-600 text-xs mt-1 font-medium">Demo mode — data lives in your browser</p>
              )}
            </div>
          </div>
          <Link
            href="/admin/entries/new"
            className="btn-primary group w-full sm:w-auto inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create Entry</span>
          </Link>
        </motion.div>

        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-rose-100">
                <tr>
                  <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">Entry</th>
                  <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">Published</th>
                  <th className="px-6 py-4 text-left text-rose-500 text-sm font-medium uppercase tracking-wider">Views</th>
                  <th className="px-6 py-4 text-right text-rose-500 text-sm font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-rose-400">
                      Loading your surprises...
                    </td>
                  </tr>
                ) : formattedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-rose-500">
                      No entries yet. Create your first love letter!
                    </td>
                  </tr>
                ) : (
                  formattedEntries.map((entry, index) => (
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
                            <EntryTypeIcon type={entry.type as EntryType} />
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
                          style={{ backgroundColor: `${entry.typeColor}20`, color: entry.typeColor }}
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
                      <td className="px-6 py-4 text-rose-600">{entry.formattedDate}</td>
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
                            aria-label="Edit entry"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-red-500 transition-colors"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>
    </AdminLayout>
  )
}
