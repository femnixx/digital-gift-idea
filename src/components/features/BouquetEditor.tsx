'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles, ArrowLeft } from 'lucide-react'
import { bouquetApi, type BouquetFlowerPayload } from '@/lib/api/bouquetApi'
import { DigitalBouquet } from '@/components/features/DigitalBouquet'
import type { BouquetFlower, ArrangementType, FlowerType } from '@/types'
import { FLOWER_CONFIG } from '@/types'

const COLORS = ['#FF69B4', '#0284c7', '#FFFFFF', '#FFFF00', '#FFC0CB', '#8B0000', '#FFD700', '#FFA500', '#E6E6FA', '#D8BFD8', '#9370DB', '#BA55D3']

export function BouquetEditor({
  entryId,
  onSave,
  onCancel,
  token,
}: {
  entryId: string
  onSave?: (flowers: BouquetFlower[]) => void
  onCancel?: () => void
  /** Edit token proving this visitor created the entry. */
  token?: string
}) {
  const [flowers, setFlowers] = useState<BouquetFlower[]>([])
  const [selectedType, setSelectedType] = useState<FlowerType>('rose')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [flowerCount, setFlowerCount] = useState(10)
  const [arrangement, setArrangement] = useState<ArrangementType>('circular')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  // Load any arrangement already saved for this entry, so revisiting the editor
  // shows what was built rather than an empty canvas.
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const existing = await bouquetApi.list(entryId, token)
        if (!cancelled && existing.length > 0) {
          setFlowers(existing)
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Could not load your bouquet')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [entryId, token])

  const handleAddFlower = () => {
    const newFlower: BouquetFlower = {
      id: `flower-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      entry_id: entryId,
      flower_type: selectedType,
      color: selectedColor,
      note: null,
      position_x: 50,
      position_y: 50,
      rotation: Math.random() * 20 - 10,
      scale: 0.8 + Math.random() * 0.4,
      sort_order: flowers.length,
      created_at: new Date().toISOString(),
      generation_seed: Math.floor(Math.random() * 1000000),
    }
    setFlowers([...flowers, newFlower])
  }

  const handleRemoveFlower = (id: string) => {
    setFlowers(flowers.filter(f => f.id !== id))
  }

  const handleUpdateFlower = (id: string, updates: Partial<BouquetFlower>) => {
    setFlowers(flowers.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const handleReplaceFlowers = (newFlowers: BouquetFlower[]) => {
    setFlowers(newFlowers)
  }

  const handleSave = async () => {
    // A bouquet does not need its own name: the entry already has a UUID and a
    // public slug from when it was created, and those are what identify it. The
    // title below is a nice-to-have label, so it is optional rather than a
    // blocker that leaves the bouquet unsavable.
    if (flowers.length === 0) {
      alert('Please add at least one flower')
      return
    }

    if (!token) {
      alert('Missing edit token, so this bouquet cannot be saved.')
      return
    }

    setSaving(true)
    try {
      await bouquetApi.replace(entryId, token, flowers)
      onSave?.(flowers)
    } catch (err: any) {
      alert(err.message || 'Could not save your bouquet')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='min-h-screen bg-base'>
      <div className='max-w-4xl mx-auto px-6 py-12'>
        {onCancel && (
          <button onClick={onCancel} className='inline-flex items-center gap-2 text-brand hover:opacity-80 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
        )}

        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <span className='text-3xl'>💐</span>
            <div>
              <h1 className='font-script text-3xl gradient-text'>Digital Bouquet</h1>
              <p className='text-body-muted text-sm'>Create a beautiful flower arrangement</p>
            </div>
          </div>
        </div>

        {loadError ? (
          <p role='alert' className='text-sm text-red-600 mb-6'>{loadError}</p>
        ) : null}

        {loading ? (
          <div className='card p-8 text-center text-body-muted'>Loading your bouquet…</div>
        ) : flowers.length === 0 ? (
          <div className='card p-8 text-center mb-8'>
            <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
            <h2 className='font-serif text-xl text-body mb-2'>Create Your Bouquet</h2>
            <p className='text-body-muted mb-6'>
              Choose a flower type and color, then add flowers to your arrangement.
              You can arrange them in different patterns and add personal notes.
            </p>

            <div className='space-y-6'>
              <div>
                <label className='label'>
                  Label <span className='muted-foreground font-normal'>(optional)</span>
                </label>
                <input
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='My Love Bouquet'
                  className='input'
                />
              </div>

              <div>
                <label className='label'>Flower Type</label>
                <div className='grid grid-cols-4 sm:grid-cols-8 gap-2'>
                  {Object.entries(FLOWER_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key as FlowerType)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedType === key
                          ? 'border-brand bg-brand/10'
                          : 'border-line hover:border-brand/50'
                      }`}
                    >
                      <div className='text-2xl mb-1'>{config.emoji}</div>
                      <div className='text-xs text-body-muted'>{config.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className='label'>Color</label>
                <div className='flex flex-wrap gap-2'>
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-brand scale-110' : 'border-line'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='label'>Count</label>
                  <input
                    type='number'
                    min={1}
                    max={20}
                    value={flowerCount}
                    onChange={(e) => setFlowerCount(Number(e.target.value))}
                    className='input'
                  />
                </div>
                <div>
                  <label className='label'>Arrangement</label>
                  <select
                    value={arrangement}
                    onChange={(e) => setArrangement(e.target.value as ArrangementType)}
                    className='input'
                  >
                    <option value='random'>Random</option>
                    <option value='circular'>Circular</option>
                    <option value='vase'>Vase</option>
                    <option value='heart'>Heart</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddFlower}
                className='btn-primary w-full flex items-center justify-center gap-2'
              >
                <Sparkles className='w-5 h-5' />
                Add {flowerCount} {flowerCount === 1 ? 'Flower' : 'Flowers'}
              </button>
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='font-serif text-xl text-body'>Your Bouquet</h2>
                <p className='text-body-muted text-sm'>{flowers.length} flowers</p>
              </div>
              <div className='flex gap-3'>
                <button onClick={() => setFlowers([])} className='btn-secondary'>
                  Clear All
                </button>
                <button onClick={handleSave} className='btn-primary' disabled={saving}>
                  {saving ? 'Saving…' : 'Save Bouquet'}
                </button>
              </div>
            </div>

            <DigitalBouquet
              flowers={flowers}
              isEditing={true}
              onAddFlower={handleAddFlower}
              onRemoveFlower={handleRemoveFlower}
              onUpdateFlower={handleUpdateFlower}
              onReplaceFlowers={handleReplaceFlowers}
              entryId={entryId}
              flowerCount={flowerCount}
              arrangement={arrangement}
            />
          </div>
        )}
      </div>
    </div>
  )
}
