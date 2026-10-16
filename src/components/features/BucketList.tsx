'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Calendar, MapPin, Tag, Edit3, Trash2, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import type { BucketListItem } from '@/types'

interface BucketListProps {
  items: BucketListItem[]
  entryId: string
  isEditing?: boolean
  onSave?: (items: BucketListItem[]) => void
}

export function BucketList({ items: initialItems, entryId, isEditing = false, onSave }: BucketListProps) {
  const [items, setItems] = useState<BucketListItem[]>(initialItems)
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  const handleSaveItem = async (itemData: Partial<BucketListItem>) => {
    setLoading(true)
    try {
      const method = editingItem ? 'PUT' : 'POST'
      const url = new URL(`/api/entries/${entryId}/bucket-list`, window.location.origin)
      if (token) url.searchParams.set('token', token)
      if (editingItem) url.searchParams.set('item_id', editingItem.id)

      const res = await fetch(url.toString(), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save item')

      const saved = data.item || data.items
      if (editingItem) {
        setItems(prev => prev.map(i => i.id === editingItem.id ? saved : i))
      } else {
        setItems(prev => [...prev, saved].sort((a, b) =>
          new Date(a.dream_date).getTime() - new Date(b.dream_date).getTime()
        ))
      }
      setEditingItem(null)
      setShowEditor(false)
      onSave?.(items)
    } catch (err) {
      console.error('Save item error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from the bucket list?')) return
    setLoading(true)
    try {
      const url = new URL(`/api/entries/${entryId}/bucket-list`, window.location.origin)
      if (token) url.searchParams.set('token', token)
      url.searchParams.set('item_id', id)

      const res = await fetch(url.toString(), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setItems(prev => prev.filter(i => i.id !== id))
      onSave?.(items.filter(i => i.id !== id))
    } catch (err) {
      console.error('Delete item error:', err)
    } finally {
      setLoading(false)
    }
  }

  const sortedItems = [...items].sort((a, b) =>
    new Date(a.dream_date).getTime() - new Date(b.dream_date).getTime()
  )

  if (showEditor) {
    return (
      <BucketListEditor
        entryId={entryId}
        item={editingItem}
        onSave={handleSaveItem}
        onCancel={() => {
          setShowEditor(false)
          setEditingItem(null)
        }}
        loading={loading}
      />
    )
  }

  if (!sortedItems.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted font-handwriting text-lg mb-4">Your bucket list is empty</p>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setEditingItem(null)
              setShowEditor(true)
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Goal
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
              setEditingItem(null)
              setShowEditor(true)
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-1/2 -ml-px h-full w-0.5 bg-line" />
        <div className="space-y-8">
          {sortedItems.map((item, i) => (
            <motion.div
              key={item.id}
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
                      <h3 className="font-handwriting text-xl text-accent mb-1">{item.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(item.dream_date), 'MMMM d, yyyy')}</span>
                        {item.location && (
                          <>
                            <span>·</span>
                            <MapPin className="w-4 h-4" />
                            <span>{item.location}</span>
                          </>
                        )}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.tags.map(tag => (
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
                            setEditingItem(item)
                            setShowEditor(true)
                          }}
                          className="p-1.5 rounded-lg bg-base-2 border-card-border text-text hover:text-accent transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-base-2 border-card-border text-text hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-sm text-body leading-relaxed whitespace-pre-wrap mt-3">
                      {item.description}
                    </p>
                  )}

                  {item.is_achieved && (
                    <span className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Achieved
                    </span>
                  )}

                  {item.media_urls && item.media_urls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {item.media_urls.slice(0, 6).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Goal photo ${i + 1}`}
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

interface BucketListEditorProps {
  entryId: string
  item: Partial<BucketListItem> | null
  onSave: (item: Partial<BucketListItem>) => void
  onCancel: () => void
  loading?: boolean
}

function BucketListEditor({ entryId, item, onSave, onCancel, loading }: BucketListEditorProps) {
  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')
  const [date, setDate] = useState(item?.dream_date ? item.dream_date.split('T')[0] : new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState(item?.location || '')
  const [tags, setTags] = useState(item?.tags?.join(', ') || '')
  const [isAchieved, setIsAchieved] = useState(item?.is_achieved || false)

  const handleSubmit = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description || null,
      dream_date: date,
      location: location || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      is_achieved: isAchieved,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-script text-xl text-accent">
          {item ? 'Edit Goal' : 'Add Goal'}
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
            placeholder="Visit Paris..."
            className="input"
            maxLength={200}
          />
        </div>

        <div>
          <label className="label flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Target Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
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
            placeholder="Where you want to go"
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
            placeholder="travel, adventure, dream (comma separated)"
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
            placeholder="What makes this goal special?"
            className="textarea min-h-[150px] resize-y"
            maxLength={2000}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAchieved}
              onChange={(e) => setIsAchieved(e.target.checked)}
              className="rounded border-card-border text-green-600 focus:ring-green-500"
            />
            <span>Already achieved this goal</span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !date}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? 'Saving...' : item ? 'Update Goal' : 'Add Goal'}
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
