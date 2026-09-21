'use client'

import { useEffect } from 'react'

export function DemoInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isDemoMode = !(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
    )

    if (isDemoMode) {
      // Demo data seeding disabled; only real user-created data should appear.
      // DemoDataProvider.seedDemoData()
    }
  }, [])

  return null
}

export class DemoDataProvider {
  private static STORAGE_KEY = 'digital-love-letters-demo'

  static getStorage() {
    if (typeof window === 'undefined') return {}
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }

  static setStorage(data: any) {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch {}
  }

  static generateId() {
    return Math.random().toString(36).substring(2, 15)
  }

  static seedDemoData() {
    const storage = this.getStorage()

    if (storage.entries && storage.entries.length > 0) return

    const now = new Date()
    const userId = 'demo-user-1'

    storage.currentUser = {
      id: userId,
      email: 'demo@loveletters.app',
      user_metadata: { display_name: 'You' }
    }
    storage.session = {
      user: storage.currentUser,
      access_token: 'demo-token'
    }

    storage.profiles = [
      {
        id: userId,
        display_name: 'You',
        avatar_url: null,
        timezone: 'America/New_York',
        latitude: 40.7128,
        longitude: -74.006,
        location_name: 'New York, NY',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      },
      {
        id: 'demo-partner-1',
        display_name: 'My Love',
        avatar_url: null,
        timezone: 'Europe/London',
        latitude: 51.5074,
        longitude: -0.1278,
        location_name: 'London, UK',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    ]

    storage.relationship_settings = [
      {
        id: this.generateId(),
        partner_one_id: userId,
        partner_two_id: 'demo-partner-1',
        anniversary_date: '2024-02-14',
        partner_one_location_name: 'New York, NY',
        partner_two_location_name: 'London, UK',
        partner_one_timezone: 'America/New_York',
        partner_two_timezone: 'Europe/London',
        distance_km: 5567,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    ]

    const entries = [
      {
        id: this.generateId(),
        slug: '2026-09-15',
        title: 'Good Morning, My Love',
        type: 'letter',
        content: { message: "Waking up thinking of you. The sun is rising here in NYC and I wish you were here to share coffee with me. 5 hours until you wake up... counting the minutes.\n\nCan't wait for our call tonight. I have a surprise planned!\n\nLove always,\nMe" },
        publish_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).toISOString(),
        unlock_at: null,
        unlock_condition: null,
        is_published: true,
        is_featured: true,
        view_count: 3,
        created_by: userId,
        created_at: new Date(now.getTime() - 86400000).toISOString(),
        updated_at: new Date(now.getTime() - 86400000).toISOString()
      },
      {
        id: this.generateId(),
        slug: 'sep-14-sunflowers',
        title: 'Sunflowers for You',
        type: 'bouquet',
        content: { note: 'Each sunflower represents a reason I love you' },
        publish_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0).toISOString(),
        unlock_at: null,
        unlock_condition: null,
        is_published: true,
        is_featured: false,
        view_count: 5,
        created_by: userId,
        created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
        updated_at: new Date(now.getTime() - 2 * 86400000).toISOString()
      },
      {
        id: this.generateId(),
        slug: 'open-when-miss-me',
        title: 'Open When You Miss Me',
        type: 'open_when',
        content: {},
        publish_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 15, 0).toISOString(),
        unlock_at: null,
        unlock_condition: 'manual',
        is_published: true,
        is_featured: true,
        view_count: 2,
        created_by: userId,
        created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
        updated_at: new Date(now.getTime() - 3 * 86400000).toISOString()
      },
      {
        id: this.generateId(),
        slug: 'friday-coffee-date',
        title: 'Virtual Friday Coffee Date',
        type: 'coffee_date',
        content: {},
        publish_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 9, 0).toISOString(),
        unlock_at: null,
        unlock_condition: null,
        is_published: false,
        is_featured: false,
        view_count: 0,
        created_by: userId,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    ]

    storage.entries = entries

    const bouquetEntry = entries.find((e: any) => e.slug === 'sep-14-sunflowers')
    if (bouquetEntry) {
      storage.bouquet_flowers = [
        { id: this.generateId(), entry_id: bouquetEntry.id, flower_type: 'sunflower', color: '#FFD700', note: 'Your smile brightens my darkest days', position_x: 30, position_y: 40, rotation: -5, scale: 1.1, sort_order: 0, created_at: now.toISOString() },
        { id: this.generateId(), entry_id: bouquetEntry.id, flower_type: 'sunflower', color: '#FFA500', note: 'You are my sunshine', position_x: 70, position_y: 35, rotation: 3, scale: 1.0, sort_order: 1, created_at: now.toISOString() },
        { id: this.generateId(), entry_id: bouquetEntry.id, flower_type: 'sunflower', color: '#FF8C00', note: 'Growing toward you always', position_x: 50, position_y: 55, rotation: 0, scale: 1.2, sort_order: 2, created_at: now.toISOString() },
        { id: this.generateId(), entry_id: bouquetEntry.id, flower_type: 'lavender', color: '#E6E6FA', note: 'Calm in the chaos', position_x: 20, position_y: 60, rotation: -8, scale: 0.8, sort_order: 3, created_at: now.toISOString() },
        { id: this.generateId(), entry_id: bouquetEntry.id, flower_type: 'rose', color: '#0284c7', note: 'Classic love, forever', position_x: 80, position_y: 50, rotation: 5, scale: 0.9, sort_order: 4, created_at: now.toISOString() }
      ]
    }

