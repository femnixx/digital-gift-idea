'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Calendar, MapPin, Tag, Edit3, Trash2, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import type { Memory } from '@/types'

interface MemoryLaneProps {
  memories: Memory[]
  entryId: string
  isEditing?: boolean
  onSave?: (memories: Memory[]) => void
}

export function MemoryLane({ memories: initialMemories, entryId, isEditing = false, onSave }: MemoryLaneProps) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  const handleSaveMemory = async (memory: Partial<Memory>) => {
    setLoading(true)
    try {
      const method = editingMemory ? 'PUT' : 'POST'
      const url = new URL(`/api/entries/${entryId}/memories`, window.location.origin)
      if (token) url.searchParams.set('token', token)
      if (editingMemory) url.searchParams.set('memory_id', editingMemory.id)

      const res = await fetch(url.toString(), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memory),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save memory')

      const saved = data.memory || data.memories
      if (editingMemory) {
        setMemories(prev => prev.map(m => m.id === editingMemory.id ? saved : m))
      } else {
        setMemories(prev => [...prev, saved].sort((a, b) =>
          new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime()
        ))
      }
      setEditingMemory(null)
      setShowEditor(false)
      onSave?.(memories)
    } catch (err) {
      console.error('Save memory error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this memory?')) return
    setLoading(true)
    try {
      const url = new URL(`/api/entries/${entryId}/memories`, window.location.origin)
      if (token) url.searchParams.set('token', token)
      url.searchParams.set('memory_id', id)

      const res = await fetch(url.toString(), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setMemories(prev => prev.filter(m => m.id !== id))
      onSave?.(memories.filter(m => m.id !== id))
    } catch (err) {
      console.error('Delete memory error:', err)
    } finally {
      setLoading(false)
    }
  }

  const sortedMemories = [...memories].sort((a, b) =>
    new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime()
  )

  if (showEditor) {
    return (
      <MemoryEditor
        entryId={entryId}
        memory={editingMemory}
        onSave={handleSaveMemory}
        onCancel={() => {
          setShowEditor(false)
          setEditingMemory(null)
        }}
        loading={loading}
      />
    )
  }

  if (!sortedMemories.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted font-handwriting text-lg mb-4">No memories yet</p>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setEditingMemory(null)
              setShowEditor(true)
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Memory
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isEditing && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setEditingMemory(null)
              setShowEditor(true)
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-1/2 -ml-px h-full w-0.5 bg-line" />
        <div className="space-y-8">
          {sortedMemories.map((memory, i) => (
            <motion.div
              key={memory.id}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`absolute left-1/2 -ml-[34px] -mt-1 z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface bg-accent text-white shadow-md`}>
                <Calendar className="w-5 h-5" />
              </div>

              <div className="ml-[60px] lg:ml-0 lg:w-1/2 lg:pl-12 lg:text-right">
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-handwriting text-xl text-accent mb-1">{memory.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(memory.memory_date), 'MMMM d, yyyy')}</span>
                        {memory.location && (
                          <>
                            <span>·</span>
                            <MapPin className="w-4 h-4" />
                            <span>{memory.location}</span>
                          </>
                        )}
                      </div>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {memory.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-base-2 text-muted"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemory(memory)
                            setShowEditor(true)
                          }}
                          className="p-1.5 rounded-lg bg-base-2 border-card-border text-text hover:text-accent transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(memory.id)}
                          className="p-1.5 rounded-lg bg-base-2 border-card-border text-text hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {memory.description && (
                    <p className="text-sm text-body leading-relaxed whitespace-pre-wrap mt-3">
                      {memory.description}
                    </p>
                  )}

                  {memory.is_milestone && (
                    <span className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Milestone
                    </span>
                  )}

                  {memory.media_urls && memory.media_urls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {memory.media_urls.slice(0, 6).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Memory photo ${i + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-card-border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MemoryEditorProps {
  entryId: string
  memory: Partial<Memory> | null
  onSave: (memory: Partial<Memory>) => void
  onCancel: () => void
  loading?: boolean
}

function MemoryEditor({ entryId, memory, onSave, onCancel, loading }: MemoryEditorProps) {
  const [title, setTitle] = useState(memory?.title || '')
  const [description, setDescription] = useState(memory?.description || '')
  const [date, setDate] = useState(memory?.memory_date ? memory.memory_date.split('T')[0] : new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState(memory?.location || '')
  const [tags, setTags] = useState(memory?.tags?.join(', ') || '')
  const [isMilestone, setIsMilestone] = useState(memory?.is_milestone || false)

  const handleSubmit = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description || null,
      memory_date: date,
      location: location || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      is_milestone: isMilestone,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-script text-xl text-accent">
          {memory ? 'Edit Memory' : 'Add Memory'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg bg-base-2 border-card-border text-text hover:text-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="First date at the bookstore..."
            className="input"
            maxLength={200}
          />
        </div>

        <div>
          <label className="label flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="label flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where it happened"
            className="input"
            maxLength={200}
          />
        </div>

        <div>
          <label className="label flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="adventure, birthday, first (comma separated)"
            className="input"
            maxLength={200}
          />
        </div>

        <div>
          <label className="label flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Story
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell the story of this memory..."
            className="textarea min-h-[150px] resize-y"
            maxLength={2000}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isMilestone}
              onChange={(e) => setIsMilestone(e.target.checked)}
              className="rounded border-card-border text-amber-600 focus:ring-amber-500"
            />
            <span>Milestone memory</span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !date}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? 'Saving...' : memory ? 'Update Memory' : 'Add Memory'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
