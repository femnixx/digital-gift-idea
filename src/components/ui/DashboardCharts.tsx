'use client'

import type { ComponentType, ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { format, parseISO, subDays, startOfDay } from 'date-fns'
import type { DashboardEntry } from '@/hooks/useDashboardData'
import type { EntryType } from '@/types'

export interface Stat {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  color: string
}

const TYPE_COLORS: Record<EntryType, string> = {
  letter: '#f43f5e',
  bouquet: '#f97316',
  polaroid: '#3b82f6',
  scratch_card: '#a855f7',
  open_when: '#ec4899',
  voice_note: '#6366f1',
  coffee_date: '#ea580c',
}

const statColors: Record<string, { bg: string; text: string }> = {
  rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
}

export function typeLabel(type: EntryType): string {
  const labels: Record<EntryType, string> = {
    letter: 'Love Letter',
    bouquet: 'Bouquet',
    polaroid: 'Polaroid',
    scratch_card: 'Scratch Card',
    open_when: 'Open When',
    voice_note: 'Voice Note',
    coffee_date: 'Coffee Date',
  }
  return labels[type] ?? type
}

export function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const Icon = stat.icon
  const colors = statColors[stat.color] ?? statColors.rose
  return (
    <motion.div
      className="bg-white rounded-xl border border-stone-200 px-5 py-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-stone-500 text-xs uppercase tracking-wider truncate">{stat.label}</p>
          <p className="font-semibold text-2xl text-stone-900 mt-1">{stat.value}</p>
        </div>
        <div className={`w-11 h-11 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
      </div>
    </motion.div>
  )
}

const ChartWrapper = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) => (
  <div className="bg-white rounded-xl border border-stone-200 px-5 py-4">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-semibold text-stone-900">{title}</h3>
        {subtitle && <p className="text-stone-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="h-64 w-full">{children}</div>
  </div>
)

interface ProgressChartProps {
  entries: DashboardEntry[]
  days?: number
}

export function EntriesOverTimeChart({ entries, days = 14 }: ProgressChartProps) {
  const buckets: Record<string, number> = {}
  const dayLabels: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(startOfDay(new Date()), i)
    const label = format(d, 'MMM d')
    dayLabels.push(label)
    buckets[label] = 0
  }

  entries.forEach((e) => {
    const created = parseISO(e.created_at)
    const label = format(created, 'MMM d')
    if (buckets[label] !== undefined) buckets[label] += 1
  })

  const data = dayLabels.map((d) => ({ day: d, count: buckets[d] || 0 }))

  return (
    <ChartWrapper title="Entries Created" subtitle="Last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            itemStyle={{ color: '#0f172a' }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#f43f5e"
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 1, fill: '#fff', stroke: '#f43f5e' }}
            activeDot={{ r: 6, strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function ViewsByEntryChart({ entries }: ProgressChartProps) {
  const byViews = [...entries]
    .filter((e) => (e.view_count || 0) > 0)
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))

  const data = byViews.map((e) => ({
    name: e.title.length > 16 ? e.title.slice(0, 16) + '…' : e.title,
    views: e.view_count || 0,
  }))

  if (data.length === 0) {
    return (
      <ChartWrapper title="Views by Entry" subtitle="Entries with views shown">
        <div className="h-full flex items-center justify-center text-stone-400 text-sm">
          No views recorded yet.
        </div>
      </ChartWrapper>
    )
  }

  return (
    <ChartWrapper title="Views by Entry" subtitle="Sorted by most viewed">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 8, left: -10, bottom: 0 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            width={140}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            itemStyle={{ color: '#0f172a' }}
            cursor={{ fill: '#f1f5f9' }}
          />
          <Bar dataKey="views" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function EntriesByTypeChart({ entries }: ProgressChartProps) {
  const counts: Record<string, number> = {}
  entries.forEach((e) => {
    counts[e.type] = (counts[e.type] || 0) + 1
  })

  const data = Object.entries(counts).map(([type, count]) => ({
    type: typeLabel(type as EntryType),
    count,
    color: TYPE_COLORS[type as EntryType],
  }))

  if (data.length === 0) {
    return (
      <ChartWrapper title="Entries by Type">
        <div className="h-full flex items-center justify-center text-stone-400 text-sm">
          No entries yet.
        </div>
      </ChartWrapper>
    )
  }

  return (
    <ChartWrapper title="Entries by Type" subtitle="How you've been expressing love">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            itemStyle={{ color: '#0f172a' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={`cell-${d.type}`} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function PublishedStatusChart({ entries }: ProgressChartProps) {
  const published = entries.filter((e) => e.is_published).length
  const drafts = entries.length - published

  const data = [
    { name: 'Published', value: published, color: '#16a34a' },
    { name: 'Drafts', value: drafts, color: '#f59e0b' },
  ].filter((d) => d.value > 0)

  if (entries.length === 0 || data.length === 0) {
    return (
      <ChartWrapper title="Published vs Drafts">
        <div className="h-full flex items-center justify-center text-stone-400 text-sm">
          No entries to summarize.
        </div>
      </ChartWrapper>
    )
  }

  const total = published + drafts
  const R = 56

  return (
    <ChartWrapper title="Published vs Drafts" subtitle={`${total} total entries`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            itemStyle={{ color: '#0f172a' }}
            formatter={(value, name) => {
              const numValue = Number(value) || 0
              const pct = total > 0 ? Math.round((numValue / total) * 100) : 0
              return [`${numValue} (${pct}%)`, String(name)]
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            innerRadius={R * 0.5}
            outerRadius={R}
            cx={90}
            cy={72}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={`cell-${d.name}`} fill={d.color} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" height={36} iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function EntryTypeIcon({ type }: { type: EntryType }) {
  const icons: Record<EntryType, string> = {
    letter: '💌',
    bouquet: '💐',
    polaroid: '📸',
    scratch_card: '🎫',
    open_when: '💌',
    voice_note: '🎵',
    coffee_date: '☕',
  }
  return <span className="text-lg">{icons[type] || '📄'}</span>
}

export { TYPE_COLORS }
