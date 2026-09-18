'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Eye, Edit3, Trash2, ChevronLeft, Sparkles, FileText, CheckCircle2 } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { SkeletonEntryTable } from '@/components/ui/Skeleton'
import { useDashboardData } from '@/hooks/useDashboardData'
import { TYPE_COLORS, EntryTypeIcon } from '@/components/ui/DashboardCharts'
import { createClient } from '@/lib/supabase/client'
import type { EntryType } from '@/types'

export default function AdminEntriesPage() {
  const router = useRouter()
  const { entries, loading } = useDashboardData()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  const formattedEntries = useMemo(() => {
    return entries.map((entry) => ({
      ...entry,
      formattedDate: new Date(entry.publish_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      typeColor: TYPE_COLORS[entry.type as EntryType] || '#0284c7',
    }))
  }, [entries])

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-script text-3xl md:text-4xl text-sky-700">All Entries</h1>
              <p className="text-stone-600 dark:text-stone-400 mt-1">Manage your gifts and surprises</p>
            </div>
          </div>
          <Link
            href="/admin/entries/new"
            className="btn-primary w-full sm:w-auto inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create Entry</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">Entry</th>
                  <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">Published</th>
                  <th className="px-6 py-4 text-left text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">Views</th>
                  <th className="px-6 py-4 text-right text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <SkeletonEntryTable rows={6} cells={6} />
                    </td>
                  </tr>
                ) : formattedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                      No entries yet. Create your first love letter!
                    </td>
                  </tr>
                ) : (
                  formattedEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
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
                          style={{ backgroundColor: `${entry.typeColor}20`, color: entry.typeColor }}
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
                      <td className="px-6 py-4 text-stone-500 dark:text-stone-400">{entry.formattedDate}</td>
                      <td className="px-6 py-4 text-stone-500 dark:text-stone-400 font-mono">{entry.view_count || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/daily/${entry.slug}`}
                            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                            aria-label="View entry"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => { setEditingId(entry.id); router.push(`/admin/entries/new?edit=${entry.id}`) }}
                            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-sky-600 hover:bg-sky-200 dark:hover:bg-sky-900/40 hover:text-sky-700 transition-colors"
                            aria-label="Edit entry"
                          >
                            {editingId === entry.id ? (
                              <span className="block w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Edit3 className="w-4 h-4" />
                            )}
                          </button>
                           <button
                             type="button"
                             onClick={async () => {
                               if (!confirm('Delete this entry? This cannot be undone.')) return
                               setDeleting(entry.id)
                               try {
                                 const supabase = createClient()
                                 const { data: { user } } = await supabase.auth.getUser()
                                 if (!user) {
                                   showToast('You must be logged in to delete entries')
                                   setDeleting(null)
                                   return
                                 }
                                 const { data: existing } = await supabase
                                   .from('entries')
                                   .select('id')
                                   .eq('id', entry.id)
                                   .eq('created_by', user.id)
                                   .single()

                                 if (!existing) {
                                   showToast('You can only delete your own entries')
                                   setDeleting(null)
                                   return
                                 }
                                 const query = supabase.from('entries').delete() as any
                                 const { error } = await query.eq('id', entry.id)
                                 if (error) throw error
                                 showToast('Entry deleted successfully')
                                 router.refresh()
                               } catch (err) {
                                 console.error('Delete error:', err)
                               } finally {
                                 setDeleting(null)
                               }
                             }}
                             disabled={deleting === entry.id}
                             className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-sky-600 hover:bg-sky-200 dark:hover:bg-sky-900/40 hover:text-red-500 transition-colors disabled:opacity-50"
                             aria-label="Delete entry"
                           >
                            {deleting === entry.id ? (
                              <span className="block w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast">
          <div className="bg-sky-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
