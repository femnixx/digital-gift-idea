'use client'

import Link from 'next/link'
import { Mail, Flower2, Camera, Gamepad2, Music, Coffee, Plus } from 'lucide-react'
import { EntryType } from '@/types'

const entryTypes: { type: EntryType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'letter', label: 'Love Letter', icon: Mail },
  { type: 'bouquet', label: 'Bouquet', icon: Flower2 },
  { type: 'polaroid', label: 'Polaroid', icon: Camera },
  { type: 'scratch_card', label: 'Scratch Card', icon: Gamepad2 },
  { type: 'open_when', label: 'Open When', icon: Mail },
  { type: 'voice_note', label: 'Voice Note', icon: Music },
  { type: 'coffee_date', label: 'Coffee Date', icon: Coffee },
]

interface QuickCreateProps {
  showLabel?: boolean
}

export function QuickCreate({ showLabel = true }: QuickCreateProps) {
  return (
    <div className="card border border-base rounded-xl p-4">
      {showLabel && (
        <div className="flex items-center justify-between mb-3">
          <p className="muted-foreground text-xs uppercase tracking-wider font-medium">Quick Create</p>
          <Link
            href="/admin/entries/new"
            className="flex items-center gap-1 text-xs accent font-medium hover:opacity-80 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            All
          </Link>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
        {entryTypes.map((type) => (
          <Link
            key={type.type}
            href={`/admin/entries/new?type=${type.type}`}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-base/50 hover:bg-base transition-colors"
          >
            <type.icon className="w-4 h-4 muted" />
            <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{type.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
