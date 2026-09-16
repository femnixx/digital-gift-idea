'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Cropper from 'react-easy-crop'
import { Area } from 'react-easy-crop'
import { Heart, Type, Palette, Sticker, Eye, Edit3, X, Sparkles, Upload, Image, Shuffle, Trash2, Check, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import { db } from '@/lib/storage/localStorageDB'
import type { PolaroidCard as PolaroidCardType, Media } from '@/types'

const PRESET_EMOJIS = [
  { emoji: '❤️', bg: '#fef2f2', name: 'Heart' },
  { emoji: '🌹', bg: '#fff1f2', name: 'Rose' },
  { emoji: '🌻', bg: '#fffbeb', name: 'Sunflower' },
  { emoji: '🌸', bg: '#fdf2f8', name: 'Blossom' },
  { emoji: '💕', bg: '#fdf2f8', name: 'Love' },
  { emoji: '✨', bg: '#fffbeb', name: 'Sparkle' },
  { emoji: '🦋', bg: '#eff6ff', name: 'Butterfly' },
  { emoji: '🌙', bg: '#f8fafc', name: 'Moon' },
  { emoji: '☀️', bg: '#fffbeb', name: 'Sun' },
  { emoji: '🌈', bg: '#f0fdf4', name: 'Rainbow' },
  { emoji: '💐', bg: '#fdf2f8', name: 'Bouquet' },
  { emoji: '🎀', bg: '#fdf2f8', name: 'Ribbon' },
]

const TEMPLATES = [
  { id: 'classic_white', name: 'Classic White', description: 'Clean white frame' },
  { id: 'vintage', name: 'Vintage', description: 'Warm sepia tones' },
  { id: 'black_white', name: 'Black & White', description: 'Monochrome style' },
  { id: 'colorful_border', name: 'Colorful Border', description: 'Rainbow gradient' },
] as const

const FONT_FAMILIES = [
  { id: 'font-handwriting', name: 'Handwriting', class: 'font-handwriting' },
  { id: 'font-serif', name: 'Serif', class: 'font-serif' },
  { id: 'font-script', name: 'Script', class: 'font-script' },
  { id: 'font-sans', name: 'Sans', class: 'font-sans' },
]

const FONT_SIZES = [
  { id: 'text-sm', name: 'Small', size: '0.875rem' },
  { id: 'text-base', name: 'Medium', size: '1rem' },
  { id: 'text-lg', name: 'Large', size: '1.125rem' },
  { id: 'text-xl', name: 'X-Large', size: '1.25rem' },
]

const FONT_COLORS = [
  { id: '#881337', name: 'Rose', color: '#881337' },
  { id: '#1e293b', name: 'Slate', color: '#1e293b' },
  { id: '#78350f', name: 'Brown', color: '#78350f' },
  { id: '#000000', name: 'Black', color: '#000000' },
  { id: '#4b5563', name: 'Gray', color: '#4b5563' },
]

const TEXT_ALIGNMENTS = [
  { id: 'left', name: 'Left', icon: '⯇' },
  { id: 'center', name: 'Center', icon: '⬍' },
  { id: 'right', name: 'Right', icon: '⯈' },
]

const STICKERS = [
  '❤️', '💕', '💖', '💗', '💓', '💘', '💝', '🥰',
  '🌸', '🌷', '🌹', '🌻', '🌼', '💐', '✨', '🌟',
  '💌', '🎀', '🎁', '💫', '🦋', '🌈', '☁️', '💭',
  '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁',
]

interface PolaroidCustomizerProps {
  entryId: string
  card?: PolaroidCardType | null
  onSave: (card: PolaroidCardType) => void
  onCancel?: () => void
}

export function PolaroidCustomizer({
  entryId,
  card,
  onSave,
  onCancel,
}: PolaroidCustomizerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!card

  const [imageSrc, setImageSrc] = useState<string>(card?.image_url || '')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [croppedImage, setCroppedImage] = useState<string>(card?.image_url || '')

  const [caption, setCaption] = useState(card?.caption || '')
  const [dateTag, setDateTag] = useState(card?.date_tag || '')
  const [backNote, setBackNote] = useState(card?.back_note || '')
  const [hiddenMessage, setHiddenMessage] = useState(card?.hidden_message || '')
  const [tiltDegrees, setTiltDegrees] = useState(card?.tilt_degrees ?? 0)

  const [template, setTemplate] = useState<PolaroidCardType['template']>(card?.template || 'classic_white')
  const [orientation, setOrientation] = useState<PolaroidCardType['orientation']>(card?.orientation || 'portrait')
  const [fontFamily, setFontFamily] = useState(card?.font_family || 'font-handwriting')
  const [fontSize, setFontSize] = useState(card?.font_size || 'text-lg')
  const [fontColor, setFontColor] = useState(card?.font_color || '#881337')
  const [textAlignment, setTextAlignment] = useState<PolaroidCardType['text_alignment']>(card?.text_alignment || 'center')
  const [stickers, setStickers] = useState<string[]>(card?.stickers || [])

  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const getCroppedImg = useCallback(async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.addEventListener('load', () => resolve(img))
      img.addEventListener('error', reject)
      img.src = imageSrc
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas context')

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)

    return canvas.toDataURL('image/jpeg', 0.9)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setImageSrc(dataUrl)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handlePresetSelect = (preset: typeof PRESET_EMOJIS[0]) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="${preset.bg}"/>
      <text x="200" y="210" text-anchor="middle" dominant-baseline="central" font-size="160" font-family="serif">${preset.emoji}</text>
    </svg>`
    const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
    setImageSrc(dataUrl)
    setShowCropper(true)
  }

  const handleCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const applyCrop = async () => {
    if (!croppedAreaPixels) return
    const cropped = await getCroppedImg(imageSrc, croppedAreaPixels)
    setCroppedImage(cropped)
    setShowCropper(false)
  }

  const addSticker = (sticker: string) => {
    setStickers(prev => prev.includes(sticker) ? prev.filter(s => s !== sticker) : [...prev, sticker])
  }

  const removeSticker = (sticker: string) => {
    setStickers(prev => prev.filter(s => s !== sticker))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const finalImage = croppedImage || imageSrc || card?.image_url || ''

      if (finalImage && (!card?.image_url || finalImage !== card.image_url)) {
        const mediaId = `media-${Date.now()}`
        const mediaItem = {
          id: mediaId,
          entry_id: entryId,
          type: 'image',
          storage_path: `polaroid/${mediaId}.jpg`,
          public_url: finalImage,
          filename: `polaroid-${Date.now()}.jpg`,
          mime_type: 'image/jpeg',
          size_bytes: null,
          sort_order: 0,
          created_at: new Date().toISOString(),
        }
        db.media.insert(mediaItem as any)
      }

      const savedCard: PolaroidCardType = {
        id: card?.id || `polaroid-${Date.now()}`,
        entry_id: card?.entry_id || entryId,
        image_url: finalImage,
        caption: caption || null,
        date_tag: dateTag || null,
        back_note: backNote || null,
        hidden_message: hiddenMessage || null,
        tilt_degrees: tiltDegrees,
        sort_order: card?.sort_order ?? 0,
        template,
        orientation,
        font_family: fontFamily,
        font_size: fontSize,
        font_color: fontColor,
        text_alignment: textAlignment,
        stickers,
        created_at: card?.created_at || new Date().toISOString(),
      }

      onSave(savedCard)
    } finally {
      setIsSaving(false)
    }
  }

  const getTemplateClasses = () => {
    switch (template) {
      case 'vintage':
        return 'bg-amber-50 border-4 border-amber-200 sepia-[.15]'
      case 'black_white':
        return 'bg-gray-100 border-4 border-gray-700 grayscale'
      case 'colorful_border':
        return 'bg-white'
      default:
        return 'bg-white border-4 border-gray-100'
    }
  }

  const getColorfulBorderWrapper = () => {
    if (template !== 'colorful_border') return null
    return (
      <div className="p-[3px] rounded-xl bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400">
        <div className={`rounded-lg overflow-hidden ${getTemplateClasses().replace('bg-white', '')}`}>
          {renderPreviewContent()}
        </div>
      </div>
    )
  }

  const renderPreviewContent = () => (
    <div className={`${getTemplateClasses()} shadow-xl overflow-hidden ${orientation === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'}`}>
      <div className="relative w-full h-full">
        {croppedImage || imageSrc ? (
          <img src={croppedImage || imageSrc} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
            <span className="text-6xl">📷</span>
          </div>
        )}
        {stickers.length > 0 && (
          <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 flex-wrap px-2 pointer-events-none">
            {stickers.map((sticker, i) => (
              <span key={i} className="text-lg drop-shadow-md">{sticker}</span>
            ))}
          </div>
        )}
      </div>
      <div className={`p-3 pb-6 ${template === 'vintage' ? 'bg-amber-50' : template === 'black_white' ? 'bg-gray-100' : 'bg-white'}`}>
        {caption && (
          <p
            className={`${fontFamily} ${fontSize} leading-relaxed`}
            style={{ color: fontColor, textAlign: textAlignment }}
          >
            {caption}
          </p>
        )}
        {dateTag && (
          <p className="text-xs text-gray-400 text-center tracking-wider uppercase mt-1">
            {new Date(dateTag).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
      <div className="border-b border-sky-100 px-4 sm:px-6 py-4 flex items-center justify-between">
        <h3 className="font-script text-xl gradient-text">
          {isEditing ? 'Edit Polaroid' : 'New Polaroid'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-600 transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-600 transition-colors"
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
              className="space-y-4"
            >
              <div className="text-center">
                <h4 className="font-handwriting text-lg text-rose-600 mb-1">Preview</h4>
                <p className="text-slate-500 text-sm">How your polaroid will look</p>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-xs">
                  {template === 'colorful_border' ? getColorfulBorderWrapper() : renderPreviewContent()}
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
          ) : showCropper ? (
            <motion.div
              key="cropper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="relative w-full aspect-square bg-gray-900 rounded-xl overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={orientation === 'landscape' ? 4 / 3 : 1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>
              <div className="space-y-3">
                <label className="label">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={applyCrop} className="btn-primary flex-1 text-sm">
                    <Check className="w-4 h-4" />
                    Apply Crop
                  </button>
                  <button type="button" onClick={() => setShowCropper(false)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                </div>
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
              {/* Image Upload / Preset Selection */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Image className="w-4 h-4 text-rose-500" />
                  Photo
                </label>
                {croppedImage || imageSrc ? (
                  <div className="relative w-full aspect-square max-w-xs mx-auto rounded-xl overflow-hidden border-2 border-sky-200">
                    <img src={croppedImage || imageSrc} alt="Selected" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageSrc(''); setCroppedImage('') }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCropper(true)}
                      className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-white/90 text-rose-600 text-xs font-medium hover:bg-white transition-colors"
                    >
                      Recrop
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-sky-300 hover:border-rose-400 hover:bg-rose-50 transition-colors aspect-square"
                    >
                      <Upload className="w-6 h-6 text-sky-500" />
                      <span className="text-xs text-slate-600">Upload</span>
                    </button>
                    {PRESET_EMOJIS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 border-sky-100 hover:border-rose-300 hover:bg-rose-50 transition-colors aspect-square"
                        title={preset.name}
                      >
                        <span className="text-3xl">{preset.emoji}</span>
                        <span className="text-xs text-slate-500">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Template Selection */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Palette className="w-4 h-4 text-rose-500" />
                  Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        template === t.id
                          ? 'border-rose-500 bg-rose-50 shadow-sm'
                          : 'border-sky-100 bg-white hover:border-sky-300'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              <div className="space-y-3">
                <label className="label">Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['portrait', 'landscape'] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOrientation(o)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                        orientation === o
                          ? 'border-rose-500 bg-rose-50 shadow-sm'
                          : 'border-sky-100 bg-white hover:border-sky-300'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Type className="w-4 h-4 text-rose-500" />
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="textarea min-h-[100px] resize-y font-handwriting text-lg leading-relaxed"
                />
              </div>

              {/* Font Customization */}
              <div className="space-y-4">
                <label className="label flex items-center gap-2">
                  <Palette className="w-4 h-4 text-rose-500" />
                  Font Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FONT_FAMILIES.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setFontFamily(font.id)}
                      className={`px-3 py-2 rounded-xl border-2 text-sm transition-all ${font.class} ${
                        fontFamily === font.id
                          ? 'border-rose-500 bg-rose-50 shadow-sm'
                          : 'border-sky-100 bg-white hover:border-sky-300'
                      }`}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setFontSize(size.id)}
                      className={`px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                        fontSize === size.id
                          ? 'border-rose-500 bg-rose-50 shadow-sm'
                          : 'border-sky-100 bg-white hover:border-sky-300'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FONT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setFontColor(color.color)}
                      className={`h-10 rounded-xl border-2 transition-all ${
                        fontColor === color.color ? 'border-rose-500 shadow-md ring-2 ring-rose-200' : 'border-transparent hover:border-sky-300'
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={color.name}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {TEXT_ALIGNMENTS.map((align) => (
                    <button
                      key={align.id}
                      type="button"
                      onClick={() => setTextAlignment(align.id as PolaroidCardType['text_alignment'])}
                      className={`px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                        textAlignment === align.id
                          ? 'border-rose-500 bg-rose-50 shadow-sm'
                          : 'border-sky-100 bg-white hover:border-sky-300'
                      }`}
                    >
                      {align.icon} {align.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stickers */}
              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Sticker className="w-4 h-4 text-rose-500" />
                  Stickers
                </label>
                <div className="flex flex-wrap gap-2">
                  {stickers.map((sticker, i) => (
                    <motion.span
                      key={`${sticker}-${i}`}
                      className="w-10 h-10 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-lg cursor-pointer hover:bg-rose-50 hover:border-rose-300 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeSticker(sticker)}
                      title="Click to remove"
                    >
                      {sticker}
                    </motion.span>
                  ))}
                  <button
                    type="button"
                    onClick={() => document.getElementById('sticker-picker')?.classList.toggle('hidden')}
                    className="w-10 h-10 rounded-xl bg-sky-50 border-2 border-dashed border-sky-300 flex items-center justify-center text-sky-500 hover:bg-sky-100 transition-colors"
                    title="Add sticker"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div id="sticker-picker" className="hidden mt-3 p-4 bg-white rounded-xl border border-sky-100 shadow-sm">
                  <div className="grid grid-cols-8 gap-2">
                    {STICKERS.map((sticker) => (
                      <button
                        key={sticker}
                        type="button"
                        onClick={() => addSticker(sticker)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                          stickers.includes(sticker)
                            ? 'bg-rose-100 border-2 border-rose-400'
                            : 'bg-sky-50 hover:bg-sky-100 border border-transparent'
                        }`}
                      >
                        {sticker}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Back Note & Hidden Message */}
              <div className="space-y-3">
                <label className="label">Back Note (shown when flipped)</label>
                <textarea
                  value={backNote}
                  onChange={(e) => setBackNote(e.target.value)}
                  placeholder="Write a note for the back..."
                  className="textarea min-h-[80px] resize-y font-handwriting"
                />
              </div>

              <div className="space-y-3">
                <label className="label flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  Hidden Message (revealed by shaking)
                </label>
                <input
                  type="text"
                  value={hiddenMessage}
                  onChange={(e) => setHiddenMessage(e.target.value)}
                  placeholder="A secret message..."
                  className="input"
                />
              </div>

              {/* Tilt */}
              <div className="space-y-3">
                <label className="label">Tilt: {tiltDegrees}°</label>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  value={tiltDegrees}
                  onChange={(e) => setTiltDegrees(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showPreview && !showCropper && (
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-sky-50/50 border-t border-sky-100">
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
            disabled={isSaving || !(croppedImage || imageSrc)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {isEditing ? 'Update Polaroid' : 'Save Polaroid'}
          </button>
        </div>
      )}
    </div>
  )
}
