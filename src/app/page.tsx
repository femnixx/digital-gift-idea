import Link from 'next/link'
import { Heart, ArrowRight, Mail, Flower2, Camera, Gamepad2, Music, Coffee } from 'lucide-react'
import { DemoModeBanner } from '@/components/ui/DemoModeBanner'

export default function HomePage() {
  return (
    <>
      <DemoModeBanner />
      <div className="min-h-screen">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-cream-50 to-lavender-50">
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
            <h1 className="font-script text-5xl md:text-7xl font-light gradient-text mb-6">Digital Love Letters</h1>
            <p className="font-serif text-xl md:text-2xl text-rose-600 mb-10 max-w-2xl mx-auto">A private digital sanctuary where distance disappears.</p>
            <Link href="/admin/entries/new" className="btn-primary group px-8 py-4 text-lg inline-flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <span>Create Your First Love Letter</span>
            </Link>
          </div>
        </section>

        <section className="py-20 md:py-32 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-script text-4xl md:text-5xl gradient-text mb-4">Features</h2>
              <p className="text-rose-600 text-lg max-w-2xl mx-auto">Every feature is designed to make your partner feel close.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Digital Bouquet Builder', description: 'Create beautiful bouquets with personalized notes on each stem.', href: '/admin/entries/new?type=bouquet', icon: Flower2, color: 'rose' },
                { title: 'Virtual Polaroid Deck', description: 'Share photos as realistic Polaroids. Flip to read handwritten notes.', href: '/admin/entries/new?type=polaroid', icon: Camera, color: 'blush' },
                { title: 'Scratch Cards', description: 'Hide love notes under scratch-off surfaces.', href: '/admin/entries/new?type=scratch_card', icon: Gamepad2, color: 'lavender' },
                { title: 'Open When Letters', description: 'Create sealed envelopes that unlock on specific dates.', href: '/admin/entries/new?type=open_when', icon: Mail, color: 'sage' },
                { title: 'Voice Notes', description: 'Record audio messages that play on a vintage cassette player.', href: '/admin/entries/new?type=voice_note', icon: Music, color: 'gold' },
                { title: 'Coffee Dates', description: 'Send digital drinks with custom names and gift card links.', href: '/admin/entries/new?type=coffee_date', icon: Coffee, color: 'cream' }
              ].map((feature, index) => (
                <div key={feature.title} className="card-hover p-6 group">
                  <div className={w-14 h-14 rounded-2xl bg--100 text--600 flex items-center justify-center mb-4}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-rose-900 mb-2">{feature.title}</h3>
                  <p className="text-rose-600 mb-4 leading-relaxed">{feature.description}</p>
                  <Link href={feature.href} className="inline-flex items-center gap-2 text-rose-500 font-medium hover:text-rose-600 group">
                    Try it <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 px-6 bg-gradient-to-br from-rose-600 via-rose-700 to-lavender-700 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="font-script text-4xl md:text-5xl text-white mb-6">Ready to bridge the distance?</h2>
            <p className="text-rose-100 text-lg mb-8">Start building your digital love story today.</p>
            <Link href="/admin/entries/new" className="btn bg-white text-rose-600 hover:bg-cream-50 px-10 py-4 text-lg font-semibold shadow-xl inline-flex items-center gap-2 group">
              <Heart className="w-5 h-5" />
              <span>Start Creating</span>
            </Link>
          </div>
        </section>

        <footer className="py-12 px-6 bg-white border-t border-rose-100">
          <div className="max-w-6xl mx-auto text-center">
            <p className="font-script text-2xl gradient-text mb-2">Digital Love Letters</p>
            <p className="text-rose-500 text-sm">Built with 💕 for long-distance love everywhere</p>
          </div>
        </footer>
      </div>
    </>
  )
}