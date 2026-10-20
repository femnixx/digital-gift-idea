import { Metadata } from 'next'
import { sql } from '@/lib/neon/auth'
import { KEEPSAKE_GIFT_LABELS } from '@/types/keepsake'
import type { KeepsakeGift } from '@/types/keepsake'

export const metadata: Metadata = {
  title: 'Keepsake Drawer',
  description: 'Your saved gifts.',
  robots: 'noindex, nofollow',
}

async function listDrawer(): Promise<any[]> {
  const rows = await sql`
    select kd.id, kd.saved_at, g.id as gift_id, g.slug, g.title, g.type, g.note, g.wrap_style, g.status, g.is_published
    from keepsake_drawer kd
    join gifts g on g.id = kd.gift_id
    order by kd.saved_at desc
  `
  return rows
}

export default async function DrawerPage() {
  let items: any[] = []
  try {
    items = await listDrawer()
  } catch {
    items = []
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
        <h1 className="text-4xl font-bold mb-2">Keepsake Drawer</h1>
        <p className="text-[#5A4A3B] mb-10">Gifts you&rsquo;ve opened and saved to keep forever.</p>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-[#E7DAC2]/60 rounded-lg bg-[#FBF6EA] shadow-tactile-card text-center">
            <span className="w-16 h-16 rounded-full bg-[#D9A7A0]/40 flex items-center justify-center mb-4 shadow-tactile-wax">
              <DrawerIcon className="w-8 h-8 text-[#7A1F2B]" />
            </span>
            <p className="text-lg text-[#5A4A3B] mb-6">Your drawer is empty</p>
            <p className="text-sm text-[#5A4A3B] mb-6">Open a gift and save it here to revisit anytime.</p>
            <a href="/" className="btn-tactile px-8 py-3">Browse gifts</a>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <DrawerCard key={item.id} item={item} />
            ))}
          </div>
        )}
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

function DrawerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function DrawerCard({ item }: { item: any }) {
  return (
    <div className="bg-[#FBF6EA] border border-[#E7DAC2] shadow-tactile-card rounded-lg ks-card-edge p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-widest text-[#5A4A3B] font-semibold">{KEEPSAKE_GIFT_LABELS[item.type as keyof typeof KEEPSAKE_GIFT_LABELS] || item.type}</span>
        <span className="text-xs text-[#5A4A3B]">{new Date(item.saved_at).toLocaleDateString()}</span>
      </div>
      <h3 className="font-bold text-[#2B2118] mb-2">{item.title}</h3>
      <p className="text-[#5A4A3B] text-sm mb-4 flex-1">{item.note || ''}</p>
      <a href={`/g/${item.slug}`} className="btn-tactile mt-auto px-4 py-2 text-xs">
        Open again
      </a>
    </div>
  )
}
