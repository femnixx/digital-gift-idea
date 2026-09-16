'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { EntryType, type Entry } from '@/types'
import { LoveLetterEditor } from './LoveLetterEditor'
import { ScratchCardCustomizer } from '@/components/features/ScratchCardCustomizer'
import { CoffeeDateSelector } from '@/components/features/CoffeeDateSelector'
import { VoiceNoteRecorder } from '@/components/features/VoiceNoteRecorder'
import { BouquetEditor } from '@/components/features/BouquetEditor'

const ENTRY_TYPES: { type: EntryType; label: string; icon: string; description: string }[] = [
  { type: 'letter', label: 'Love Letter', icon: '💌', description: 'A heartfelt message' },
  { type: 'bouquet', label: 'Digital Bouquet', icon: '💐', description: 'Flowers with notes' },
  { type: 'polaroid', label: 'Polaroid Deck', icon: '📸', description: 'Flip-through photos' },
  { type: 'scratch_card', label: 'Scratch Card', icon: '🎫', description: 'Hidden surprise reveal' },
  { type: 'open_when', label: 'Open When Letter', icon: '💌', description: 'Sealed until the right moment' },
  { type: 'voice_note', label: 'Voice Note', icon: '🎵', description: 'Audio cassette message' },
  { type: 'coffee_date', label: 'Coffee Date', icon: '☕', description: 'Virtual treat with gift card' },
]

