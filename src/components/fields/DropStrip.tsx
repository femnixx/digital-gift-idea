'use client'

import { useCallback, useState } from 'react'

interface DropFile {
  id: string
  file: File
  preview: string
  caption: string
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
}

interface DropStripProps {
  files: DropFile[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  onCaptionChange: (id: string, caption: string) => void
  onReorder: (from: number, to: number) => void
  accept?: string
  maxSizeMB?: number
  error?: string
  helper?: string
}

export function DropStrip({
  files,
  onAdd,
  onRemove,
  onCaptionChange,
  onReorder,
  accept = 'image/*',
  maxSizeMB = 10,
  error,
  helper,
}: DropStripProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const dropped = Array.from(e.dataTransfer.files)
      const valid = dropped.filter((f) => {
        if (!f.type.startsWith('image/') && !accept.includes('*')) return false
        if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) return false
        return true
      })
      if (valid.length) onAdd(valid)
    },
    [accept, maxSizeMB, onAdd]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleCaptionChange = useCallback(
    (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      onCaptionChange(id, e.target.value)
    },
    [onCaptionChange]
  )

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-[4px] border-2 border-line transition-all ${
          dragOver
            ? 'bg-accent-soft border-accent'
            : 'bg-surface border-dashed hover:border-accent'
        }`}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={(e) => onAdd(Array.from(e.target.files || []))}
          className="sr-only"
          aria-hidden="true"
        />
        <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h3l5 5 5-5h3a2 2 0 012 2v10a2 2 0 01-2 2H5z" />
        </svg>
        <span className="font-mono text-xs font-medium text-text">Drop photos here or click to browse</span>
        <span className="font-mono text-[10px] text-text-muted">
          {maxSizeMB}MB max per file
        </span>
      </div>
      {files.length > 0 && (
        <div
          role="list"
          aria-label="Photo strip"
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {files.map((file, i) => (
            <div
              key={file.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(i))
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const from = Number(e.dataTransfer.getData('text/plain'))
                onReorder(from, i)
              }}
              className="relative flex-shrink-0 w-40 h-40 rounded-[4px] border border-line bg-accent-soft overflow-hidden group"
            >
              <img
                src={file.preview}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <input
                  type="text"
                  value={file.caption}
                  onChange={(e) => handleCaptionChange(file.id, e)}
                  placeholder="Caption"
                  className="w-full bg-white/90 border-none rounded-sm px-2 py-1 text-[10px] font-mono text-text focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(file.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white text-[10px] hover:bg-black/80 transition-colors"
                aria-label="Remove photo"
              >
                ×
              </button>
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 ${
                  file.status === 'uploading' ? 'bg-accent' : 'bg-line'
                } transition-all`}
                style={{ width: `${file.progress}%` }}
              />
            </div>
          ))}
        </div>
      )}
      {error && (
        <span className="flex items-center gap-1 font-mono text-xs text-danger">
          <span aria-hidden="true">!</span> {error}
        </span>
      )}
      {!error && helper && (
        <span className="font-mono text-xs text-text-muted">{helper}</span>
      )}
    </div>
  )
}
