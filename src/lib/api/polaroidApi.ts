/**
 * Client for the polaroid API.
 */

import type { PolaroidCard } from '@/types'

export interface PolaroidCardPayload {
  image_url: string
  caption?: string | null
  date_tag?: string | null
  back_note?: string | null
  hidden_message?: string | null
  tilt_degrees?: number
  template?: PolaroidCard['template']
  orientation?: PolaroidCard['orientation']
  font_family?: PolaroidCard['font_family']
  font_size?: string
  font_color?: string
  text_alignment?: PolaroidCard['text_alignment']
  stickers?: string[]
}

function url(entryId: string, token: string): string {
  return `/api/entries/${encodeURIComponent(entryId)}/polaroid-cards?token=${encodeURIComponent(token)}`
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') return body.error
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }
  return fallback
}

export const polaroidApi = {
  async list(entryId: string, token: string): Promise<PolaroidCard[]> {
    const res = await fetch(url(entryId, token))
    if (!res.ok) throw new Error(await readError(res, 'Could not load polaroids'))
    return (await res.json()).cards ?? []
  },

  /** Replaces the whole deck; the server runs it in one transaction. */
  async replace(entryId: string, token: string, cards: PolaroidCardPayload[]) {
    const res = await fetch(url(entryId, token), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards }),
    })
    if (!res.ok) throw new Error(await readError(res, 'Could not save polaroids'))
    return res.json()
  },
}

/**
 * Uploads an image and returns the permanent public path for it.
 *
 * A cropped image arrives here as a data URL. Storing that string in
 * image_url would put the whole photo in the database row, so it is uploaded
 * through the media store instead and the row keeps the reference.
 */
export async function uploadPolaroidImage(
  entryId: string,
  token: string,
  dataUrl: string
): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const type = blob.type || 'image/jpeg'
  const file = new File([blob], `polaroid-${Date.now()}.jpg`, { type })

  const form = new FormData()
  form.append('file', file)
  form.append('entry_id', entryId)
  form.append('type', 'image')
  form.append('token', token)

  const res = await fetch('/api/media', { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Could not upload that photo')
  }

  // The public entry route rewrites a null public_url into the permanent
  // streaming path, so a bare storage path is enough here.
  return (await res.json()).media?.storage_path ?? ''
}
