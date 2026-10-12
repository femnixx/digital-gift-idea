'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { getUserName, setUserName } from '@/lib/userIdentity'

/**
 * Slim shell for the public area (create flow, my gifts). Deliberately not the
 * admin sidebar: the admin panel is metrics and health only.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setName(getUserName())
    setReady(true)

    fetch('/api/auth/me')
      .then((res) => setAuthed(res.ok))
      .catch(() => setAuthed(false))
  }, [])

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUserName('')
    setName('')
    setAuthed(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-base text-fg">
      <header className="border-b border-base">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            <span className="font-serif text-lg">Digital Love Letters</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {authed ? (
              <>
                <Link href="/gifts" className="text-sm underline">My gifts</Link>
                <span className="text-sm muted-foreground">{ready && name ? `Hi, ${name}` : ''}</span>
                <button onClick={signOut} className="text-sm underline">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm underline">Sign in</Link>
                <Link href="/signup" className="text-sm underline">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
