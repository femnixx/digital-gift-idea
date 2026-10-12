'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

/**
 * Shell for the public area.
 *
 * There is no public sign-in or sign-up: gifts are created anonymously and the
 * only login in the product is the admin endpoint at /admin/login, which is
 * not linked from anywhere here.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base text-fg">
      <header className="border-b border-base">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            <span className="font-serif text-lg">Digital Love Letters</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/create" className="text-sm underline">Create</Link>
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
