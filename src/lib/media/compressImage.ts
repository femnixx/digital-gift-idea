'use client'

/**
 * Client-side image preparation for uploads.
 *
 * Runs entirely in the browser via canvas, so there is no native server
 * dependency and no round-trip before the user sees progress. The goal is a
 * much smaller file that still looks right on a phone or desktop: longest edge
 * is capped and quality is reduced only until the byte target is met, then the
 * still under the cap is accepted.
 *
 * Videos are intentionally not re-encoded. Real client-side transcoding needs a
 * WASM ffmpeg build; the browser's own capture/upload path is used instead, and
 * videos are checked for a size ceiling rather than rescaled.
 */

const MAX_LONGEST_EDGE = 2048
const TARGET_BYTES = 3 * 1024 * 1024
const MIN_QUALITY = 0.5
const QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62, MIN_QUALITY]

export interface PreparedImage {
  file: File
  originalBytes: number
  finalBytes: number
  mimeType: string
  compressed: boolean
}

function isImageType(type: string): boolean {
  return /^image\/(jpeg|png|webp)$/i.test(type)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image'))
    }
    img.src = url
  })
}

function toBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })
}

function scaledSize(width: number, height: number, cap: number) {
  const longest = Math.max(width, height)
  if (longest <= cap) return { width, height }
  const ratio = cap / longest
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

function canvasFrom(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

/**
 * Compress an image, keeping the first variant that meets the byte target.
 * PNG stays PNG to preserve transparency; everything else becomes WebP, which
 * is smaller at the same visual quality and supported by every current browser.
 */
export async function prepareImage(input: File): Promise<PreparedImage> {
  if (!isImageType(input.type)) {
    return {
      file: input,
      originalBytes: input.size,
      finalBytes: input.size,
      mimeType: input.type,
      compressed: false,
    }
  }

  const img = await loadImage(input)
  const { width, height } = scaledSize(img.naturalWidth, img.naturalHeight, MAX_LONGEST_EDGE)
  const targetType = input.type === 'image/png' ? 'image/png' : 'image/webp'
  const canvas = canvasFrom(img, width, height)

  let lastBlob: Blob | null = null
  for (const quality of QUALITY_STEPS) {
    const blob = targetType === 'image/png' ? await toBlob(canvas, targetType, 0.92) : await toBlob(canvas, targetType, quality)
    if (!blob) continue

    lastBlob = blob
    if (blob.size <= TARGET_BYTES) {
      return {
        file: new File([blob], input.name.replace(/\.[^.]+$/, targetType === 'image/png' ? '.png' : '.webp'), { type: targetType }),
        originalBytes: input.size,
        finalBytes: blob.size,
        mimeType: targetType,
        compressed: blob.size < input.size,
      }
    }
  }

  // Even the lowest quality is over budget: ship the smallest attempt rather
  // than failing the upload.
  if (lastBlob) {
    return {
      file: new File([lastBlob], input.name.replace(/\.[^.]+$/, targetType === 'image/png' ? '.png' : '.webp'), { type: targetType }),
      originalBytes: input.size,
      finalBytes: lastBlob.size,
      mimeType: targetType,
      compressed: lastBlob.size < input.size,
    }
  }

  throw new Error('Could not compress that image')
}

/** Size ceiling for videos, which are uploaded as captured rather than re-encoded. */
export const MAX_VIDEO_BYTES = 32 * 1024 * 1024

export function verifyVideoSize(file: File): { ok: boolean; reason?: string } {
  if (file.size > MAX_VIDEO_BYTES) {
    return { ok: false, reason: `Video must be under ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB` }
  }
  return { ok: true }
}
