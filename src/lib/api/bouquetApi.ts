/**
 * Client for the bouquet API.
 *
 * The server stores each flower's placement, so the arrangement survives a
 * refresh and the public view can render the same bouquet the creator built.
 */

import type { BouquetFlower, EntryType, FlowerType } from '@/types'

/** What a caller sends when replacing an arrangement. */
export interface BouquetFlowerPayload {
  flower_type: string
  color: string
  position_x: number
  position_y: number
  rotation: number
  scale: number
  note?: string | null
  generation_seed?: number
}

function url(entryId: string, token: string): string {
  return `/api/entries/${encodeURIComponent(entryId)}/bouquet?token=${encodeURIComponent(token)}`
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

export const bouquetApi = {
  async list(entryId: string, token: string): Promise<BouquetFlower[]> {
    const res = await fetch(url(entryId, token))
    if (!res.ok) throw new Error(await readError(res, 'Could not load bouquet'))
    const body = await res.json()
    return body.flowers ?? []
  },

  /** Replaces the whole arrangement; the server runs it in one transaction. */
  async replace(entryId: string, token: string, flowers: BouquetFlowerPayload[]) {
    const res = await fetch(url(entryId, token), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flowers }),
    })
    if (!res.ok) throw new Error(await readError(res, 'Could not save bouquet'))
    return res.json()
  },
}
