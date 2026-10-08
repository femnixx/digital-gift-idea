import { ensureProfileExists } from '@/lib/neon/auth'

export async function ensureProfileExistsWrapper(userId: string, displayName: string) {
  await ensureProfileExists(userId, displayName)
}
