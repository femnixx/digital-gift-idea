'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart, Plus, Search, Filter, Calendar, Image, Music, Gamepad2, Mail, Coffee, Flower2, Camera, Settings, LogOut, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
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
    { type: 'open_when', label: 'Open When Letter', icon: Mail },
    { type: 'voice_note', label: 'Voice Note', icon: Music },
    { type: 'coffee_date', label: 'Coffee Date', icon: Coffee },
  ]

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-rose-100 lg:translate-x-0"
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-rose-100">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-lavender-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="font-script text-xl gradient-text">Admin</span>
            </Link>
            <p className="text-rose-400 text-xs mt-2">Digital Love Letters</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Create */}
          <div className="p-4 border-t border-rose-100">
            <p className="text-rose-500 text-xs uppercase tracking-wider mb-3">Quick Create</p>
            <div className="grid grid-cols-2 gap-2">
              {entryTypes.slice(0, 4).map((type) => (
                <Link
                  key={type.type}
                  href={`/admin/entries/new?type=${type.type}`}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <type.icon className="w-6 h-6 text-rose-500" />
                  <span className="text-xs font-medium text-rose-700">{type.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="p-4 border-t border-rose-100">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-lavender-400 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-rose-900 text-sm">You</p>
                  <p className="text-rose-400 text-xs">Admin</p>
                </div>
                <ChevronDown className="w-4 h-4 text-rose-400" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-rose-100 py-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Link href="/admin/profile" className="flex items-center gap-3 px-4 py-2 text-rose-600 hover:bg-rose-50">
                      <Settings className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link href="/" className="flex items-center gap-3 px-4 py-2 text-rose-600 hover:bg-rose-50">
                      <Heart className="w-4 h-4" />
                      View Site
                    </Link>
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-rose-500 hover:bg-rose-50">
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

      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-rose-100 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-rose-50 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500" />
              <span className="font-script text-lg gradient-text">Admin</span>
            </Link>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}