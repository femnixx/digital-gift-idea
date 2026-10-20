import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/neon/auth'
import { ReplyForm } from './reply-form'

interface Params {
  params: Promise<{ token: string }>
}

export const metadata: Metadata = {
  title: 'Reply',
  description: 'Send a thank-you message back to the giver.',
  robots: 'noindex, nofollow',
}

async function getGiftByReplyToken(token: string) {
  const rows = await sql`
    select g.id, g.slug, g.title, g.type, g.note, g.recipient_name
    from gifts g
    where g.id = ${token}::uuid
    limit 1
  `
  return rows[0] || null
}

export default async function ReplyPage({ params }: Params) {
  const { token } = await params
  const gift = await getGiftByReplyToken(token)

  if (!gift) return notFound()

  return (
    <div className="min-h-screen bg-bg text-text font-body p-6">
      <nav className="max-w-5xl mx-auto px-5 py-6 flex items-center justify-between">
        <a href="/" className="font-display italic text-3xl text-accent-text" style={{ textDecoration: 'none' }}>
          Keepsake
        </a>
        <a href={`/g/${gift.slug}`} className="btn text-xs px-4 py-2">
          Back to gift
        </a>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-12">
        <ReplyForm gift={gift} token={token} />
      </main>
    </div>
  )
}
