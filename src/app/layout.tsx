import type { Metadata, Viewport } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SkyBackground } from '@/components/SkyBackground'
import './globals.css'

import '@fontsource/instrument-serif/index.css'
import '@fontsource/figtree/index.css'
import '@fontsource/jetbrains-mono/index.css'
import '@fontsource/caveat/index.css'

// Applied inline in <head> BEFORE first paint so there is no flash.
// Reads localStorage 'theme' (light | dark | system), falls back to system
// which follows prefers-color-scheme. Result stored as data-theme on <html>.
const themeScript = `(function(){try{var s=localStorage.getItem('theme')||'system';var d=s==='dark'||(s==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.dataset.themePref=s;}catch(e){document.documentElement.dataset.theme='light'}})()`;

export const metadata: Metadata = {
  title: { default: 'Keepsake', template: '%s | Keepsake' },
  description: 'Gifts that are opened, not just received. Build a digital gift, wrap it, and send your partner a ceremonial link they can keep forever.',
  keywords: ['digital gift', 'love letter', 'coupon booklet', 'playlist mixtape', 'keepsake drawer', 'romantic gift'],
  authors: [{ name: 'Keepsake' }],
  creator: 'Keepsake',
  publisher: 'Keepsake',
  robots: { index: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://keepsake.love',
    siteName: 'Keepsake',
    title: 'Keepsake',
    description: 'Gifts that are opened, not just received.',
  },
  twitter: { card: 'summary_large_image', title: 'Keepsake', description: 'Gifts that are opened, not just received.' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F9FF' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={['font-body', 'antialiased'].join(' ')}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="theme-color" content="#F5F9FF" />
      </head>
      <body className="min-h-dvh flex flex-col font-body antialiased">
        <SkyBackground />
        <header className="mx-auto w-full max-w-6xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
          <a href="/" className="font-display italic text-3xl text-accent-text" style={{ textDecoration: 'none' }}>
            Keepsake
          </a>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href="/build" className="btn">Make a gift</a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line mt-auto py-8 text-center font-ui text-xs uppercase tracking-[0.18em] text-text-muted">
          Keepsake &middot; Open Sky &middot; noindex by default
        </footer>
      </body>
    </html>
  )
}
