'use client'

import { useState } from 'react'
import { User, Mail, MapPin, Clock, Save, Heart, Upload, CheckCircle2 } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'

export default function AdminProfilePage() {
  const [displayName, setDisplayName] = useState('You')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  const handleSave = () => {
    setSaved(true)
    showToast('Profile saved successfully')
    setTimeout(() => { setSaved(false); setToast(null) }, 2000)
  }

  const handleAvatarUpload = () => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      showToast('Avatar updated')
    }, 800)
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
          <h1 className="font-script text-3xl md:text-4xl text-accent">Profile</h1>
          <p className="text-text mt-1">Your love story settings</p>
        </div>

        <div className="bg-card rounded-xl border-card-border overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-accent to-accent-2 relative">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute text-white/40 text-2xl"
                  style={{ left: `${5 + i * 8}%`, top: `${Math.random() * 60}%` }}
                >
                  ♡
                </span>
              ))}
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-card bg-accent/10 flex items-center justify-center shadow-lg">
                <User className="w-16 h-16 text-accent" />
              </div>
              <button
                onClick={handleAvatarUpload}
                disabled={uploading}
                className="absolute bottom-2 right-2 p-2 rounded-full bg-card border-card-border hover:bg-base-2 transition-colors"
              >
                {uploading ? (
                  <span className="block w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-text" />
                )}
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-accent" />
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent" />
                  Email
                </label>
                <input type="email" value="demo@loveletters.app" disabled className="input" />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where are you?"
                  className="input"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your partner about yourself..."
                  className="textarea min-h-[120px]"
                />
              </div>

              <div>
                <label className="label">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saved ? 'Saved!' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border-card-border p-6">
          <h2 className="font-serif text-xl font-semibold text-text mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent" />
            Relationship Info
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted">Anniversary</p>
              <p className="font-medium text-text">Feb 14, 2024</p>
            </div>
            <div>
              <p className="text-sm text-muted">Distance</p>
              <p className="font-medium text-text">5,567 km</p>
            </div>
            <div>
              <p className="text-sm text-muted">Partner</p>
              <p className="font-medium text-text">My Love</p>
            </div>
            <div>
              <p className="text-sm text-muted">Entries</p>
              <p className="font-medium text-text">4</p>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast">
          <div className="btn-primary px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
