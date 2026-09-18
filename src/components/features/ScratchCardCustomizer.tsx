'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Sparkles,
  Edit3,
  X,
  Upload,
  Image,
  Palette,
  Sliders,
  Type,
  Save,
  RotateCcw,
  Eye,
} from 'lucide-react'
import { db } from '@/lib/storage/localStorageDB'
import type { ScratchCard } from '@/types'

interface ScratchCardCustomizerProps {
  entryId: string
  card?: ScratchCard | null
  onSave: (card: ScratchCard) => void
  onCancel?: () => void
}

const COVER_COLORS = [
  { id: 'rose', color: '#0284c7', label: 'Rose' },
  { id: 'gold', color: '#f59e0b', label: 'Gold' },
  { id: 'lavender', color: '#a855f7', label: 'Lavender' },
  { id: 'sage', color: '#5aa05a', label: 'Sage' },
  { id: 'sky', color: '#0ea5e9', label: 'Sky' },
  { id: 'slate', color: '#475569', label: 'Slate' },
  { id: 'cream', color: '#fef3c7', label: 'Cream' },
  { id: 'blush', color: '#bae6fd', label: 'Blush' },
]

const COVER_PATTERNS = [
  { id: 'none', label: 'Solid', preview: 'bg-gradient-to-br from-sky-400 to-sky-600' },
  { id: 'stripes', label: 'Stripes', preview: 'bg-gradient-to-r from-sky-400 to-sky-500 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.3)_5px,rgba(255,255,255,0.3)_10px)]' },
  { id: 'dots', label: 'Dots', preview: 'bg-sky-400 bg-[radial-gradient(circle,rgba(255,255,255,0.5)_2px,transparent_2px)] [background-size:16px_16px]' },
  { id: 'diagonal', label: 'Diagonal', preview: 'bg-gradient-to-br from-sky-500 via-pink-500 to-sky-700' },
  { id: 'checker', label: 'Checker', preview: 'bg-sky-500 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.2)_75%),linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.2)_75%)] bg-[size:20px_20px]' },
]

const COVER_TEXT_STYLES = [
  { id: 'scratch_me', label: 'Scratch Me!', emoji: '✨' },
  { id: 'open_me', label: 'Open Me', emoji: '💌' },
  { id: 'surprise', label: 'Surprise!', emoji: '🎁' },
  { id: 'tap_here', label: 'Tap Here', emoji: '👆' },
  { id: 'for_you', label: 'For You', emoji: '💕' },
]

