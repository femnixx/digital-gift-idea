/**
 * Client for the scratch card API.
 *
 * A gift has one scratch card, so the write is a replace.
 */

export interface ScratchCardPayload {
  cover_color: string
  cover_image_url?: string | null
  reveal_content: {
    type: 'text' | 'image' | 'letter' | 'coupon' | 'custom'
    content: string
    title?: string
  }
  scratch_threshold?: number
}

function url(entryId: string, token: string): string {
  return `/api/entries/${encodeURIComponent(entryId)}/scratch-card?token=${encodeURIComponent(token)}`
}

/**
 * Reads a failure into something a person can act on.
 *
 * The API returns a Zod issue object as `error` on a validation failure, not a
 * string, so checking only for a string fell through to the generic fallback
 * and a 400 became "Could not save scratch card" with no reason attached.
 */
async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') return body.error
    if (body?.error && typeof body.error === 'object') {
      const fields = body.error.fieldErrors || {}
      const messages = Object.entries(fields)
        .flatMap(([field, issues]) => (issues as string[]).map((issue) => `${field}: ${issue}`))
      if (messages.length > 0) return messages.join(', ')
    }
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }
  return `${fallback} (${res.status})`
}

export const scratchCardApi = {
  async get(entryId: string, token: string) {
    const res = await fetch(url(entryId, token))
    if (!res.ok) throw new Error(await readError(res, 'Could not load scratch card'))
    return (await res.json()).card ?? null
  },

  async replace(entryId: string, token: string, card: ScratchCardPayload) {
    const res = await fetch(url(entryId, token), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card }),
    })
    if (!res.ok) throw new Error(await readError(res, 'Could not save scratch card'))
    return res.json()
  },
}
