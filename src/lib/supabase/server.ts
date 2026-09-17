import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  )
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    // Return mock server client
    return createMockServerClient()
  }
  
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignore in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  )
}

function createMockServerClient() {
  // For server-side rendering in demo mode, we can't use localStorage
  // Return a client that returns empty data
  const emptyResponse = { data: null, error: { message: 'Demo mode - use client-side' } }
  const emptyArrayResponse = { data: [], error: null, count: 0 }
  
  const createEmptyChain = () => {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      neq: () => chain,
      lte: () => chain,
      gte: () => chain,
      ilike: () => chain,
      order: () => chain,
      range: () => chain,
      single: () => Promise.resolve(emptyResponse),
      insert: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
      delete: () => Promise.resolve({ error: { message: 'Demo mode' } }),
    }
    return chain
  }
  
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: (table: string) => createEmptyChain(),
    storage: {
      from: (bucket: string) => ({
        upload: async () => ({ data: null, error: { message: 'Demo mode' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ error: { message: 'Demo mode' } }),
      })
    }
  }
}