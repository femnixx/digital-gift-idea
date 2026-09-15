import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Mail, Flower2, Camera, Gamepad2, Music, Coffee, Clock, MapPin, Sparkles } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Flower2,
      title: 'Digital Bouquet Builder',
      description: 'Create beautiful bouquets with personalized notes on each stem. Watch them bloom into view.',
      href: '/admin/entries/new?type=bouquet',
      color: 'rose',
    },
    {
      icon: Camera,
      title: 'Virtual Polaroid Deck',
      description: 'Share photos as realistic Polaroids. Flip to read handwritten notes on the back.',
      href: '/admin/entries/new?type=polaroid',
      color: 'blush',
    },
    {
      icon: Gamepad2,
      title: 'Scratch Cards & Games',
      description: 'Hide love notes under scratch-off surfaces. Interactive fun that reveals your heart.',
      href: '/admin/entries/new?type=scratch_card',
      color: 'lavender',
    },
    {
      icon: Mail,
      title: 'Open When... Letters',
      description: 'Create sealed envelopes that unlock on specific dates or when they need you most.',
      href: '/admin/entries/new?type=open_when',
      color: 'sage',
    },
    {
      icon: Music,
      title: 'Voice Notes (Cassette Style)',
      description: 'Record audio messages that play on a vintage cassette player. Nostalgia meets romance.',
      href: '/admin/entries/new?type=voice_note',
      color: 'gold',
    },
    {
      icon: Coffee,
      title: 'Virtual Coffee Dates',
      description: 'Send digital drinks with custom names and gift card links. Cozy moments across timezones.',
      href: '/admin/entries/new?type=coffee_date',
      color: 'cream',
    },
  ]

  const liveFeatures = [
    { icon: Clock, label: 'Timezone Sync', description: 'See both your local times side by side' },
    { icon: MapPin, label: 'Distance Counter', description: 'Real-time distance between your locations' },
    { icon: Sparkles, label: 'Daily Surprises', description: 'New content delivered every day' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-cream-50 to-lavender-50">
        <div className="absolute inset-0 bg-[url('/images/hearts-pattern.svg')] opacity-5" aria-hidden="true" />
        
        <motion.div 
          className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          <motion.div variants={{ hidden: { y: 20 }, visible: { y: 0 } }} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 text-sm font-medium">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              Made with love for long-distance hearts
            </span>
          </motion.div>

          <motion.h1 
            variants={{ hidden: { y: 30 }, visible: { y: 0 } }}
            className="font-script text-5xl md:text-7xl lg:text-8xl font-light gradient-text mb-6 leading-tight"
          >
            Digital Love Letters
          </motion.h1>

          <motion.p 
            variants={{ hidden: { y: 20 }, visible: { y: 0 } }}
            className="font-serif text-xl md:text-2xl text-rose-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A private digital sanctuary where distance disappears. 
            Share letters, bouquets, photos, voice notes, and interactive surprises 
            that arrive like magic on their screen.
          </motion.p>

          <motion.div 
            variants={{ hidden: { y: 20 }, visible: { y: 0 } }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link 
              href="/admin/entries/new"
              className="btn-primary group px-8 py-4 text-lg"
            >
              <Heart className="w-5 h-5" aria-hidden="true" />
              Create Your First Love Letter
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link 
              href="/demo"
              className="btn-secondary px-8 py-4 text-lg"
            >
              View Demo
            </Link>
          </motion.div>

          <motion.div 
            variants={{ hidden: { y: 20 }, visible: { y: 0 } }}
            className="flex flex-wrap justify-center gap-8 text-rose-500 text-sm"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" aria-hidden="true" />
              <span>Built for two</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Zero ads, forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>Works across timezones</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating hearts animation */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-rose-300/30 text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-100, 0, -100],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'linear',
              }}
            >
              ♡
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-script text-4xl md:text-5xl gradient-text mb-4">
              Ways to Say &ldquo;I Love You&rdquo;
            </h2>
            <p className="text-rose-600 text-lg max-w-2xl mx-auto">
              Each feature is designed to make your partner feel close, 
              no matter how many miles separate you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                className="card-hover p-6 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-100 text-${feature.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-rose-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-rose-600 mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <Link 
                  href={feature.href}
                  className="inline-flex items-center gap-2 text-rose-500 font-medium hover:text-rose-600 group"
                >
                  Try it
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Live Features Section */}
      <section className="py-20 md:py-32 px-6 bg-gradient-to-r from-rose-50 to-blush-50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-script text-4xl md:text-5xl gradient-text mb-4">
              Always Connected
            </h2>
            <p className="text-rose-600 text-lg max-w-2xl mx-auto">
              Real-time features that bridge the distance every single day.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {liveFeatures.map((feature, index) => (
              <motion.div
                key={feature.label}
                className="card p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-rose-900 mb-2">
                  {feature.label}
                </h3>
                <p className="text-rose-600 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-6 bg-gradient-to-br from-rose-600 via-rose-700 to-lavender-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hearts-pattern.svg')] opacity-10" aria-hidden="true" />
        
        <motion.div 
          className="relative z-10 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-script text-4xl md:text-5xl text-white mb-6">
            Ready to bridge the distance?
          </h2>
          <p className="text-rose-100 text-lg mb-8">
            Start building your digital love story today. 
            Your partner&apos;s next smile is just a click away.
          </p>
          <Link 
            href="/admin/entries/new"
            className="btn bg-white text-rose-600 hover:bg-cream-50 px-10 py-4 text-lg font-semibold shadow-xl shadow-rose-900/20 group"
          >
            <Heart className="w-5 h-5" aria-hidden="true" />
            Start Creating
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-rose-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-script text-2xl gradient-text mb-2">
            Digital Love Letters
          </p>
          <p className="text-rose-500 text-sm">
            Built with 💕 for long-distance love everywhere
          </p>
          <div className="flex justify-center gap-6 mt-6 text-rose-400">
            <a href="#" className="hover:text-rose-600 transition-colors" aria-label="GitHub">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="#" className="hover:text-rose-600 transition-colors" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}