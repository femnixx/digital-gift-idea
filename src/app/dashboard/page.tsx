import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { sql } from '@/lib/neon/auth'
import { KEEPSAKE_GIFT_LABELS } from '@/types/keepsake'
import type { KeepsakeGift } from '@/types/keepsake'

interface Params {
  params: Promise<{}> // placeholder, dashboard is a single route
}

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your gifts and their statuses.',
  robots: 'noindex, nofollow',
}

async function listGifts(): Promise<KeepsakeGift[]> {
  const rows = await sql`
    select id, slug, slug_is_custom, title, recipient_name, type, note,
           wrap_style, unlock_at, pin_hash, status, is_published, noindex,
           social_opt_in, published_at, created_at, updated_at
    from gifts
    order by created_at desc
  `
  return rows as KeepsakeGift[]
}

export default async function DashboardPage() {
  // In MVP there is no giver auth yet; show an empty state pointing to build.
  const gifts: KeepsakeGift[] = []
  try {
    const loaded = await listGifts()
    if (loaded.length) return <DashboardGifts gifts={loaded} />
  } catch {
    // Table may not exist yet
  }

  return (
    <div className="min-h-screen table-surface text-[#2B2118] font-serif p-6">
      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <LinkGift href="/" className="text-3xl font-bold text-[#7A1F2B] tracking-tighter italic" style={{ textDecoration: 'none' }}>
          Keepsake
        </LinkGift>
        <a href="/build" className="btn-tactile-oxblood text-white px-6 py-2">
          Make a gift
        </a>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Your gifts</h1>
        <p className="text-[#5A4A3B] mb-10">Create your first gift to see it here.</p>
        <div className="flex flex-col items-center justify-center py-20 border-2 border-[#E7DAC2]/60 rounded-lg bg-[#FBF6EA] shadow-tactile-card text-center">
          <span className="w-16 h-16 rounded-full bg-[#D9A7A0]/40 flex items-center justify-center mb-4 shadow-tactile-wax">
            <GiftIcon className="w-8 h-8 text-[#7A1F2B]" />
          </span>
          <p className="text-lg text-[#5A4A3B] mb-6">No gifts yet</p>
          <a href="/build" className="btn-tactile-oxblood text-white px-8 py-3">
            Make your first gift
          </a>
        </div>
      </main>
    </div>
  )
}

function LinkGift({ children, href, className, style }: { children: React.ReactNode; href: string; className?: string; style?: React.CSSProperties }) {
  return (
    <a href={href} className={className} style={{ textDecoration: 'none', color: 'inherit', ...style }}>
      {children}
    </a>
  )
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function DashboardGifts({ gifts }: { gifts: KeepsakeGift[] }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2">Your gifts</h1>
      <p className="text-[#5A4A3B] mb-10">Track status, edit, unpublish or change the slug.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E7DAC2]">
              <th className="pb-3 text-xs uppercase tracking-widest text-[#5A4A3B] font-semibold">Gift</th>
              <th className="pb-3 text-xs uppercase tracking-widest text-[#5A4A3B] font-semibold">Type</th>
              <th className="pb-3 text-xs uppercase tracking-widest text-[#5A4A3B] font-semibold">Status</th>
              <th className="pb-3 text-xs uppercase tracking-widest text-[#5A4A3B] font-semibold">Published</th>
              <th className="pb-3 text-xs uppercase tracking-widest text-[#5A4A3B] font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((g) => (
              <tr key={g.id} className="border-b border-[#E7DAC2]/40 bg-[#FBF6EA] shadow-tactile-card ks-card-edge hover:bg-[#E7DAC2]/30 transition-colors">
                <td className="py-4 font-semibold text-[#2B2118]">{g.title}</td>
                <td className="py-4 text-[#5A4A3B]">{KEEPSAKE_GIFT_LABELS[g.type as keyof typeof KEEPSAKE_GIFT_LABELS] || g.type}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${
                    g.status === 'published' ? 'border-[#7A1F2B]/40 bg-[#7A1F2B]/10 text-[#7A1F2B]' :
                    g.status === 'scheduled' ? 'border-[#2F4A3A]/40 bg-[#2F4A3A]/10 text-[#2F4A3A]' :
                    g.status === 'draft' ? 'border-[#5A4A3B]/40 bg-[#5A4A3B]/10 text-[#5A4A3B]' :
                    'border-[#9A2E3E]/40 bg-[#9A2E3E]/10 text-[#9A2E3E]'
                  }`}>
                    {g.status}
                  </span>
                </td>
                <td className="py-4 text-[#5A4A3B] text-xs">{g.published_at ? new Date(g.published_at).toLocaleDateString() : '—'}</td>
                <td className="py-4">
                  <div className="flex gap-2">
                    <a href={`/g/${g.slug}`} className="btn-tactile text-xs px-3 py-1.5">View</a>
                    <button className="btn-tactile text-xs px-3 py-1.5">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
