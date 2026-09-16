'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { EntryType } from '@/types'

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
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const generateSlug = (text: string) => {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !title || !slug) return

    setIsSubmitting(true)

    const isDemoMode = !(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
    )

    if (isDemoMode) {
      try {
        const storage = localStorage.getItem('digital-love-letters-demo')
        const data = storage ? JSON.parse(storage) : { entries: [] }
        
        const newEntry = {
          id: Math.random().toString(36).substring(2, 15),
          slug,
          title,
          type: selectedType,
          content: { message: '' },
          publish_at: new Date().toISOString(),
          unlock_at: null,
          unlock_condition: null,
          is_published: true,
          is_featured: false,
          view_count: 0,
          created_by: 'demo-user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        data.entries = [newEntry, ...(data.entries || [])]
        localStorage.setItem('digital-love-letters-demo', JSON.stringify(data))
        
        router.push(/daily/)
      } catch (error) {
        console.error('Error saving entry:', error)
        alert('Failed to save entry. Please try again.')
      }
    } else {
      try {
        const response = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            type: selectedType,
            slug,
            content: {},
            is_published: true,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Failed to create entry')
          return
        }

        const { entry } = await response.json()
        router.push(/daily/)
      } catch (error) {
        console.error('Error creating entry:', error)
        alert('Failed to create entry. Please try again.')
      }
    }

    setIsSubmitting(false)
  }

  if (!selectedType) {
    return (
      <div className=""min-h-screen bg-cream-50"">
        <div className=""max-w-4xl mx-auto px-6 py-12"">
          <Link href=""/admin"" className=""inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8"">
            <ArrowLeft className=""w-4 h-4"" /> Back to Dashboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className=""font-script text-4xl gradient-text mb-4"">Create New Entry</h1>
            <p className=""text-rose-600 mb-8"">Choose what kind of surprise you want to create</p>

            <div className=""grid gap-4 sm:grid-cols-2 lg:grid-cols-3"">
              {ENTRY_TYPES.map((type, index) => (
                <motion.button
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  className=""card p-6 text-left group hover:border-rose-300""
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className=""text-4xl mb-4"">{type.icon}</div>
                  <h3 className=""font-serif text-lg font-semibold text-rose-900 mb-1"">{type.label}</h3>
                  <p className=""text-rose-500 text-sm"">{type.description}</p>
                  <div className=""mt-4 flex items-center gap-1 text-rose-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"">
                    <span>Create</span>
                    <Sparkles className=""w-4 h-4"" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className=""min-h-screen bg-cream-50"">
      <div className=""max-w-2xl mx-auto px-6 py-12"">
        <Link href=""/admin/entries/new"" className=""inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-8"">
          <ArrowLeft className=""w-4 h-4"" /> Back to types
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className=""flex items-center gap-3 mb-8"">
            <span className=""text-3xl"">{ENTRY_TYPES.find(t => t.type === selectedType)?.icon}</span>
            <div>
              <h1 className=""font-script text-3xl gradient-text"">{ENTRY_TYPES.find(t => t.type === selectedType)?.label}</h1>
              <p className=""text-rose-500 text-sm"">{ENTRY_TYPES.find(t => t.type === selectedType)?.description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className=""space-y-6"">
            <div>
              <label className=""label"">Title</label>
              <input
                type=""text""
                value={title}
                onChange={handleTitleChange}
                placeholder=""Give your entry a beautiful title...""
                className=""input""
                required
              />
            </div>

            <div>
              <label className=""label"">Slug (URL)</label>
              <input
                type=""text""
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^\w-]+/g, '-'))}
                placeholder=""my-love-letter""
                className=""input font-mono text-sm""
                required
              />
              <p className=""text-rose-400 text-xs mt-1"">Your entry will be at: /daily/{slug || 'your-slug'}</p>
            </div>

            <div className=""flex items-center gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100"">
              <input
                type=""checkbox""
                id=""published""
                defaultChecked
                className=""w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500""
              />
              <label htmlFor=""published"" className=""text-rose-700"">
                <span className=""font-medium"">Publish immediately</span>
                <p className=""text-sm text-rose-500"">Your partner will be able to see this right away</p>
              </label>
            </div>

            <div className=""flex gap-4 pt-4"">
              <button type=""submit"" disabled={isSubmitting || !title || !slug} className=""btn-primary flex-1"">
                {isSubmitting ? (
                  <>
                    <motion.div className=""w-5 h-5 border-2 border-white/30 border-t-white rounded-full"" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Heart className=""w-5 h-5"" />
                    Create Entry
                  </>
                )}
              </button>
              <button type=""button"" onClick={() => setSelectedType(null)} className=""btn-secondary"">
                Back
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}