'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Plus, Calendar, Settings, LogOut, ChevronDown, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { QuickCreate } from '@/components/layout/QuickCreate'
import { useColorTheme } from '@/lib/theme'

function DarkModeToggle() {
  const { theme, toggleTheme } = useColorTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-base/50 transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="w-5 h-5 gold" /> : <Moon className="w-5 h-5 muted" />}
    </button>
  )
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userName, setUserName] = useState('You')

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.display_name) {
          setUserName(user.user_metadata.display_name)
        } else if (user?.email) {
          setUserName(user.email.split('@')[0])
        }
      } catch {}
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Heart },
    { href: '/admin/entries', label: 'All Entries', icon: Calendar },
    { href: '/admin/diaries', label: 'Love Diaries', icon: Heart },
    { href: '/admin/entries/new', label: 'Create Entry', icon: Plus },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-base">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-base transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-base">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-card border border-base flex items-center justify-center">
                <Heart className="w-5 h-5 accent" />
              </div>
              <span className="font-script text-xl accent">Dashboard</span>
            </Link>
            <p className="muted-foreground text-xs mt-2">Digital Love Letters</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg muted hover:bg-base/50 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-base">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-base/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-card border border-base flex items-center justify-center">
                  <Heart className="w-5 h-5 accent" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{userName}</p>
                  <p className="muted-foreground text-xs">Admin</p>
                </div>
                <ChevronDown className="w-4 h-4 muted-foreground" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-base rounded-xl py-2 z-50">
                  <Link href="/admin/profile" className="flex items-center gap-3 px-4 py-2 muted hover:bg-base/50">
                    <Settings className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2 muted hover:bg-base/50">
                    <Heart className="w-4 h-4" />
                    View Site
                  </Link>
                  <div className="border-t border-base my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2 muted-foreground hover:bg-base/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64 min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-base lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-base/50 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <Heart className="w-5 h-5 accent" />
              <span className="font-script text-lg accent">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <DarkModeToggle />
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          <QuickCreate />
          {children}
        </main>
      </div>
    </div>
  )
}
