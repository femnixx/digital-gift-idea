'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Type, Palette, Sticker, Eye, Edit3, X, Sparkles } from 'lucide-react'
import type { Entry } from '@/types'

interface LetterEditorProps {
  entry?: Entry | null
  onSave: (content: { message: string }, extra?: Record<string, any>) => void
  onCancel?: () => void
  mode?: 'edit' | 'preview' | 'view'
  showActions?: boolean
  initialContent?: { message?: string; backgroundColor?: string; stickers?: string[]; fontStyle?: string; paperTexture?: string }
}

const BACKGROUND_COLORS = [
  { name: 'Rose', value: 'bg-sky-50', text: 'text-sky-900', preview: 'bg-sky-50' },
  { name: 'Cream', value: 'bg-amber-50', text: 'text-amber-900', preview: 'bg-amber-50' },
  { name: 'Lavender', value: 'bg-lavender-50', text: 'text-lavender-900', preview: 'bg-lavender-50' },
  { name: 'Sage', value: 'bg-sage-50', text: 'text-sage-900', preview: 'bg-sage-50' },
  { name: 'Sky', value: 'bg-sky-50', text: 'text-sky-900', preview: 'bg-sky-50' },
  { name: 'Gold', value: 'bg-gold-50', text: 'text-gold-900', preview: 'bg-gold-50' },
  { name: 'Slate', value: 'bg-slate-100', text: 'text-slate-900', preview: 'bg-slate-100' },
  { name: 'White', value: 'bg-white', text: 'text-slate-900', preview: 'bg-white' },
]

const FONT_STYLES = [
  { name: 'Handwriting', value: 'font-handwriting', label: 'Handwriting', preview: 'font-handwriting' },
  { name: 'Serif', value: 'font-serif', label: 'Serif', preview: 'font-serif' },
  { name: 'Script', value: 'font-script', label: 'Script', preview: 'font-script' },
  { name: 'Sans', value: 'font-sans', label: 'Sans Serif', preview: 'font-sans' },
]

const STICKERS = [
  '❤️', '💕', '💖', '💗', '💓', '💘', '💝', '🥰',
  '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁',
  '🌸', '🌷', '🌹', '🌻', '🌼', '💐', '✨', '🌟',
  '💌', '🎀', '🎁', '💫', '🦋', '🌈', '☁️', '💭',
]

const PAPER_TEXTURES = [
  { name: 'Clean', value: 'none', pattern: 'bg-white' },
  { name: 'Lined', value: 'lined', pattern: 'bg-white' },
  { name: 'Dotted', value: 'dotted', pattern: 'bg-white' },
  { name: 'Grain', value: 'grain', pattern: 'bg-amber-50' },
]

