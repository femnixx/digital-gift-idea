'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Save, User, Bell, Shield, Globe, Palette, CheckCircle2 } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'

export default function AdminSettingsPage() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('love-letters-theme') === 'dark'
    setDarkMode(isDark)
  }, [])

  const [notifications, setNotifications] = useState(true)
  const [publicProfile, setPublicProfile] = useState(true)
  const [timezone, setTimezone] = useState('UTC')
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [show2faModal, setShow2faModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  const handleSave = () => {
    setSaved(true)
    showToast('Settings saved successfully')
    setTimeout(() => { setSaved(false); setToast(null) }, 2000)
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
          <h1 className="font-script text-3xl md:text-4xl text-sky-700">Settings</h1>
          <p className="text-stone-600 mt-1">Manage your preferences and account</p>
        </div>

        <section className="space-y-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <User className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">Profile</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Display Name</label>
                <input type="text" defaultValue="You" className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" defaultValue="demo@loveletters.app" className="input" disabled />
              </div>
              <div>
                <label className="label">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">Notifications</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-700 dark:text-stone-300">Email notifications</span>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5 rounded border-stone-300 text-sky-600 focus:ring-sky-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-700 dark:text-stone-300">Public profile</span>
                <input
                  type="checkbox"
                  checked={publicProfile}
                  onChange={(e) => setPublicProfile(e.target.checked)}
                  className="w-5 h-5 rounded border-stone-300 text-sky-600 focus:ring-sky-500"
                />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">Appearance</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-700 dark:text-stone-300">Dark mode</span>
                <button
                  onClick={() => {
                    const next = !darkMode
                    if (next) {
                      document.documentElement.classList.add('dark')
                      localStorage.setItem('love-letters-theme', 'dark')
                    } else {
                      document.documentElement.classList.remove('dark')
                      localStorage.setItem('love-letters-theme', 'light')
                    }
                    setDarkMode(next)
                    showToast(next ? 'Dark mode' : 'Light mode')
                  }}
                  className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-sky-500' : 'bg-stone-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white mt-1 ml-1 transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
                </button>
              </label>
              <div>
                <label className="label">Accent Color</label>
                <div className="flex gap-3">
                  {['#0284c7', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'].map((c) => (
                    <button
                      key={c}
                      onClick={() => showToast('Accent color updated')}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: c, borderColor: darkMode ? '#333' : '#e5e7eb' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">Privacy & Security</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Two-Factor Authentication</label>
                <p className="text-sm text-stone-500 mb-2">Add an extra layer of security to your account</p>
                <button
                  onClick={() => setShow2faModal(true)}
                  className="btn-secondary text-sm"
                >
                  Enable 2FA
                </button>
              </div>
              <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
            {saved && (
              <span className="text-green-600 text-sm">Settings saved successfully</span>
            )}
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast">
          <div className="bg-sky-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}

      {show2faModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShow2faModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-script text-xl text-sky-700 mb-4">Enable Two-Factor Authentication</h3>
            <p className="text-stone-500 text-sm mb-6">Scan the QR code with your authenticator app to enable 2FA.</p>
            <div className="w-40 h-40 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center mx-auto mb-6">
              <span className="text-stone-400 text-xs">QR Code</span>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShow2faModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => { setShow2faModal(false); showToast('2FA enabled'); handleSave() }} className="btn-primary text-sm">Enable</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-script text-xl text-rose-600 mb-4">Delete Account</h3>
            <p className="text-stone-500 text-sm mb-6">Are you sure? This will permanently delete all your entries and data.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => { setShowDeleteConfirm(false); showToast('Account deleted') }} className="btn-primary text-sm bg-rose-600 hover:bg-rose-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
