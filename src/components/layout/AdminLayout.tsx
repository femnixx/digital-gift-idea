'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart, Plus, Calendar, Image, Music, Gamepad2, Mail, Coffee, Flower2, Camera, Settings, LogOut, ChevronDown } from 'lucide-react'
import { EntryType } from '@/types'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Heart },
    { href: '/admin/entries', label: 'All Entries', icon: Calendar },
    { href: '/admin/entries/new', label: 'Create Entry', icon: Plus },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  const entryTypes: { type: EntryType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { type: 'letter', label: 'Love Letter', icon: Mail },
    { type: 'bouquet', label: 'Digital Bouquet', icon: Flower2 },
    { type: 'polaroid', label: 'Polaroid Deck', icon: Camera },
    { type: 'scratch_card', label: 'Scratch Card', icon: Gamepad2 },
    { type: 'open_when', label: 'Open When', icon: Mail },
    { type: 'voice_note', label: 'Voice Note', icon: Music },
    { type: 'coffee_date', label: 'Coffee Date', icon: Coffee },
  ]

  return (
    <div className="min-h-screen romantic-bg">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 lg:translate-x-0"
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-stone-200 dark:border-stone-700">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-600 dark:text-rose-300" />
              </div>
              <span className="font-script text-xl text-rose-700 dark:text-rose-300">Dashboard</span>
            </Link>
            <p className="text-stone-400 dark:text-stone-500 text-xs mt-2">Digital Love Letters</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-stone-200 dark:border-stone-700">
            <p className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider mb-3">Quick Create</p>
            <div className="grid grid-cols-2 gap-2">
              {entryTypes.slice(0, 4).map((type) => (
                <Link
                  key={type.type}
                  href={`/admin/entries/new?type=${type.type}`}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-stone-50 dark:bg-stone-700/50 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                >
                  <type.icon className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-200">{type.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-stone-200 dark:border-stone-700">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-stone-800 dark:text-stone-200 text-sm">You</p>
                  <p className="text-stone-400 dark:text-stone-500 text-xs">Admin</p>
                </div>
                <ChevronDown className="w-4 h-4 text-stone-400 dark:text-stone-500" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 py-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Link href="/admin/profile" className="flex items-center gap-3 px-4 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700">
                      <Settings className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link href="/" className="flex items-center gap-3 px-4 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700">
                      <Heart className="w-4 h-4" />
                      View Site
                    </Link>
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="lg:pl-64 min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border-b border-stone-200 dark:border-stone-700 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600" />
              <span className="font-script text-lg text-rose-700">Dashboard</span>
            </Link>
            <div className="w-10" />
          </div>
        </header>

        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
