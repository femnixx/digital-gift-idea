import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  )
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    // Return a mock client that uses localStorage
    return createMockClient()
  }
  
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Mock client for demo/fallback mode
function createMockClient() {
  const STORAGE_KEY = 'digital-love-letters-demo'
  
  const getStorage = () => {
    if (typeof window === 'undefined') return {}
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }
  
  const setStorage = (data: any) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
  }
  
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
  
  return {
    auth: {
      getUser: async () => {
        const storage = getStorage()
        const user = storage.currentUser
        return { data: { user: user || null }, error: null }
      },
      getSession: async () => {
        const storage = getStorage()
        return { data: { session: storage.session || null }, error: null }
      },
      signInWithPassword: async ({ email, password }: any) => {
        // Demo: any email/password works
        const user = { id: generateId(), email, user_metadata: { display_name: email.split('@')[0] } }
        const storage = getStorage()
        storage.currentUser = user
        storage.session = { user, access_token: 'demo-token' }
        setStorage(storage)
        return { data: { user, session: storage.session }, error: null }
      },
      signUp: async ({ email, password }: any) => {
        const user = { id: generateId(), email, user_metadata: { display_name: email.split('@')[0] }, confirmed_at: new Date().toISOString() }
        const storage = getStorage()
        storage.currentUser = user
        storage.session = { user, access_token: 'demo-token' }
        setStorage(storage)
        return { data: { user, session: storage.session }, error: null }
      },
      signInWithOAuth: async ({ provider }: { provider: string }) => {
        const user = { id: generateId(), email: `${provider}@demo.com`, user_metadata: { display_name: provider, provider } }
        const storage = getStorage()
        storage.currentUser = user
        storage.session = { user, access_token: 'demo-oauth-token' }
        setStorage(storage)
        return { data: { user, session: storage.session }, error: null }
      },
      signInWithOtp: async ({ email }: { email: string }) => {
        const user = { id: generateId(), email, user_metadata: { display_name: email.split('@')[0] } }
        const storage = getStorage()
        storage.currentUser = user
        storage.session = { user, access_token: 'demo-otp-token' }
        setStorage(storage)
        return { data: { user, session: storage.session }, error: null }
      },
      resetPasswordForEmail: async (email: string) => {
        return { data: { email }, error: null }
      },
      verifyOtp: async ({ email, token, type }: { email?: string; token?: string; type?: string }) => {
        return { data: { user: { id: generateId(), email: 'verified@demo.com' }, session: { access_token: 'demo-verified' } }, error: null }
      },
      signOut: async () => {
        const storage = getStorage()
        storage.currentUser = null
        storage.session = null
        setStorage(storage)
        return { error: null }
      },
      onAuthStateChange: (callback: any) => {
        // Fire once with current state
        const storage = getStorage()
        callback('SIGNED_IN', storage.session)
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    },
    from: (table: string) => {
      const storage = getStorage()
      storage[table] = storage[table] || []
      setStorage(storage)
      
      let query: any = { 
        data: [...storage[table]], 
        error: null,
        count: storage[table].length
      }
      
      const chain = {
        select: (cols = '*') => {
          query.selectCols = cols
          return chain
        },
        eq: (col: string, val: any) => {
          query.data = query.data.filter((row: any) => row[col] === val)
          return chain
        },
        neq: (col: string, val: any) => {
          query.data = query.data.filter((row: any) => row[col] !== val)
          return chain
        },
        lte: (col: string, val: any) => {
          query.data = query.data.filter((row: any) => new Date(row[col]) <= new Date(val))
          return chain
        },
        gte: (col: string, val: any) => {
          query.data = query.data.filter((row: any) => new Date(row[col]) >= new Date(val))
          return chain
        },
        ilike: (col: string, val: any) => {
          const pattern = val.replace('%', '.*')
          query.data = query.data.filter((row: any) => new RegExp(pattern, 'i').test(row[col]))
          return chain
        },
        order: (col: string, { ascending = true } = {}) => {
          query.data.sort((a: any, b: any) => {
            const av = a[col], bv = b[col]
            return ascending ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
          })
          return chain
        },
        range: (from: number, to: number) => {
          query.data = query.data.slice(from, to + 1)
          return chain
        },
        single: () => {
          return Promise.resolve({ data: query.data[0] || null, error: query.data[0] ? null : { message: 'Not found' } })
        },
        insert: (data: any) => {
          const items = Array.isArray(data) ? data : [data]
          const now = new Date().toISOString()
          const newItems = items.map((item: any) => ({
            ...item,
            id: item.id || generateId(),
            created_at: item.created_at || now,
            updated_at: now
          }))
          storage[table].push(...newItems)
          setStorage(storage)

          const result = { data: newItems, error: null }
          const insertChain = {
            select: (cols = '*') => {
              query.selectCols = cols
              return { ...insertChain, _result: result }
            },
            single: () => Promise.resolve({ data: newItems[0] || null, error: null }),
            eq: (col: string, val: any) => insertChain,
            neq: (col: string, val: any) => insertChain,
            then: <T>(onFulfill: (value: any) => T): T => onFulfill(result),
            catch: () => Promise.resolve({ error: null }),
          }
          return insertChain
        },
        update: (data: any) => {
          const now = new Date().toISOString()
          const updatedRows: any[] = []
          storage[table] = storage[table].map((row: any) => {
            if (query.data.some((q: any) => q.id === row.id)) {
              const updated = { ...row, ...data, updated_at: now }
              updatedRows.push(updated)
              return updated
            }
            return row
          })
          setStorage(storage)
          const updated = storage[table].filter((row: any) => query.data.some((q: any) => q.id === row.id))

          const result = { data: updated, error: null }
          const updateChain = {
            select: (cols = '*') => {
              query.selectCols = cols
              return { ...updateChain, _result: result }
            },
            single: () => Promise.resolve({ data: updated[0] || null, error: null }),
            eq: (col: string, val: any) => updateChain,
            neq: (col: string, val: any) => updateChain,
            then: <T>(onFulfill: (value: any) => T): T => onFulfill(result),
            catch: () => Promise.resolve({ error: null }),
          }
          return updateChain
        },
        delete: () => {
          storage[table] = storage[table].filter((row: any) => !query.data.some((q: any) => q.id === row.id))
          setStorage(storage)
          const result = { error: null }
          const deleteChain = {
            eq: (col: string, val: any) => deleteChain,
            neq: (col: string, val: any) => deleteChain,
            then: <T>(onFulfill: (value: any) => T): T => onFulfill(result),
            catch: () => Promise.resolve({ error: null }),
          }
          return deleteChain
        }
      };
      return chain as any
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File, _options?: any) => {
          // Return a mock URL
          const url = URL.createObjectURL(file)
          return { data: { path }, error: null }
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `https://demo-storage.example.com/${path}` } }
        },
        remove: async (paths: string[]) => {
          return { error: null }
        }
      })
    }
  }
}