export default function NewEntryPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<EntryType | null>(null)
  const [showScratchEditor, setShowScratchEditor] = useState(false)
  const [showCoffeeDateEditor, setShowCoffeeDateEditor] = useState(false)
  const [showBouquetEditor, setShowBouquetEditor] = useState(false)

  const handleScratchSave = (card: any) => {
    console.log('Scratch card saved:', card)
    router.push('/admin')
  }

  const handleCoffeeDateSave = (dates: any[]) => {
    console.log('Coffee dates saved:', dates)
    router.push('/admin')
  }

  const handleBouquetSave = (flowers: any[]) => {
    console.log('Bouquet saved:', flowers)
    router.push('/admin')
  }

  if (!selectedType) {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <Link href='/admin' className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to Dashboard
          </Link>
          <div>
            <h1 className='font-script text-4xl gradient-text mb-4'>Create New Entry</h1>
            <p className='text-rose-600 mb-8'>Choose what kind of surprise you want to create</p>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {ENTRY_TYPES.map((type, index) => (
                <button key={type.type} onClick={() => setSelectedType(type.type)} className='card p-6 text-left group hover:border-rose-300'>
                  <div className='text-4xl mb-4'>{type.icon}</div>
                  <h3 className='font-serif text-lg font-semibold text-rose-900 mb-1'>{type.label}</h3>
                  <p className='text-rose-500 text-sm'>{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'scratch_card' && showScratchEditor) {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-2xl mx-auto px-6 py-12'>
          <button onClick={() => setShowScratchEditor(false)} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>🎫</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Scratch Card</h1>
                <p className='text-rose-500 text-sm'>Create a hidden surprise reveal</p>
              </div>
            </div>
          </div>
          <ScratchCardCustomizer
            entryId={'new-entry'}
            onSave={handleScratchSave}
            onCancel={() => setShowScratchEditor(false)}
          />
        </div>
      </div>
    )
  }

  if (selectedType === 'coffee_date' && showCoffeeDateEditor) {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button onClick={() => { setShowCoffeeDateEditor(false); setSelectedType(null); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>☕</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Coffee Date</h1>
                <p className='text-rose-500 text-sm'>Create a virtual coffee date with gift card</p>
              </div>
            </div>
          </div>
          <CoffeeDateSelector
            entryId={'new-entry'}
            onSave={handleCoffeeDateSave}
            onCancel={() => { setShowCoffeeDateEditor(false); setSelectedType(null); }}
            mode="create"
          />
        </div>
      </div>
    )
  }

  if (selectedType === 'letter') {
    return <LoveLetterEditor />
  }

  if (selectedType === 'scratch_card') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-2xl mx-auto px-6 py-12'>
          <button onClick={() => setSelectedType(null)} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='flex items-center gap-3 mb-8'>
            <span className='text-3xl'>🎫</span>
            <div>
              <h1 className='font-script text-3xl gradient-text'>Scratch Card</h1>
              <p className='text-rose-500 text-sm'>Create a hidden surprise reveal</p>
            </div>
          </div>
          <div className='card p-8'>
            <div className='text-center mb-6'>
              <p className='text-slate-600 mb-6'>
                Create a scratch card with a custom cover and hidden surprise inside.
                Your recipient will scratch off the cover to reveal your message or image.
              </p>
              <button onClick={() => setShowScratchEditor(true)} className='btn-primary inline-flex items-center gap-2'>
                <Sparkles className='w-4 h-4' />
                Create Scratch Card
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'coffee_date') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button onClick={() => setSelectedType(null)} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>☕</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Coffee Date</h1>
                <p className='text-rose-500 text-sm'>Create a virtual coffee date with gift card</p>
              </div>
            </div>
          </div>
          <CoffeeDateSelector
            entryId={'new-entry'}
            onSave={handleCoffeeDateSave}
            onCancel={() => setSelectedType(null)}
            mode="create"
          />
        </div>
      </div>
    )
  }

  if (selectedType === 'bouquet') {
    if (showBouquetEditor) {
      return (
        <div className='min-h-screen bg-cream-50'>
          <div className='max-w-4xl mx-auto px-6 py-12'>
            <button onClick={() => setShowBouquetEditor(false)} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
              <ArrowLeft className='w-4 h-4' /> Back to types
            </button>
            <div className='mb-8'>
              <div className='flex items-center gap-3 mb-2'>
                <span className='text-3xl'>💐</span>
                <div>
                  <h1 className='font-script text-3xl gradient-text'>Digital Bouquet</h1>
                  <p className='text-rose-500 text-sm'>Create a beautiful flower arrangement</p>
                </div>
              </div>
            </div>
            <BouquetEditor
              entryId={'new-entry'}
              onSave={handleBouquetSave}
              onCancel={() => setShowBouquetEditor(false)}
            />
          </div>
        </div>
      )
    }
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button onClick={() => setSelectedType(null)} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>💐</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Digital Bouquet</h1>
                <p className='text-rose-500 text-sm'>Create a beautiful flower arrangement with procedural generation</p>
              </div>
            </div>
          </div>
          <div className='card p-8 text-center'>
            <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
            <h2 className='font-serif text-xl text-slate-700 mb-2'>Create Your Bouquet</h2>
            <p className='text-slate-500 mb-6'>
              Choose flower types, colors, and arrangement patterns.
              Your bouquet will be generated with beautiful procedural flowers.
            </p>
            <button onClick={() => setShowBouquetEditor(true)} className='btn-primary inline-flex items-center gap-2'>
              <Sparkles className='w-4 h-4' />
              Create Bouquet
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'voice_note') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-md mx-auto px-6 py-12'>
          <button onClick={() => setSelectedType(null)} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>ðŸŽµ</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Voice Note</h1>
                <p className='text-rose-500 text-sm'>Record or upload an audio message</p>
              </div>
            </div>
          </div>
          <VoiceNoteRecorder entryId={'new-entry'} onSave={() => router.push('/admin')} />
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-cream-50'>
      <div className='max-w-2xl mx-auto px-6 py-12'>
        <button onClick={() => setSelectedType(null)} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
          <ArrowLeft className='w-4 h-4' /> Back to types
        </button>
        <div>
          <div className='flex items-center gap-3 mb-8'>
            <span className='text-3xl'>{ENTRY_TYPES.find(t => t.type === selectedType)?.icon}</span>
            <div>
              <h1 className='font-script text-3xl gradient-text'>{ENTRY_TYPES.find(t => t.type === selectedType)?.label}</h1>
              <p className='text-rose-500 text-sm'>{ENTRY_TYPES.find(t => t.type === selectedType)?.description}</p>
            </div>
          </div>
          <div className='card p-8 text-center'>
            <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
            <h2 className='font-serif text-xl text-slate-700 mb-2'>Coming Soon</h2>
            <p className='text-slate-500 mb-6'>
              The {ENTRY_TYPES.find(t => t.type === selectedType)?.label.toLowerCase()} editor is being crafted with love.
              Stay tuned for updates!
            </p>
            <button onClick={() => setSelectedType(null)} className='btn-secondary'>
              Choose a different type
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

