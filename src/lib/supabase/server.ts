import { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { createClient } from './client'

export { createClient }

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  )
}

export async function getServerSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return null

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) return null
  return session
}