export function LetterEditor({
  entry,
  onSave,
  onCancel,
  mode = 'edit',
  showActions = true,
  initialContent,
}: LetterEditorProps) {
  const existingContent = entry?.content as Record<string, any> | undefined

  const [message, setMessage] = useState(
    initialContent?.message || existingContent?.message || ''
  )
  const [backgroundColor, setBackgroundColor] = useState(
    initialContent?.backgroundColor || 'bg-sky-50'
  )
  const [stickers, setStickers] = useState<string[]>(
    initialContent?.stickers || []
  )
  const [fontStyle, setFontStyle] = useState(
    initialContent?.fontStyle || 'font-handwriting'
  )
  const [paperTexture, setPaperTexture] = useState(
    initialContent?.paperTexture || 'none'
  )
  const [showPreview, setShowPreview] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'message' | 'style'>('message')

  const isReadOnly = mode === 'view'

  const handleSave = () => {
    onSave(
      { message },
      {
        backgroundColor,
        stickers,
        fontStyle,
        paperTexture,
      }
    )
  }

  const addSticker = (sticker: string) => {
    if (isReadOnly) return
    setStickers(prev => prev.includes(sticker) ? prev.filter(s => s !== sticker) : [...prev, sticker])
  }

  const removeSticker = (sticker: string) => {
    setStickers(prev => prev.filter(s => s !== sticker))
  }

  const bgConfig = BACKGROUND_COLORS.find(b => b.value === backgroundColor) || BACKGROUND_COLORS[0]
  const fontConfig = FONT_STYLES.find(f => f.value === fontStyle) || FONT_STYLES[0]

  const renderPaperTexture = (texture: string, bgClass: string) => {
    const baseStyle = `${bgClass} min-h-[400px] p-8 md:p-12`
    switch (texture) {
      case 'lined':
        return `${baseStyle}` + ' ' + '[background-image:linear-gradient(#e5e7eb_1px,transparent_1px);background-size:100%_32px]'
      case 'dotted':
        return `${baseStyle}` + ' ' + '[background-image:radial-gradient(#d1d5db_1.5px,transparent_1.5px);background-size:24px_24px]'
      case 'grain':
        return `${baseStyle} bg-amber-50`
      default:
        return baseStyle
    }
  }

  const renderEditorControls = () => (
    <div className="space-y-6">
      {activeTab === 'message' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <label className="label flex items-center gap-2">
              <Heart className="w-4 h-4 text-sky-500" />
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => !isReadOnly && setMessage(e.target.value)}
              readOnly={isReadOnly}
              placeholder="Write your love letter here... 💕"
              className="textarea min-h-[250px] resize-y font-handwriting text-lg leading-relaxed"
            />
            <p className="text-slate-400 text-xs mt-1">
              {message.length} characters
            </p>
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Sticker className="w-4 h-4 text-sky-500" />
              Stickers & Emojis
            </label>
            <div className="flex flex-wrap gap-2">
              {stickers.map((sticker, i) => (
                <motion.button
                  key={`${sticker}-${i}`}
                  type="button"
                  onClick={() => removeSticker(sticker)}
                  className="w-10 h-10 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-lg hover:bg-sky-50 hover:border-sky-300 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Click to remove"
                >
                  {sticker}
                </motion.button>
              ))}
              <motion.button
                type="button"
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                className="w-10 h-10 rounded-xl bg-sky-50 border-2 border-dashed border-sky-300 flex items-center justify-center text-sky-500 hover:bg-sky-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg">+</span>
              </motion.button>
            </div>

            <AnimatePresence>
              {showStickerPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-white rounded-xl border border-sky-100 shadow-sm"
                >
                  <div className="grid grid-cols-8 gap-2">
                    {STICKERS.map((sticker) => (
                      <motion.button
                        key={sticker}
                        type="button"
                        onClick={() => addSticker(sticker)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                          stickers.includes(sticker)
                            ? 'bg-sky-100 border-2 border-sky-400'
                            : 'bg-sky-50 hover:bg-sky-100 border border-transparent'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {sticker}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {activeTab === 'style' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <label className="label flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-500" />
              Background Color
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BACKGROUND_COLORS.map((color) => (
                <motion.button
                  key={color.value}
                  type="button"
                  onClick={() => !isReadOnly && setBackgroundColor(color.value)}
                  className={`h-10 rounded-xl border-2 transition-all ${color.preview} ${
                    backgroundColor === color.value
                      ? 'border-sky-500 shadow-md ring-2 ring-sky-200'
                      : 'border-transparent hover:border-sky-300'
                  }`}
                  title={color.name}
                  whileHover={isReadOnly ? {} : { scale: 1.1 }}
                  whileTap={isReadOnly ? {} : { scale: 0.95 }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Type className="w-4 h-4 text-sky-500" />
              Font Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FONT_STYLES.map((font) => (
                <motion.button
                  key={font.value}
                  type="button"
                  onClick={() => !isReadOnly && setFontStyle(font.value)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all ${
                    fontStyle === font.value
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-sky-100 bg-white hover:border-sky-300'
                  } ${font.preview}`}
                  whileHover={isReadOnly ? {} : { scale: 1.03 }}
                  whileTap={isReadOnly ? {} : { scale: 0.97 }}
                >
                  {font.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              Paper Texture
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAPER_TEXTURES.map((texture) => (
                <motion.button
                  key={texture.value}
                  type="button"
                  onClick={() => !isReadOnly && setPaperTexture(texture.value)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                    paperTexture === texture.value
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-sky-100 bg-white hover:border-sky-300'
                  }`}
                  whileHover={isReadOnly ? {} : { scale: 1.03 }}
                  whileTap={isReadOnly ? {} : { scale: 0.97 }}
                >
                  {texture.name}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )

  const renderPreview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="absolute top-0 right-0 z-10">
        <motion.button
          type="button"
          onClick={() => setShowPreview(false)}
          className="p-2 rounded-full bg-white/80 backdrop-blur border border-sky-200 shadow-sm text-slate-600 hover:text-sky-500 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="text-center mb-6">
        <h3 className="font-script text-2xl gradient-text mb-1">Preview</h3>
        <p className="text-slate-500 text-sm">How your letter will look</p>
      </div>

      <motion.div
        className={`rounded-2xl shadow-xl overflow-hidden ${renderPaperTexture(paperTexture, bgConfig.value)}`}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`p-8 md:p-12 ${fontConfig.preview} ${bgConfig.text} text-lg md:text-xl leading-relaxed whitespace-pre-wrap min-h-[400px]`}>
          {message ? (
            <>
              {stickers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 text-3xl">
                  {stickers.map((sticker, i) => (
                    <motion.span
                      key={`preview-${sticker}-${i}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05, type: 'spring' }}
                    >
                      {sticker}
                    </motion.span>
                  ))}
                </div>
              )}
              <p>{message}</p>
            </>
          ) : (
            <p className="text-slate-400 italic text-center py-20">
              Your message will appear here...
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )

  if (showPreview) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6 md:p-8">
        {renderPreview()}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
      <div className="border-b border-sky-100 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('message')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'message'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Message</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'style'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Style</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {renderEditorControls()}
      </div>

      {showActions && (
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-sky-50/50 border-t border-sky-100">
          <motion.button
            type="button"
            onClick={() => setShowPreview(true)}
            className="btn-ghost flex items-center gap-2 text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4" />
            Preview
          </motion.button>
          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex items-center gap-2 text-sm ml-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-4 h-4" />
              Cancel
            </motion.button>
          )}
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={!message.trim()}
            className="btn-primary flex items-center gap-2 text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-4 h-4" />
            {entry ? 'Update Letter' : 'Save Letter'}
          </motion.button>
        </div>
      )}
    </div>
  )
}