export function ScratchCardCustomizer({
  entryId,
  card,
  onSave,
  onCancel,
}: ScratchCardCustomizerProps) {
  const isEditing = !!card
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [coverColor, setCoverColor] = useState(card?.cover_color || '#0284c7')
  const [coverImageUrl, setCoverImageUrl] = useState<string>(card?.cover_image_url || '')
  const [coverPattern, setCoverPattern] = useState('none')
  const [coverText, setCoverText] = useState<string | null>(null)

  const [revealContentType, setRevealContentType] = useState<'text' | 'image'>(
    card?.reveal_content?.type || 'text'
  )
  const [revealText, setRevealText] = useState(
    card?.reveal_content?.type === 'text' ? card?.reveal_content.content || '' : ''
  )
  const [revealImageUrl, setRevealImageUrl] = useState(
    card?.reveal_content?.type === 'image' ? card?.reveal_content.content || '' : ''
  )

  const [scratchThreshold, setScratchThreshold] = useState(
    card?.scratch_threshold || 0.6
  )
  const [brushSize, setBrushSize] = useState(30)
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const getPatternClasses = () => {
    switch (coverPattern) {
      case 'stripes':
        return 'bg-gradient-to-r from-sky-400 to-sky-500 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.3)_5px,rgba(255,255,255,0.3)_10px)]'
      case 'dots':
        return 'bg-sky-400 bg-[radial-gradient(circle,rgba(255,255,255,0.5)_2px,transparent_2px)] [background-size:16px_16px]'
      case 'diagonal':
        return 'bg-gradient-to-br from-sky-500 via-pink-500 to-sky-700'
      case 'checker':
        return 'bg-sky-500 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.2)_75%),linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.2)_75%)] bg-[size:20px_20px]'
      default:
        return ''
    }
  }

  const getPreviewCoverStyle = (): React.CSSProperties => {
    if (coverImageUrl) {
      return { backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    if (coverPattern !== 'none') {
      return { backgroundColor: coverColor }
    }
    return { backgroundColor: coverColor }
  }

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCoverImageUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRevealImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setRevealImageUrl(reader.result as string)
      setRevealContentType('image')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (revealContentType === 'text' && !revealText.trim()) return
    if (revealContentType === 'image' && !revealImageUrl) return

    setIsSaving(true)
    try {
      let finalCoverImageUrl = coverImageUrl
      if (coverImageUrl && (!card?.cover_image_url || coverImageUrl !== card.cover_image_url)) {
        const mediaId = `media-${Date.now()}`
        const mediaItem = {
          id: mediaId,
          entry_id: entryId,
          type: 'image' as const,
          storage_path: `scratch-cover/${mediaId}.jpg`,
          public_url: coverImageUrl,
          filename: `scratch-cover-${Date.now()}.jpg`,
          mime_type: 'image/jpeg',
          size_bytes: null,
          sort_order: 0,
          created_at: new Date().toISOString(),
        }
        db.media.insert(mediaItem as any)
      }

      const savedCard: ScratchCard = {
        id: card?.id || `scratch-${Date.now()}`,
        entry_id: card?.entry_id || entryId,
        cover_color: coverColor,
        cover_image_url: finalCoverImageUrl || null,
        reveal_content: {
          type: revealContentType,
          content: revealContentType === 'text' ? revealText : revealImageUrl,
        },
        scratch_threshold: scratchThreshold,
        created_at: card?.created_at || new Date().toISOString(),
      }

      onSave(savedCard)
    } finally {
      setIsSaving(false)
    }
  }

  const getCoverPreview = () => {
    if (coverImageUrl) {
      return (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
          <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-white font-handwriting text-2xl drop-shadow-lg">
              {coverText || '✨'}
            </span>
          </div>
        </div>
      )
    }

    const patternClasses = getPatternClasses()
    return (
      <div
        className={`w-full aspect-video rounded-xl shadow-lg flex items-center justify-center ${patternClasses}`}
        style={coverPattern === 'none' ? { backgroundColor: coverColor } : {}}
      >
        {coverText && (
          <span className="text-white font-handwriting text-2xl md:text-3xl drop-shadow-lg text-center px-4">
            {coverText}
          </span>
        )}
      </div>
    )
  }

  const getRevealPreview = () => {
    if (revealContentType === 'image' && revealImageUrl) {
      return (
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
          <img src={revealImageUrl} alt="Reveal" className="w-full h-full object-cover" />
        </div>
      )
    }
    return (
      <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-sky-50 via-cream-50 to-blush-50 shadow-lg flex items-center justify-center p-6">
        <p className="font-handwriting text-xl md:text-2xl text-sky-700 text-center leading-relaxed">
          {revealText || 'Your hidden message...'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-sky-100 px-4 sm:px-6 py-4 flex items-center justify-between">
        <h3 className="font-script text-xl gradient-text">
          {isEditing ? 'Edit Scratch Card' : 'New Scratch Card'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {showPreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h4 className="font-handwriting text-lg text-sky-600 mb-1">Preview</h4>
                <p className="text-slate-500 text-sm">How your scratch card will look</p>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Cover</p>
                  {getCoverPreview()}
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Reveal</p>
                  {getRevealPreview()}
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="btn-secondary text-sm"
                >
                  Back to Editor
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Cover Image Upload */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Image className="w-4 h-4 text-sky-500" />
                  Cover Image (optional)
                </label>
                {coverImageUrl ? (
                  <div className="relative w-full max-w-xs mx-auto rounded-xl overflow-hidden border-2 border-sky-200">
                    <img src={coverImageUrl} alt="Cover" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-sky-300 hover:border-sky-400 hover:bg-sky-50 transition-colors w-full max-w-xs mx-auto"
                  >
                    <Upload className="w-6 h-6 text-sky-400" />
                    <span className="text-sm text-slate-600">Upload cover image</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileSelect}
                  className="hidden"
                />
              </div>

              {/* Cover Color */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Palette className="w-4 h-4 text-sky-500" />
                  Cover Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COVER_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCoverColor(c.color)
                        setCoverImageUrl('')
                      }}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        coverColor === c.color && !coverImageUrl
                          ? 'border-sky-500 shadow-md ring-2 ring-sky-200 scale-110'
                          : 'border-transparent hover:border-sky-300'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Cover Pattern */}
              <div className="space-y-3">
                <label className="label">Cover Pattern</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {COVER_PATTERNS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCoverPattern(p.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        coverPattern === p.id
                          ? 'border-sky-500 bg-sky-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-sky-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${p.preview}`} />
                      <span className="text-xs text-slate-600">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Text */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Type className="w-4 h-4 text-sky-500" />
                  Cover Text
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {COVER_TEXT_STYLES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCoverText(coverText === t.label ? null : t.label)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        coverText === t.label
                          ? 'border-sky-500 bg-sky-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-sky-300'
                      }`}
                    >
                      <span className="text-2xl">{t.emoji}</span>
                      <span className="text-xs text-slate-600">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-sky-100 pt-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-4 font-medium">
                  Hidden Surprise
                </p>
              </div>

              {/* Reveal Content Type */}
              <div className="space-y-3">
                <label className="label">What's inside?</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['text', 'image'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRevealContentType(type)}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                        revealContentType === type
                          ? 'border-sky-500 bg-sky-50 shadow-sm text-sky-700'
                          : 'border-slate-100 bg-white hover:border-sky-300 text-slate-600'
                      }`}
                    >
                      {type === 'text' ? '💌 Message' : '🖼️ Image'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reveal Text */}
              {revealContentType === 'text' && (
                <div className="space-y-3">
                  <label className="label flex items-center gap-2">
                    <Heart className="w-4 h-4 text-sky-500" />
                    Hidden Message
                  </label>
                  <textarea
                    value={revealText}
                    onChange={(e) => setRevealText(e.target.value)}
                    placeholder="Write your surprise message..."
                    className="textarea min-h-[120px] resize-y font-handwriting text-lg leading-relaxed"
                  />
                </div>
              )}

              {/* Reveal Image */}
              {revealContentType === 'image' && (
                <div className="space-y-3">
                  <label className="label flex items-center gap-2">
                    <Image className="w-4 h-4 text-sky-500" />
                    Surprise Image
                  </label>
                  {revealImageUrl ? (
                    <div className="relative w-full max-w-xs mx-auto rounded-xl overflow-hidden border-2 border-sky-200">
                      <img
                        src={revealImageUrl}
                        alt="Surprise"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setRevealImageUrl('')}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-sky-300 hover:border-sky-400 hover:bg-sky-50 transition-colors aspect-video"
                      >
                        <Upload className="w-6 h-6 text-sky-400" />
                        <span className="text-xs text-slate-600">Upload image</span>
                      </button>
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 block">Or paste URL:</label>
                        <input
                          type="url"
                          value={revealImageUrl}
                          onChange={(e) => setRevealImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="input w-full text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-sky-100 pt-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-4 font-medium">
                  Scratch Settings
                </p>
              </div>

              {/* Scratch Threshold */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-500" />
                  Reveal Threshold: {Math.round(scratchThreshold * 100)}%
                </label>
                <p className="text-xs text-slate-500 -mt-2">
                  How much needs to be scratched before revealing the content
                </p>
                <input
                  type="range"
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  value={scratchThreshold}
                  onChange={(e) => setScratchThreshold(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Easy (30%)</span>
                  <span>Hard (95%)</span>
                </div>
              </div>

              {/* Brush Size */}
              <div className="space-y-3">
                <label className="label">Brush Size: {brushSize}px</label>
                <p className="text-xs text-slate-500 -mt-2">
                  Size of the scratch area when touching the card
                </p>
                <input
                  type="range"
                  min={15}
                  max={60}
                  step={5}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Mini preview of scratch interaction */}
              <div className="space-y-3">
                <label className="label text-sm text-slate-500">Quick Preview</label>
                <div className="relative rounded-xl overflow-hidden shadow-lg mx-auto max-w-xs">
                  <ScratchCardPreview
                    coverColor={coverColor}
                    coverImageUrl={coverImageUrl}
                    coverPattern={coverPattern}
                    coverText={coverText}
                    revealContent={{
                      type: revealContentType,
                      content: revealContentType === 'text' ? revealText : revealImageUrl,
                    }}
                    brushSize={brushSize}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      {!showPreview && (
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-sky-50/30 border-t border-sky-100">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex items-center gap-2 text-sm ml-auto"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (revealContentType === 'text' && !revealText.trim()) || (revealContentType === 'image' && !revealImageUrl)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {isSaving ? 'Saving...' : isEditing ? 'Update Card' : 'Save Card'}
          </button>
        </div>
      )}
    </div>
  )
}

// Mini scratch card preview component for the editor
function ScratchCardPreview({
  coverColor,
  coverImageUrl,
  coverPattern,
  coverText,
  revealContent,
  brushSize,
}: {
  coverColor: string
  coverImageUrl: string
  coverPattern: string
  coverText: string | null
  revealContent: { type: 'text' | 'image'; content: string }
  brushSize: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isScratching, setIsScratching] = useState(false)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  const getPatternGradient = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    switch (coverPattern) {
      case 'stripes':
        const stripes = ctx.createLinearGradient(0, 0, width, height)
        stripes.addColorStop(0, coverColor)
        stripes.addColorStop(0.5, coverColor)
        stripes.addColorStop(0.5, 'rgba(255,255,255,0.3)')
        stripes.addColorStop(1, coverColor)
        return stripes
      case 'dots':
        return coverColor
      case 'diagonal':
        const diag = ctx.createLinearGradient(0, 0, width, height)
        diag.addColorStop(0, coverColor)
        diag.addColorStop(0.5, 'rgba(255,255,255,0.3)')
        diag.addColorStop(1, coverColor)
        return diag
      default:
        return coverColor
    }
  }

  const drawDotsPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = coverColor
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    for (let x = 0; x < width; x += 12) {
      for (let y = 0; y < height; y += 12) {
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const drawStripesPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 4
    for (let i = -height; i < width + height; i += 12) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + height, height)
      ctx.stroke()
    }
    ctx.fillStyle = coverColor
    ctx.globalAlpha = 0.8
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1
  }

  const drawCheckerPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const size = 16
    for (let x = 0; x < width; x += size) {
      for (let y = 0; y < height; y += size) {
        if ((x / size + y / size) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.25)'
          ctx.fillRect(x, y, size, size)
        }
      }
    }
    ctx.fillStyle = coverColor
    ctx.globalAlpha = 0.85
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1
  }

  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        width={300 * dpr}
        height={180 * dpr}
        className="w-full h-full touch-none rounded-xl"
        style={{ aspectRatio: '5/3' }}
        onMouseDown={(e) => {
          if (isRevealed) return
          setIsScratching(true)
          scratch(e.clientX, e.clientY)
        }}
        onMouseMove={(e) => {
          if (!isScratching || isRevealed) return
          scratch(e.clientX, e.clientY)
        }}
        onMouseUp={() => {
          setIsScratching(false)
          if (!isRevealed) checkReveal()
        }}
        onMouseLeave={() => {
          setIsScratching(false)
        }}
        onTouchStart={(e) => {
          if (isRevealed) return
          setIsScratching(true)
          const touch = e.touches[0]
          scratch(touch.clientX, touch.clientY)
        }}
        onTouchMove={(e) => {
          if (!isScratching || isRevealed) return
          e.preventDefault()
          const touch = e.touches[0]
          scratch(touch.clientX, touch.clientY)
        }}
        onTouchEnd={() => {
          setIsScratching(false)
          if (!isRevealed) checkReveal()
        }}
      />

      {!isRevealed && coverText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white font-handwriting text-lg drop-shadow-lg text-center px-4">
            {coverText}
          </span>
        </div>
      )}

      {!isRevealed && !coverImageUrl && !coverText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/70 text-sm font-handwriting">Scratch me!</span>
        </div>
      )}

      {isRevealed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-xl overflow-hidden">
          {revealContent.type === 'image' ? (
            <img
              src={revealContent.content}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-50 to-pink-50 flex items-center justify-center p-3">
              <p className="font-handwriting text-sm text-sky-700 text-center leading-relaxed">
                {revealContent.content}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          const rect = canvas.getBoundingClientRect()
          canvas.width = rect.width * dpr
          canvas.height = rect.height * dpr
          ctx.scale(dpr, dpr)
          drawCover(ctx, rect.width, rect.height)
          setIsRevealed(false)
        }}
        className="absolute top-2 right-2 p-1 rounded-full bg-white/80 text-sky-500 hover:bg-white text-xs z-10 shadow"
        title="Reset preview"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  )

  function drawCover(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (coverImageUrl) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = coverImageUrl
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        addNoiseTexture(ctx, width, height)
      }
      img.onerror = () => {
        ctx.fillStyle = coverColor
        ctx.fillRect(0, 0, width, height)
        addNoiseTexture(ctx, width, height)
      }
      return
    }

    switch (coverPattern) {
      case 'stripes':
        drawStripesPattern(ctx, width, height)
        break
      case 'dots':
        drawDotsPattern(ctx, width, height)
        break
      case 'checker':
        ctx.fillStyle = coverColor
        ctx.fillRect(0, 0, width, height)
        drawCheckerPattern(ctx, width, height)
        break
      case 'diagonal':
        ctx.fillStyle = getPatternGradient(ctx, width, height)
        ctx.fillRect(0, 0, width, height)
        break
      default:
        ctx.fillStyle = coverColor
        ctx.fillRect(0, 0, width, height)
    }
    addNoiseTexture(ctx, width, height)
  }

  function addNoiseTexture(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    for (let x = 0; x < width; x += 4) {
      for (let y = 0; y < height; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2)
        }
      }
    }
  }

  function scratch(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left) * dpr
    const y = (clientY - rect.top) * dpr
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, brushSize * dpr, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  function checkReveal() {
    const canvas = canvasRef.current
    if (!canvas || isRevealed) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparentPixels = 0
    const totalPixels = pixels.length / 4
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++
    }
    if (transparentPixels / totalPixels >= 0.4) {
      setIsRevealed(true)
    }
  }
}
