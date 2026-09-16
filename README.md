# 💕 Digital Love Letters

> *A romantic digital sanctuary where distance disappears. Built for two hearts beating across timezones.*

![Digital Love Letters](https://img.shields.io/badge/Made%20with-💕-ff69b4?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=for-the-badge&logo=supabase)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055ff?style=for-the-badge&logo=framer)

---

## ✨ The Story

When you're in a long-distance relationship, every message counts. Every photo shared, every voice note sent, every "thinking of you" matters. But sometimes text messages feel... temporary. Fleeting. 

**Digital Love Letters** changes that. It's your private corner of the internet where you can create lasting, interactive, beautiful surprises for your person. A digital bouquet that blooms when they open it. A Polaroid they can flip to read your handwritten note on the back. A scratch card hiding "I love you more than coffee." An envelope sealed until their birthday. A virtual coffee date with a real gift card.

Because love shouldn't have a character limit. 💌

---

## 🌹 Features

### 💐 Digital Bouquet Builder
Create living bouquets stem by stem. Choose flowers (roses, sunflowers, tulips, lavender...), pick colors, attach secret notes to each bloom. When they open it, the bouquet assembles itself with spring physics. Click any flower → read its hidden message.

### 📸 Virtual Polaroid Deck
Upload photos → they become realistic Polaroids with slight tilts, white borders, captions, dates. Click to flip → your handwritten note on the back. Shake/drag → reveal a hidden message. Nostalgia in digital form.

### 🎮 Scratch Cards
Cover a photo or love note with a scratch-off surface. They scratch with mouse/finger → glitter particles reveal what's underneath. Confetti bursts when fully revealed. Pure joy.

### 💌 Open When... Letters
Create sealed envelopes: *"Open when you miss me"*, *"Open on your birthday"*, *"Open when you're sad"*, *"Open when you get the job"*. Unlock by date, manually, or by mood. Beautiful wax seals, custom colors.

### 🎵 Cassette Player Voice Notes
Record audio → it plays on a vintage cassette tape. Wheels spin, tape moves, VU meters dance. Side A / Side B. Transcripts included. Nostalgia meets modern audio.

### ☕ Virtual Coffee Dates
Pick a drink (latte, matcha, chai, hot chocolate...), name it ("Carmen's Cozy Caramel Latte"), add a message, attach a gift card link. They "redeem" it → animation plays → real coffee delivered.

### 🌍 Timezone Clock & Distance Counter
See both your local times side by side. Real-time distance in km/miles. Anniversary countdown. Day/night indicators. "3 hours apart, 8,947 km, forever connected."

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS (custom romantic palette) |
| **Animations** | Framer Motion |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage (images, audio) |
| **Forms** | React Hook Form + Zod |
| **State** | Zustand |
| **Icons** | Lucide React |
| **Fonts** | Playfair Display, Dancing Script, Great Vibes, Inter |
| **Date/Time** | date-fns + date-fns-tz |
| **Confetti** | canvas-confetti |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- pnpm (recommended) or npm

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/digital-love-letters
cd digital-love-letters
pnpm install
```

### 2. Set Up Supabase
1. Create a new Supabase project
2. Go to SQL Editor → Run the schema from `database/schema.sql`
3. Create a Storage bucket named `media` (public)
4. Enable RLS on all tables (schema handles this)
5. Copy your project URL and anon key

### 3. Configure Environment
```bash
cp .env.example .env.local
```

Fill in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
digital-love-letters/
├── database/
│   └── schema.sql              # Complete PostgreSQL schema
├── public/
│   ├── fonts/                  # Local font files (optional)
│   └── images/                 # Static images, patterns
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, register pages
│   │   ├── (dashboard)/        # Admin layout + pages
│   │   │   └── admin/
│   │   │       ├── page.tsx    # Dashboard
│   │   │       ├── entries/    # Entry management
│   │   │       └── settings/   # Relationship settings
│   │   ├── api/
│   │   │   ├── entries/        # CRUD for entries
│   │   │   ├── media/          # Upload/delete media
│   │   │   └── public/         # Public read APIs
│   │   ├── daily/[slug]/       # Date-based public pages
│   │   ├── letter/[slug]/      # Custom slug public pages
│   │   ├── layout.tsx          # Root layout + fonts
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Global styles + animations
│   ├── components/
│   │   ├── features/           # Interactive components
│   │   │   ├── DigitalBouquet.tsx
│   │   │   ├── PolaroidDeck.tsx
│   │   │   ├── ScratchCard.tsx
│   │   │   ├── OpenWhenLetters.tsx
│   │   │   ├── CassettePlayer.tsx
│   │   │   ├── CoffeeDate.tsx
│   │   │   └── TimezoneClock.tsx
│   │   ├── layout/             # Layout components
│   │   │   └── AdminLayout.tsx
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   └── supabase/           # Supabase clients
│   ├── types/                  # TypeScript types
│   └── utils/                  # Helper functions
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🎨 Customization

### Colors (Tailwind)
Edit `tailwind.config.js` → `theme.extend.colors`:
- `rose` - Primary romantic red/pink
- `blush` - Soft pinks
- `lavender` - Dreamy purples
- `sage` - Natural greens
- `cream` - Warm neutrals
- `gold` - Accent warmth

### Fonts
Change in `src/app/layout.tsx`:
- `font-sans` → UI text (Inter)
- `font-serif` → Headings (Playfair Display)
- `font-handwriting` → Notes (Dancing Script)
- `font-script` → Titles (Great Vibes)

### Flower Types
Add to `src/types/index.ts` → `FLOWER_CONFIG`

### Drink Types
Add to `src/types/index.ts` → `DRINK_CONFIG`

---

## 🔐 Security

- **Row Level Security** on all tables
- **Auth required** for admin routes
- **Public entries** only accessible when `is_published=true` AND `publish_at <= now`
- **Media access** tied to entry ownership
- **No secrets** in client bundle

---

## 📱 Deployment

### Vercel (Recommended)
```bash
pnpm build
vercel deploy
```
Add environment variables in Vercel dashboard.

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 💝 For Your Person

When you deploy, share the link with a note:

> *"I built this for us. Every page, every animation, every feature — made thinking of you. Open it whenever you need to feel close. No matter the distance, this is our place. 💕"*

---

## 🤝 Contributing

This is a personal project, but if you want to fork it for your own love story:

1. Fork the repo
2. Customize the colors, fonts, content
3. Deploy your own version
4. Share with your person

**Make it yours.** That's the whole point.

---

## 📜 License

MIT License — Use it for love. 💕

---

## 💌 A Note from the Creator

> *Built during late nights missing someone 8,947 km away. Every component was coded with a specific moment in mind: the bouquet for our anniversary, the Polaroids for our trips, the scratch cards for bad days, the coffee dates for Sunday mornings, the voice notes for when text isn't enough, the "open when" letters for the times I can't be there.*
>
> *If you're in a long-distance relationship: it gets better. The distance is temporary. The love is not.*
>
> *— Made with 💕 for my person, and now for yours.*

---

<div align="center">

**[⭐ Star this repo](https://github.com/yourusername/digital-love-letters) if it made you smile**

*Built with Next.js, Supabase, Framer Motion, and a lot of love.*

</div>