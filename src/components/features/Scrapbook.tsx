'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, RotateCw, Type, Palette, Image as ImageIcon, Plus, X } from 'lucide-react'
import type { ScrapbookPage, ScrapbookItem, Media } from '@/types'
import { SCRAPBOOK_LAYOUT_CONFIG } from '@/types'

interface ScrapbookProps {
  pages: ScrapbookPage[]
  media: Media[]
  entryId: string
  isEditing?: boolean
  onSave?: (pages: ScrapbookPage[]) => void
  onMediaChange?: (media: Media[]) => void
}

const BACKGROUND_COLORS = [
  '#fdf6f0', '#fdf2f8', '#eff6ff', '#f0fdf4', '#fffbeb', '#f5f5dc', '#f8fafc', '#ffffff',
]

export function Scrapbook({ pages: initialPages, media, entryId, isEditing = false, onSave, onMediaChange }: ScrapbookProps) {
  const [pages, setPages] = useState<ScrapbookPage[]>(initialPages)
  const [currentPage, setCurrentPage] = useState(0)
  const [items, setItems] = useState<ScrapbookItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ScrapbookItem | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  useEffect(() => {
    if (pages.length > 0) {
      setItems(pages[currentPage]?.items || [])
    }
  }, [currentPage, pages])

  const handleSave = useCallback(async (updatedPages: ScrapbookPage[]) => {
    setLoading(true)
    try {
      const url = new URL(`/api/entries/${entryId}/scrapbook`, window.location.origin)
      if (token) url.searchParams.set('token', token)

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: updatedPages }),
      })
      if (!response.ok) throw new Error('Failed to save')

      setPages(updatedPages)
      onSave?.(updatedPages)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setLoading(false)
    }
  }, [entryId, token, onSave])

  const updateItem = (updatedItem: ScrapbookItem) => {
    const newItems = items.map(i => i.id === updatedItem.id ? updatedItem : i)
    setItems(newItems)
    setSelectedItem(updatedItem)
  }

  const addItem = (mediaItem: Media) => {
    const newItem: ScrapbookItem = {
      id: `new-${Date.now()}`,
      page_id: pages[currentPage]?.id || '',
      media_id: mediaItem.id,
      image_url: mediaItem.public_url || `/api/public/entries/${entryId}/media/${mediaItem.id}`,
      caption: null,
      position_x: 100,
      position_y: 100,
      width: 120,
      height: 120,
      rotation: 0,
      scale: 1,
      z_index: items.length,
      date_tag: null,
      font_family: 'serif',
      font_size: '14px',
      font_color: '#374151',
      text_alignment: 'center',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    const newPages = [...pages]
    if (newPages[currentPage]) {
      newPages[currentPage] = { ...newPages[currentPage], items: newItems }
    }
     setPages(newPages)
   }

   const handleFileUpload = async (files: File[]) => {
     if (files.length === 0) return

     setUploading(true)
     setUploadProgress(0)

     try {
       const uploaded: Media[] = []
       for (let i = 0; i < files.length; i++) {
         const file = files[i]
         const form = new FormData()
         form.append('file', file)
         form.append('entry_id', entryId)
         form.append('type', 'image')
         if (token) form.append('token', token)

         const res = await fetch('/api/media', { method: 'POST', body: form })
         if (!res.ok) {
           const body = await res.json().catch(() => ({}))
           throw new Error(body.error || `Upload failed for ${file.name}`)
         }
         const data = await res.json()
         uploaded.push(data.media)
         setUploadProgress(Math.round(((i + 1) / files.length) * 100))
       }

       setUploadProgress(0)
       onMediaChange?.([...media, ...uploaded])
     } catch (err: any) {
       console.error('Upload error:', err)
     } finally {
       setUploading(false)
     }
   }

  const deleteItem = (id: string) => {
    const newItems = items.filter(i => i.id !== id)
    setItems(newItems)
    const newPages = [...pages]
    if (newPages[currentPage]) {
      newPages[currentPage] = { ...newPages[currentPage], items: newItems }
      setPages(newPages)
    }
    setSelectedItem(null)
  }

  const updatePageSettings = (patch: Partial<Pick<ScrapbookPage, 'layout_type' | 'background_color' | 'background_image'>>) => {
    const newPages = [...pages]
    if (newPages[currentPage]) {
      newPages[currentPage] = { ...newPages[currentPage], ...patch, updated_at: new Date().toISOString() }
      setPages(newPages)
      handleSave(newPages)
    }
  }

  const saveCurrentPage = () => {
    const newPages = [...pages]
    if (newPages[currentPage]) {
      newPages[currentPage] = { ...newPages[currentPage], items, updated_at: new Date().toISOString() }
      setPages(newPages)
      handleSave(newPages)
    }
  }

  const page = pages[currentPage]
  if (!page) {
    if (isEditing) {
      return (
        <div className="text-center py-12">
          <button onClick={() => {
            const newPage: ScrapbookPage = {
              id: 'new',
              entry_id: entryId,
              layout_type: 'freeform',
              background_color: '#fdf6f0',
              background_image: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              items: [],
            }
            setPages([newPage])
            setItems([])
          }} className="btn-primary">
            Create Scrapbook Page
          </button>
        </div>
      )
    }
    return <div>No scrapbook pages yet</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentPage(i); setSelectedItem(null); saveCurrentPage() }}
              className={`px-3 py-1 rounded text-sm ${i === currentPage ? 'bg-brand text-white' : 'bg-base-2 text-muted'}`}
            >
              Page {i + 1}
            </button>
          ))}
          {isEditing && pages.length < 10 && (
            <button
              onClick={() => {
                const newPage: ScrapbookPage = {
                  id: `new-${Date.now()}`,
                  entry_id: entryId,
                  layout_type: 'freeform',
                  background_color: '#fdf6f0',
                  background_image: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  items: [],
                }
                setPages([...pages, newPage])
                setCurrentPage(pages.length)
                setItems([])
                setSelectedItem(null)
              }}
              className="px-3 py-1 rounded text-sm bg-base-2 text-muted hover:bg-base-3"
            >
              <Plus className="w-4 h-4 inline" />
            </button>
          )}
        </div>
      </div>

      <div
        className="relative bg-surface rounded-xl border-2 border-dashed border-line overflow-hidden"
        style={{
          backgroundColor: page.background_color,
          backgroundImage: page.background_image ? `url(${page.background_image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '500px',
        }}
      >
        {items.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            isSelected={selectedItem?.id === item.id}
            onSelect={() => setSelectedItem(item)}
            onUpdate={updateItem}
          />
        ))}

         {isEditing && items.length === 0 && !showAddPanel && (
           <div className="absolute inset-0 flex items-center justify-center">
             <button
               onClick={() => setShowAddPanel(true)}
               className="btn-primary flex items-center gap-2"
             >
               <Upload className="w-4 h-4" />
               Add Photos
             </button>
           </div>
         )}
      </div>

      <AnimatePresence>
        {showAddPanel && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-surface rounded-xl p-6 max-w-2xl w-full mx-4">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-script text-xl text-accent">Add Photos</h3>
                 <button onClick={() => setShowAddPanel(false)} className="text-muted hover:text-text">
                   <X className="w-4 h-4" />
                 </button>
               </div>

               <div
                 onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                 onDrop={(e) => {
                   e.preventDefault()
                   const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                   if (files.length > 0) {
                     handleFileUpload(files)
                   }
                 }}
               >
               {uploading && (
                 <div className="mb-4 space-y-2">
                   <div className="flex justify-between text-xs text-body-muted">
                     <span>Uploading…</span>
                     <span>{uploadProgress}%</span>
                   </div>
                   <div className="w-full bg-base-2 rounded-full h-2 overflow-hidden">
                     <div
                       className="h-full bg-brand transition-all duration-300"
                       style={{ width: `${uploadProgress}%` }}
                     />
                   </div>
                 </div>
               )}

               <div className="mb-3 flex items-center gap-2 text-xs text-body-muted">
                 <Upload className="w-4 h-4" />
                 <span>Drag & drop images here, or</span>
               </div>
               </div>

               <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                 <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   disabled={uploading}
                   className="aspect-square bg-base-2 rounded-lg border-2 border-dashed border-line hover:border-brand transition-colors flex flex-col items-center justify-center text-body-muted disabled:opacity-50"
                 >
                   <Upload className="w-6 h-6 mb-1" />
                   <span className="text-xs">Upload</span>
                 </button>
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   multiple
                   onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
                   className="hidden"
                 />
                 {media.filter(m => m.type === 'image').map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { addItem(m); setShowAddPanel(false) }}
                    className="aspect-square bg-base-2 rounded-lg overflow-hidden border-2 border-transparent hover:border-brand transition-colors"
                  >
                    <img
                      src={m.public_url || `/api/public/entries/${entryId}/media/${m.id}`}
                      alt={m.filename || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedItem && isEditing && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-20 right-4 w-72 bg-surface rounded-xl border border-line p-4 shadow-xl z-40"
        >
          <h4 className="font-script text-lg text-accent mb-3">Edit Item</h4>
          <div className="space-y-3">
            <div>
              <label className="label text-xs">Caption</label>
              <input
                type="text"
                value={selectedItem.caption || ''}
                onChange={(e) => updateItem({ ...selectedItem, caption: e.target.value || null })}
                placeholder="Add a caption..."
                className="input text-sm"
              />
            </div>
            <div>
              <label className="label text-xs">Rotation ({Math.round(selectedItem.rotation)}°)</label>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedItem.rotation}
                onChange={(e) => updateItem({ ...selectedItem, rotation: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="label text-xs">Size</label>
              <input
                type="range"
                min="60"
                max="240"
                value={selectedItem.width}
                onChange={(e) => updateItem({ ...selectedItem, width: Number(e.target.value), height: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => deleteItem(selectedItem.id)}
                className="btn-ghost flex-1 text-red-500 text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </button>
              <button
                onClick={saveCurrentPage}
                className="btn-primary flex-1 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function DraggableItem({
  item,
  isSelected,
  onSelect,
  onUpdate,
}: {
  item: ScrapbookItem
  isSelected: boolean
  onSelect: () => void
  onUpdate: (item: ScrapbookItem) => void
}) {
  const [position, setPosition] = useState({ x: item.position_x, y: item.position_y })
  const [dragging, setDragging] = useState(false)
  const startPos = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      px: item.position_x,
      py: item.position_y,
    }
    onSelect()
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !startPos.current) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    const newPos = {
      x: startPos.current.px + dx,
      y: startPos.current.py + dy,
    }
    setPosition(newPos)
  }, [dragging])

  const handleMouseUp = () => {
    setDragging(false)
    startPos.current = null
    onUpdate({ ...item, position_x: position.x, position_y: position.y })
  }

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, position])

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${item.position_x}px`,
        top: `${item.position_y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center',
        zIndex: item.z_index,
        cursor: 'move',
      }}
      onClick={() => { if (!dragging) onSelect() }}
    >
      <img
        src={item.image_url || ''}
        alt={item.caption || 'Scrapbook photo'}
        className="w-full h-full object-cover rounded shadow-lg border-2 border-white"
       draggable={false}
      />
      {item.caption && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs p-1 rounded-b"
          style={{
            fontFamily: item.font_family,
            fontSize: item.font_size,
            color: item.font_color,
            textAlign: item.text_alignment as any,
          }}
        >
          {item.caption}
        </div>
      )}
      {isSelected && (
        <div className="absolute -top-6 right-0 bg-base-2 rounded border border-line px-1">
          <RotateCw className="w-3 h-3 text-muted" />
        </div>
      )}
    </div>
  )
}
