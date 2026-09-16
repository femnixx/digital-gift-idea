'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, Plus, Calendar, Flower2, Camera, Gamepad2, Mail, Music, Coffee, TrendingUp, Eye, Edit, MoreVertical, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { EntryType } from '@/types'
import { DemoDataManager } from '@/components/ui/DemoDataManager'

const typeIcons: Record<EntryType, React.ComponentType<{ className?: string }>> = {
  letter: Mail,
  bouquet: Flower2,
  polaroid: Camera,
  scratch_card: Gamepad2,
  open_when: Mail,
  voice_note: Music,
  coffee_date: Coffee,
}

const typeColors: Record<EntryType, string> = {
  letter: 'rose',
  bouquet: 'amber',
  polaroid: 'blue',
  scratch_card: 'purple',
  open_when: 'pink',
  voice_note: 'indigo',
  coffee_date: 'orange',
}

export default function AdminDashboardPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isDemoMode = !(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
    )

    if (isDemoMode) {
      try {
        const storage = localStorage.getItem('digital-love-letters-demo')
        if (storage) {
          const data = JSON.parse(storage)
          setEntries(data.entries || [])
        }
      } catch {}
      setLoading(false)
    }
  }, [])

  const stats = [
    { label: 'Total Entries', value: loading ? '...' : String(entries.length), icon: Heart, color: 'rose' },
    { label: 'Published', value: loading ? '...' : String(entries.filter((e: any) => e.is_published).length), icon: Eye, color: 'green' },
    { label: 'This Month', value: '6', icon: Calendar, color: 'blue' },
    { label: 'Total Views', value: loading ? '...' : String(entries.reduce((sum: number, e: any) => sum + (e.view_count || 0), 0)), icon: TrendingUp, color: 'purple' },
  ]

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
            <p className="text-rose-500 mt-1">Manage your love letters and surprises</p>
          </div>
          <Link href="/admin/entries/new" className="btn-primary group w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span>Create Entry</span>
          </Link>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {stats.map((stat, index) => (
            <motion.div key={stat.label} className="card p-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-500 text-sm uppercase tracking-wider">{stat.label}</p>
                  <p className="font-serif text-3xl font-bold text-rose-900 mt-1">{stat.value}</p>
                </div>
                <div className={w-12 h-12 rounded-xl bg--100 flex items-center justify-center}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-semibold text-rose-900">Recent Entries</h2>
            <Link href="/admin/entries" className="text-rose-500 text-sm font-medium hover:text-rose-600 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card overflow-hidden">
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
                  {entries.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-rose-500">No entries yet. Create your first love letter! ??</td></tr>
                  ) : (
                    entries.slice(0, 10).map((entry: any, index: number) => (
                      <motion.tr key={entry.id} className="hover:bg-rose-50/50 transition-colors" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-rose-900">{entry.title}</p>
                            <p className="text-rose-400 text-sm">{entry.slug}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg--100 text--700}>
                            {typeIcons[entry.type as EntryType] && <typeIcons[entry.type as EntryType] className="w-3 h-3" />}
                            {entry.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium }>
                            {entry.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-rose-600">{format(new Date(entry.publish_at), 'MMM d, yyyy')}</td>
                        <td className="px-6 py-4 text-rose-600 font-mono">{entry.view_count}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={/daily/} className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors" aria-label="View entry"><Eye className="w-4 h-4" /></Link>
                            <button className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors" aria-label="More options"><MoreVertical className="w-4 h-4" /></button>
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