'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Sparkles, CheckCircle2, Plus } from 'lucide-react'
import Link from 'next/link'
import { EntryType, type Entry } from '@/types'
import { LetterEditor } from '@/components/features/LetterEditor'
import { ScratchCardCustomizer } from '@/components/features/ScratchCardCustomizer'
import { CoffeeDateSelector } from '@/components/features/CoffeeDateSelector'
import { VoiceNoteRecorder } from '@/components/features/VoiceNoteRecorder'
import { BouquetEditor } from '@/components/features/BouquetEditor'
import { PolaroidCustomizer } from '@/components/features/PolaroidCustomizer'
import { OpenWhenLetters, OpenWhenEditor } from '@/components/features/OpenWhenLetters'
import type { PolaroidCard, OpenWhenLetter } from '@/types'
import { db } from '@/lib/storage/localStorageDB'

const ENTRY_TYPES: { type: EntryType; label: string; icon: string; description: string }[] = [
  { type: 'letter', label: 'Love Letter', icon: '💌', description: 'A heartfelt message' },
  { type: 'bouquet', label: 'Digital Bouquet', icon: '💐', description: 'Flowers with notes' },
  { type: 'polaroid', label: 'Polaroid Deck', icon: '📸', description: 'Flip-through photos' },
  { type: 'scratch_card', label: 'Scratch Card', icon: '🎫', description: 'Hidden surprise reveal' },
  { type: 'open_when', label: 'Open When Letter', icon: '💌', description: 'Sealed until the right moment' },
  { type: 'voice_note', label: 'Voice Note', icon: '🎵', description: 'Audio cassette message' },
  { type: 'coffee_date', label: 'Coffee Date', icon: '☕', description: 'Virtual treat with gift card' },
]

function generateSlug(title: string): string {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const existing = db.entries.list()
  const sameBase = existing.filter(e => e.slug.startsWith(base))
  if (sameBase.length === 0) return base
  return `${base}-${sameBase.length + 1}`
}

