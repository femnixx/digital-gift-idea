import Link from 'next/link'
import { DemoModeBanner } from '@/components/ui/DemoModeBanner'

export default function HomePage() {
  return (
    <>
      <DemoModeBanner />
      <div className="min-h-screen">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-cream-50 to-lavender-50">
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
            <h1 className="font-script text-5xl md:text-7xl font-light gradient-text mb-6">Digital Love Letters</h1>
            <p className="font-serif text-xl md:text-2xl text-sky-600 mb-10 max-w-2xl mx-auto">A private digital sanctuary where distance disappears.</p>
            <Link href="/admin/entries/new" className="btn-primary group px-8 py-4 text-lg inline-flex items-center gap-2">
              <span>Create Your First Love Letter</span>
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
