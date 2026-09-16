import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, Dancing_Script } from 'next/font/google'
import { DemoInitializer } from '@/lib/demo/DemoDataProvider'
import { DemoModeBanner } from '@/components/ui/DemoModeBanner'
import './globals.css'

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const dancing = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Digital Love Letters',
    template: '%s | Digital Love Letters',
  },
  description: 'A romantic digital space for long-distance love.',
  keywords: ['long-distance relationship', 'love letters', 'digital gifts', 'romantic', 'couples'],
  authors: [{ name: 'You' }],
  creator: 'You',
  publisher: 'Digital Love Letters',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'Digital Love Letters',
    title: 'Digital Love Letters',
    description: 'A romantic digital space for long-distance love',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Digital Love Letters',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Love Letters',
    description: 'A romantic digital space for long-distance love',
    images: ['/images/og-image.png'],
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f9ff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c4a6e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${dancing.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-cream-50 text-sky-900">
        <DemoInitializer />
        {children}
        <DemoModeBanner />
      </body>
    </html>
  )
}