export default function NewEntryPage() {
  const router = useRouter()
  const [step, setStep] = useState<'title' | 'type' | 'editor'>('title')
  const [title, setTitle] = useState('')
  const [selectedType, setSelectedType] = useState<EntryType | null>(null)
  const [showScratchEditor, setShowScratchEditor] = useState(false)
  const [showCoffeeDateEditor, setShowCoffeeDateEditor] = useState(false)
  const [showBouquetEditor, setShowBouquetEditor] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPolaroidEditor, setShowPolaroidEditor] = useState(false)
  const [showOpenWhenEditor, setShowOpenWhenEditor] = useState(false)
  const [polaroidCards, setPolaroidCards] = useState<PolaroidCard[]>([])
  const [openWhenLetters, setOpenWhenLetters] = useState<OpenWhenLetter[]>([])

  const createEntry = (content: Record<string, any> = {}) => {
    if (!title.trim() || !selectedType) return
    const slug = generateSlug(title)
    const entry: Entry = {
      id: `entry-${Date.now()}`,
      slug,
      title: title.trim(),
      type: selectedType,
      content,
      publish_at: new Date().toISOString(),
      unlock_at: null,
      unlock_condition: null,
      is_published: false,
      is_featured: false,
      view_count: 0,
      created_by: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    db.entries.insert(entry)
    setShowSuccess(true)
    setTimeout(() => router.push('/admin'), 1500)
  }

  const handleScratchSave = (card: any) => {
    createEntry({ scratch_cards: [card] })
  }

  const handleCoffeeDateSave = (dates: any[]) => {
    createEntry({ coffee_dates: dates })
  }

  const handleBouquetSave = (flowers: any[]) => {
    createEntry({ bouquet_flowers: flowers })
  }

  const handlePolaroidAddCard = (card: PolaroidCard) => {
    setPolaroidCards(prev => [...prev, card])
  }

  const handlePolaroidSave = () => {
    createEntry({ polaroid_cards: polaroidCards })
  }

  const handleOpenWhenSaveLetter = (letter: OpenWhenLetter) => {
    if (letter.id) {
      setOpenWhenLetters(prev => prev.map(l => l.id === letter.id ? letter : l))
    } else {
      setOpenWhenLetters(prev => [...prev, letter])
    }
  }

  const handleOpenWhenSave = () => {
    createEntry({ open_when_letters: openWhenLetters })
  }

  const handleVoiceSave = () => {
    createEntry({ voice_notes: [] })
  }

  const handleLetterSave = (content: { message: string }, extra?: Record<string, any>) => {
    createEntry({ ...content, ...extra })
  }

  if (step === 'title') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-2xl mx-auto px-6 py-12'>
          <Link href='/admin' className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to Dashboard
          </Link>
          <div className='mb-8'>
            <h1 className='font-script text-4xl gradient-text mb-2'>Create New Entry</h1>
            <p className='text-rose-600'>Give your surprise a title</p>
          </div>
          <div className='card p-8'>
            <div className='space-y-6'>
              <div>
                <label className='label'>Title</label>
                <input
                  type='text'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder='e.g., Our First Anniversary'
                  className='input'
                  autoFocus
                />
              </div>
              <button
                onClick={() => { if (title.trim()) setStep('type') }}
                disabled={!title.trim()}
                className='btn-primary w-full disabled:opacity-50'
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'type' && !selectedType) {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button onClick={() => setStep('title')} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back
          </button>
          <div className='mb-8'>
            <h1 className='font-script text-4xl gradient-text mb-2'>Choose a Format</h1>
            <p className='text-rose-600'>What kind of surprise do you want to create?</p>
          </div>
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
    )
  }

  {showSuccess && (
    <div className='min-h-screen bg-cream-50 flex items-center justify-center'>
      <div className='text-center card p-12 max-w-md'>
        <CheckCircle2 className='w-16 h-16 text-green-500 mx-auto mb-4' />
        <h2 className='font-script text-3xl gradient-text mb-2'>Entry Created!</h2>
        <p className='text-rose-600'>Your gift has been saved. Redirecting...</p>
      </div>
    </div>
  )}

  if (selectedType === 'letter') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button onClick={() => { setSelectedType(null); setStep('type') }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>💌</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Love Letter</h1>
                <p className='text-rose-500 text-sm'>Write a heartfelt message</p>
              </div>
            </div>
          </div>
          <LetterEditor
            onSave={handleLetterSave}
            onCancel={() => { setSelectedType(null); setStep('type') }}
            mode="edit"
            showActions={true}
          />
        </div>
      </div>
    )
  }

  if (selectedType === 'scratch_card' && showScratchEditor) {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-2xl mx-auto px-6 py-12'>
          <button onClick={() => { setShowScratchEditor(false); setSelectedType(null); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
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
            onCancel={() => { setShowScratchEditor(false); setSelectedType(null); }}
          />
        </div>
      </div>
    )
  }

  if (selectedType === 'scratch_card') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-2xl mx-auto px-6 py-12'>
          <button onClick={() => { setSelectedType(null); setStep('type'); setShowScratchEditor(false); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
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
          <div className='card p-8 text-center'>
            <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
            <h2 className='font-serif text-xl text-slate-700 mb-2'>Create Your Scratch Card</h2>
            <p className='text-slate-500 mb-6'>Upload an image or write a message to hide under the scratch layer.</p>
            <button onClick={() => setShowScratchEditor(true)} className='btn-primary inline-flex items-center gap-2'>
              <Sparkles className='w-4 h-4' />
              Create Scratch Card
            </button>
          </div>
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
          <div className='mb-6'>
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

  if (selectedType === 'coffee_date') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button onClick={() => { setSelectedType(null); setStep('type'); setShowCoffeeDateEditor(false); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>☕</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Coffee Date</h1>
                <p className='text-rose-500 text-sm'>Create a virtual coffee date with gift card</p>
              </div>
            </div>
          </div>
          <div className='card p-8 text-center'>
            <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
            <h2 className='font-serif text-xl text-slate-700 mb-2'>Create Your Coffee Date</h2>
            <p className='text-slate-500 mb-6'>Choose drinks, add a personal message, and include a gift card link for your partner.</p>
            <button onClick={() => setShowCoffeeDateEditor(true)} className='btn-primary inline-flex items-center gap-2'>
              <Sparkles className='w-4 h-4' />
              Create Coffee Date
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'bouquet' && showBouquetEditor) {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button onClick={() => { setShowBouquetEditor(false); setSelectedType(null); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
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
            onCancel={() => { setShowBouquetEditor(false); setSelectedType(null); }}
          />
        </div>
      </div>
    )
  }

  if (selectedType === 'bouquet') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button onClick={() => { setSelectedType(null); setStep('type'); setShowBouquetEditor(false); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
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
          <button onClick={() => { setSelectedType(null); setStep('type'); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>🎵</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Voice Note</h1>
                <p className='text-rose-500 text-sm'>Record or upload an audio message</p>
              </div>
            </div>
          </div>
          <VoiceNoteRecorder entryId={'new-entry'} onSave={handleVoiceSave} />
        </div>
      </div>
    )
  }

  if (selectedType === 'open_when' && showOpenWhenEditor) {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button
            onClick={() => { setShowOpenWhenEditor(false); setOpenWhenLetters([]); }}
            className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'
          >
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>💌</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Open When Letters</h1>
                <p className='text-rose-500 text-sm'>Create sealed letters that unlock at the right moment</p>
              </div>
            </div>
          </div>

          {openWhenLetters.length === 0 ? (
            <div className='text-center py-12'>
              <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
              <h2 className='font-serif text-xl text-slate-700 mb-2'>Create Your First Letter</h2>
              <p className='text-slate-500 mb-6'>Add a sealed letter that opens on a specific date, location, or feeling.</p>
              <button
                onClick={() => setOpenWhenLetters([{
                  id: '',
                  entry_id: 'new-entry',
                  trigger_label: '',
                  trigger_type: 'manual',
                  trigger_value: null,
                  envelope_color: '#F3E5F5',
                  seal_emoji: '💌',
                  content: { title: '', message: '' },
                  is_unlocked: false,
                  unlocked_at: null,
                  sort_order: 0,
                  created_at: new Date().toISOString(),
                }])}
                className='btn-primary inline-flex items-center gap-2'
              >
                <Plus className='w-4 h-4' />
                Add Open When Letter
              </button>
            </div>
          ) : (
            <div className='space-y-6'>
              <OpenWhenLetters
                letters={openWhenLetters}
                isEditing={true}
                onSave={setOpenWhenLetters}
              />
              <div className='flex justify-end gap-3 pt-4'>
                <button
                  onClick={() => { setShowOpenWhenEditor(false); setOpenWhenLetters([]); }}
                  className='btn-secondary'
                >
                  Cancel
                </button>
                <button
                  onClick={handleOpenWhenSave}
                  disabled={openWhenLetters.length === 0}
                  className='btn-primary'
                >
                  <Sparkles className='w-4 h-4' />
                  Save Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (selectedType === 'open_when') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-2xl mx-auto px-6 py-12'>
          <button onClick={() => { setSelectedType(null); setStep('type'); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>💌</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Open When Letter</h1>
                <p className='text-rose-500 text-sm'>Sealed until the right moment</p>
              </div>
            </div>
          </div>
          <div className='card p-8 text-center'>
            <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
            <h2 className='font-serif text-xl text-slate-700 mb-2'>Create Open When Letter</h2>
            <p className='text-slate-500 mb-6'>Write a letter that opens on a specific date, location, or feeling.</p>
            <button
              onClick={() => {
                setOpenWhenLetters([{
                  id: '',
                  entry_id: 'new-entry',
                  trigger_label: '',
                  trigger_type: 'manual',
                  trigger_value: null,
                  envelope_color: '#F3E5F5',
                  seal_emoji: '💌',
                  content: { title: '', message: '' },
                  is_unlocked: false,
                  unlocked_at: null,
                  sort_order: 0,
                  created_at: new Date().toISOString(),
                }])
                setShowOpenWhenEditor(true)
              }}
              className='btn-primary inline-flex items-center gap-2'
            >
              <Sparkles className='w-4 h-4' />
              Create Open When Letter
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'polaroid' && showPolaroidEditor) {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-4xl mx-auto px-6 py-12'>
          <button
            onClick={() => { setShowPolaroidEditor(false); setPolaroidCards([]); }}
            className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'
          >
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>📸</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Polaroid Deck</h1>
                <p className='text-rose-500 text-sm'>Flip-through photos</p>
              </div>
            </div>
          </div>

          {polaroidCards.length === 0 ? (
            <div className='text-center py-12'>
              <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
              <h2 className='font-serif text-xl text-slate-700 mb-2'>Create Your Polaroid Deck</h2>
              <p className='text-slate-500 mb-6'>Upload photos, add captions, and arrange them in a beautiful polaroid deck.</p>
              <button
                onClick={() => {
                  const newCard: PolaroidCard = {
                    id: '',
                    entry_id: 'new-entry',
                    image_url: '',
                    caption: '',
                    date_tag: null,
                    back_note: null,
                    hidden_message: null,
                    tilt_degrees: 0,
                    sort_order: 0,
                    template: 'classic_white',
                    orientation: 'portrait',
                    font_family: 'font-handwriting',
                    font_size: 'text-lg',
                    font_color: '#881337',
                    text_alignment: 'center',
                    stickers: [],
                    created_at: new Date().toISOString(),
                  }
                  setPolaroidCards([newCard])
                }}
                className='btn-primary inline-flex items-center gap-2'
              >
                <Plus className='w-4 h-4' />
                Add First Photo
              </button>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='flex justify-center'>
                <span className='text-sm text-rose-500'>{polaroidCards.length} card{polaroidCards.length > 1 ? 's' : ''}</span>
              </div>
              <PolaroidCustomizer
                entryId='new-entry'
                onSave={handlePolaroidAddCard}
              />
              <div className='flex justify-end gap-3 pt-4'>
                <button
                  onClick={() => { setShowPolaroidEditor(false); setPolaroidCards([]); }}
                  className='btn-secondary'
                >
                  Cancel
                </button>
                <button
                  onClick={handlePolaroidSave}
                  disabled={polaroidCards.length === 0}
                  className='btn-primary'
                >
                  <Sparkles className='w-4 h-4' />
                  Save Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (selectedType === 'polaroid') {
    return (
      <div className='min-h-screen bg-cream-50'>
        <div className='max-w-2xl mx-auto px-6 py-12'>
          <button onClick={() => { setSelectedType(null); setStep('type'); }} className='inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8'>
            <ArrowLeft className='w-4 h-4' /> Back to types
          </button>
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2'>
              <span className='text-3xl'>📸</span>
              <div>
                <h1 className='font-script text-3xl gradient-text'>Polaroid Deck</h1>
                <p className='text-rose-500 text-sm'>Flip-through photos</p>
              </div>
            </div>
          </div>
          <div className='card p-8 text-center'>
            <Sparkles className='w-12 h-12 text-gold-400 mx-auto mb-4' />
            <h2 className='font-serif text-xl text-slate-700 mb-2'>Create Polaroid Deck</h2>
            <p className='text-slate-500 mb-6'>Upload photos, add captions, and arrange them in a beautiful polaroid deck.</p>
            <button
              onClick={() => setShowPolaroidEditor(true)}
              className='btn-primary inline-flex items-center gap-2'
            >
              <Sparkles className='w-4 h-4' />
              Create Polaroid Deck
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
