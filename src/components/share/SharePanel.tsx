'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, Check, QrCode } from 'lucide-react'
import { resolveBaseUrlLocal } from '@/lib/shareLink'

/**
 * Share panel for a published gift: the permanent public link, a copy button,
 * and the QR code that encodes that same link. The QR is a PNG served from the
 * permanent route, so it never goes stale.
 */
export function SharePanel({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${resolveBaseUrlLocal()}/daily/${slug}`)
  }, [slug])

  const qrSrc = `/api/public/entries/${encodeURIComponent(slug)}/qr?size=512`

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [url])

  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-serif text-lg">Share your gift</h2>

      <div className="flex items-center gap-2">
        <input
          readOnly value={url}
          aria-label="Public link"
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 px-3 py-2 rounded-xl bg-base border border-base text-sm font-mono"
        />
        <button onClick={copy} className="btn btn-ghost" aria-label="Copy link">
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-start gap-4">
        <img
          src={qrSrc}
          alt={`QR code linking to /daily/${slug}`}
          width={160}
          height={160}
          className="rounded-xl border border-base"
        />
        <div className="text-sm muted-foreground space-y-1">
          <p className="flex items-center gap-2">
            <QrCode className="w-4 h-4" /> Scan to open the gift
          </p>
          <p>Both the link and this code are permanent.</p>
          <p>
            <a href={qrSrc} download={`qr-${slug}.png`} className="underline">Download QR</a>
          </p>
        </div>
      </div>
    </div>
  )
}
