'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles, ArrowLeft } from 'lucide-react'
import { DigitalBouquet } from '@/components/features/DigitalBouquet'
import type { BouquetFlower, ArrangementType, FlowerType } from '@/types'
import { FLOWER_CONFIG } from '@/types'

const COLORS = ['#FF69B4', '#FF0000', '#FFFFFF', '#FFFF00', '#FFC0CB', '#8B0000', '#FFD700', '#FFA500', '#E6E6FA', '#D8BFD8', '#9370DB', '#BA55D3']

export function BouquetEditor({ entryId, onSave, onCancel }: { entryId: string; onSave?: (flowers: BouquetFlower[]) => void; onCancel?: () => void }) {
  const [flowers, setFlowers] = useState<BouquetFlower[]>([])
  const [selectedType, setSelectedType] = useState<FlowerType>('rose')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [flowerCount, setFlowerCount] = useState(10)
  const [arrangement, setArrangement] = useState<ArrangementType>('circular')
  const [title, setTitle] = useState('')

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

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title for your bouquet')
      return
    }
    if (flowers.length === 0) {
      alert('Please add at least one flower')
      return
    }
    onSave?.(flowers)
  }

  return (
    <div className='min-h-screen bg-cream-50'>
      <div className='max-w-4xl mx-auto px-6 py-12'>
        {onCancel && (
          <button onClick={onCancel} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
        )}

        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <span className='text-3xl'>💐</span>
            <div>
              <h1 className='font-script text-3xl gradient-text'>Digital Bouquet</h1>
              <p className='text-rose-500 text-sm'>Create a beautiful flower arrangement</p>
            </div>
          </div>
        </div>

        {flowers.length === 0 ? (
          <div className='card p-8 text-center mb-8'>
            <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
            <h2 className='font-serif text-xl text-slate-700 mb-2'>Create Your Bouquet</h2>
            <p className='text-slate-500 mb-6'>
              Choose a flower type and color, then add flowers to your arrangement.
              You can arrange them in different patterns and add personal notes.
            </p>

            <div className='space-y-6'>
              <div>
                <label className='label'>Title</label>
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
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-rose-100 hover:border-rose-300'
                      }`}
                    >
                      <div className='text-2xl mb-1'>{config.emoji}</div>
                      <div className='text-xs text-rose-600'>{config.name}</div>
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
                        selectedColor === color ? 'border-rose-500 scale-110' : 'border-rose-100'
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
                <h2 className='font-serif text-xl text-slate-700'>Your Bouquet</h2>
                <p className='text-slate-500 text-sm'>{flowers.length} flowers</p>
              </div>
              <div className='flex gap-3'>
                <button onClick={() => setFlowers([])} className='btn-secondary'>
                  Clear All
                </button>
                <button onClick={handleSave} className='btn-primary'>
                  Save Bouquet
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