    storage.polaroid_cards = []

    storage.scratch_cards = [
      {
        id: this.generateId(),
        entry_id: entries[0].id,
        cover_color: '#E8B4B8',
        cover_image_url: null,
        reveal_content: { type: 'text', content: "I love you more than coffee\nAnd that's saying A LOT.\n\nYou're my favorite person in the entire universe." },
        scratch_threshold: 0.6,
        created_at: now.toISOString()
      }
    ]

    const openWhenEntry = entries.find((e: any) => e.slug === 'open-when-miss-me')
    if (openWhenEntry) {
      storage.open_when_letters = [
        {
          id: this.generateId(),
          entry_id: openWhenEntry.id,
          trigger_label: 'Open when you miss me',
          trigger_type: 'manual',
          trigger_value: null,
          envelope_color: '#F5E6E8',
          seal_emoji: '💌',
          content: { title: 'For When You Miss Me', message: "Hey you...\n\nI know the distance is hard. Some days it feels impossible. But remember: every day apart is one day closer to being together again.\n\nI carry you in my heart everywhere I go. In the coffee I drink, the songs I hear, the sunsets I watch.\n\nYou are loved. You are missed. You are MINE.\n\nForever yours\n\nP.S. Check your messages - I sent a voice note too!", image_url: null, audio_url: null },
          is_unlocked: false,
          unlocked_at: null,
          sort_order: 0,
          created_at: now.toISOString()
        },
        {
          id: this.generateId(),
          entry_id: openWhenEntry.id,
          trigger_label: 'Open on your birthday',
          trigger_type: 'date',
          trigger_value: '2025-06-15',
          envelope_color: '#FFF0F5',
          seal_emoji: '🎂',
          content: { title: 'Happy Birthday, My Love!', message: "Another year around the sun, and I'm so grateful for every single day with you in it.\n\nYou make 5,567 km feel like nothing.\n\nHere's to another year of us.\n\nYou deserve the world. Since I can't give you that, I'll give you my whole heart instead.\n\nHappy Birthday!\n\nWith all my love,\nMe", image_url: null, audio_url: null },
          is_unlocked: false,
          unlocked_at: null,
          sort_order: 1,
          created_at: now.toISOString()
        },
        {
          id: this.generateId(),
          entry_id: openWhenEntry.id,
          trigger_label: "Open when you're having a bad day",
          trigger_type: 'mood',
          trigger_value: 'sad',
          envelope_color: '#E8F5E9',
          seal_emoji: '🌈',
          content: { title: 'For the Hard Days', message: "I know today feels heavy. I wish I could be there to hold your hand.\n\nHere's a virtual hug:\n\nRemember:\n• You are stronger than you know\n• This feeling is temporary\n• I am always, ALWAYS here for you\n• You have overcome 100% of your bad days so far\n\nTake a deep breath. Drink some water. Be gentle with yourself.\n\nI love you. Tomorrow is a new day.", image_url: null, audio_url: null },
          is_unlocked: false,
          unlocked_at: null,
          sort_order: 2,
          created_at: now.toISOString()
        }
      ]
    }

    const coffeeEntry = entries.find((e: any) => e.slug === 'friday-coffee-date')
    if (coffeeEntry) {
      storage.coffee_dates = [
        {
          id: this.generateId(),
          entry_id: coffeeEntry.id,
          drink_type: 'latte',
          custom_name: "Carmen's Cozy Caramel Latte",
          message: 'For our Friday virtual date! Pick this up on your way to work.\n\nCan\'t wait to "share" this with you on our call!',
          gift_card_url: 'https://www.starbucks.com/gift',
          local_cafe_suggestion: 'The Attendant, Fitzrovia (your favorite!)',
          animation_triggered: false,
          created_at: now.toISOString()
        }
      ]
    }

    storage.voice_notes = []
    storage.media = []
    storage.partner_interactions = []

    storage.love_diaries = [
      {
        id: this.generateId(),
        user_id: userId,
        title: 'Our Love Story',
        description: 'A collection of love letters and gifts',
        entry_ids: (storage.entries || []).map((e: any) => e.id),
        cover_image: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    ]

    this.setStorage(storage)
  }

  static clearDemoData() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static getDemoEntries() {
    const storage = this.getStorage()
    return storage.entries || []
  }

  static getDemoDiaries() {
    const storage = this.getStorage()
    return storage.love_diaries || []
  }
}