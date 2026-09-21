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
              className="p-2 rounded-lg bg-base-2 border-card-border text-text hover:bg-base transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-script text-3xl md:text-4xl text-accent">All Entries</h1>
              <p className="text-text mt-1">Manage your gifts and surprises</p>
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

        <div className="bg-card rounded-xl border-card-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-base-2 border-b border-card-border">
                <tr>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">Entry</th>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">Published</th>
                  <th className="px-6 py-4 text-left text-muted text-sm font-medium uppercase tracking-wider">Views</th>
                  <th className="px-6 py-4 text-right text-muted text-sm font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <SkeletonEntryTable rows={6} cells={6} />
                    </td>
                  </tr>
                ) : formattedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted">
                      No entries yet. Create your first love letter!
                    </td>
                  </tr>
                ) : (
                  formattedEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-base-2 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl w-6 text-center">
                            <EntryTypeIcon type={entry.type} />
                          </span>
                          <div>
                            <p className="font-medium text-text">{entry.title}</p>
                            <p className="text-muted text-sm">{entry.slug}</p>
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
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning'
                          }`}
                        >
                          {entry.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted">{entry.formattedDate}</td>
                      <td className="px-6 py-4 text-muted font-mono">{entry.view_count || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/daily/${entry.slug}`}
                              className="p-2 rounded-lg bg-base-2 border-card-border text-text hover:bg-base transition-colors"
                              aria-label="View entry"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => { setEditingId(entry.id); router.push(`/admin/entries/new?edit=${entry.id}`) }}
                              className="p-2 rounded-lg bg-base-2 border-card-border text-accent hover:bg-base transition-colors"
                              aria-label="Edit entry"
                            >
                              {editingId === entry.id ? (
                                <span className="block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
                              className="p-2 rounded-lg bg-base-2 border-card-border text-accent hover:bg-base transition-colors disabled:opacity-50"
                              aria-label="Delete entry"
                            >
                              {deleting === entry.id ? (
                                <span className="block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
          <div className="btn-primary px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
