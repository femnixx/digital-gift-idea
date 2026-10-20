# Keepsake — Digital Gifts for Your Partner

A website where people create, personalize, and send digital gifts to their partner — gifts that are opened, kept, and revisited, not just a link to a store.

## Product

**Working name:** Keepsake

The giver builds a gift in minutes, wraps it, and hits **Publish**. Publishing generates a **slug** that turns the gift into a live, public link (`/g/<slug>`). The partner unwraps it in a ceremonial reveal and saves it to a personal **Keepsake Drawer**.

## Art direction: Tactile Classic

Real paper, card, wax, brass and ribbon. Depth from physical layering under a single top-left light source — contact shadow + cast shadow, visible card edges, paper grain texture, embossed details, slight rotations, taped/pinned overlaps. No gradients, no glassmorphism, no glow, no emoji icons.

Palette: paper `#F3EBDD`, ink `#2B2118`, oxblood `#7A1F2B`, forest `#2F4A3A`, brass `#B08A3E`, blush `#D9A7A0`, navy-ink `#1F2A44`.

## Build order (per spec)

1. **Design system** — `src/app/design-system.css`, `src/app/globals.css` tokens, signature components (`WaxSeal`, `Ribbon`, `GiftTag`, `Parcel`)
2. **Reveal / Unwrap page** — `src/app/g/[slug]/page.tsx`, `src/components/reveal/UnwrapCeremony.tsx`
3. **Builder** — `src/components/builder/GiftBuilder.tsx` + all 5 gift types
4. **Publish flow** — slug generation (auto + custom), `/g/<slug>` public route, PIN, scheduled unlock, unpublish
5. **Keepsake Drawer + Reply** — `src/app/drawer/page.tsx`, `src/app/reply/[token]/page.tsx`
6. **Dashboard** — `src/app/dashboard/page.tsx`
7. Remaining gift viewers + Phase 2 features

## File structure (new Keepsake code)

```
src/
  app/
    globals.css                 # existing + Keepsake tokens
    design-system.css           # NEW: Tactile Classic tokens, shadows, textures
    layout.tsx                  # Keepsake metadata + fonts
    page.tsx                    # NEW: Landing desk scene
    build/page.tsx              # Gift Builder entry
    g/[slug]/page.tsx           # Public reveal page (+ slug redirect)
    g/[slug]/og/route.ts        # NEW: Open Graph preview image per gift
    dashboard/page.tsx          # NEW: Gift list, statuses, actions
    drawer/page.tsx             # NEW: Keepsake Drawer
    reply/[token]/page.tsx      # NEW: Reply / thank-you card
    api/
      gifts/route.ts            # NEW: Create gift (slug gen, PIN, publish)
      gifts/check/route.ts      # NEW: Live slug availability check
      gifts/[id]/route.ts       # NEW: Update / unpublish gift
      gifts/[slug]/route.ts     # NEW: Public gift fetch (PIN + lock logic)
      gifts/[slug]/og/route.ts  # NEW: OG image generator
      replies/route.ts          # NEW: Submit a reply
  components/
    parcel/
      WaxSeal.tsx               # NEW: raised seal, cracks on open
      Ribbon.tsx                # NEW: draggable ribbon, keyboard alt
      GiftTag.tsx               # NEW: swaying tag
      Parcel.tsx                # NEW: layered wrapped box
    reveal/
      UnwrapCeremony.tsx        # NEW: sealed → unwrapping → revealed stages
    builder/
      GiftBuilder.tsx           # NEW: 5-step wizard
      types.ts                  # NEW: BuilderState
    views/                      # per-type gift viewers (to build)
  lib/
    slugs.ts                    # NEW: generate/sanitize/validate slugs
  types/
    keepsake.ts                 # NEW: Keepsake data model types
  types/index.ts                # extended with new EntryType values
```

## Database migrations

`database/migrations/0004_keepsake_gifts.sql` — gifts, gift_items, reveals, replies, keepsake_drawer, coupon_redemptions, slug_history.

## Tech stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Framer Motion (unwrap timeline)
- Postgres via `@neondatabase/serverless` (the `sql` tagged template)
- Magic-link auth for givers; no account to view a gift

## Setup

1. Copy `.env.example` to `.env.local` and fill in `NEON_DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `JWT_SECRET`.
2. Run the Keepsake migration:
   ```
   psql "$DATABASE_URL" < database/migrations/0004_keepsake_gifts.sql
   ```
   (or via your Neon/Supabase SQL editor)
3. Install dependencies: `npm install`
4. Run dev: `npm run dev` (runs on port 3001)
5. Typecheck: `npm run typecheck` | Lint: `npm run lint`

## Environment variables

- `NEON_DATABASE_URL` — Postgres connection string
- `NEXT_PUBLIC_APP_URL` — public base URL (e.g. `http://localhost:3001`)
- `JWT_SECRET` — session signing secret

## Notes

- Auto-generated slugs are 12 chars with hyphens every 4 (e.g. `x7k2-m9qa-p3n8`) to resist guessing.
- `noindex` by default; `social_opt_in` opts a gift into search/social visibility.
- PINs are SHA-256 hashed; the hash is never sent to the client.
- Published gifts are reachable by anyone with the link — treat the slug as the access key.

## Phase 2 (per spec)

Open-When Letters, Countdown Gifts, Scavenger Hunt / Treasure Map, "How well do you know me?" Quiz, Date Night Generator, Timeline of Us, Voice & Video notes, Collaborative gifts, Gift pairing.
