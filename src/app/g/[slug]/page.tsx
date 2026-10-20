import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGiftBySlug, isGiftUnlocked } from '@/app/actions/gifts'
import { ClientReveal, ClientPinEntry } from './client-reveal'

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const gift: any = await getGiftBySlug(slug)
  if (!gift) return { title: 'Gift not found' }
  return {
    title: gift.title,
    description: `A gift from Keepsake for ${gift.recipient_name || 'someone special'}`,
  }
}

export default async function SlugPage({ params }: Params) {
  const { slug } = await params
  const gift: any = await getGiftBySlug(slug)

  if (!gift) notFound()

  if (gift.status !== 'published') {
    return <UnpublishedState />
  }

  const unlocked = await isGiftUnlocked(gift)
  if (!unlocked) {
    return <LockedState gift={gift} />
  }

  return <ClientReveal gift={gift} />
}

function UnpublishedState() {
  return (
    <div className="min-h-screen bg-bg text-text font-body flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-surface border border-line flex items-center justify-center mx-auto mb-4 shadow-btn">
          <span className="text-text-muted">📭</span>
        </div>
        <h1 className="font-display text-3xl font-bold">This gift hasn&rsquo;t been sent yet.</h1>
        <p className="text-text-soft mt-2">The giver hasn&rsquo;t published this gift. Check back later.</p>
      </div>
    </div>
  )
}

function LockedState({ gift }: { gift: any }) {
  return (
    <div className="min-h-screen bg-bg text-text font-body flex items-center justify-center">
      <div className="text-center max-w-md px-5">
        <div className="w-16 h-16 rounded-full bg-surface border border-line flex items-center justify-center mx-auto mb-4 shadow-btn">
          <span className="text-text-muted">🔒</span>
        </div>
        <h1 className="font-display text-3xl font-bold">This gift is locked.</h1>
        <p className="text-text-soft mt-2">
          {gift.unlock_at
            ? `This gift opens on ${new Date(gift.unlock_at).toLocaleDateString()}.`
            : 'Enter the PIN to open this gift.'}
        </p>
        {!gift.unlock_at && (
          <ClientPinEntry giftId={gift.id} />
        )}
      </div>
    </div>
  )
}
