import { createClient } from '@/lib/supabase/client'

export async function ensureProfileExists(userId: string, displayName: string) {
  const supabase = createClient()

  const { error } = await supabase.from('profiles').insert({
    id: userId,
    display_name: displayName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error && error.code !== '23505') {
    console.error('Failed to create profile:', error)
  }
}
