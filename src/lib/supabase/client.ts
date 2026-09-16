import { createBrowserClient } from '@supabase/ssr'

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
  
  return createBrowserClient(
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
  
  const generateId = () => Math.random().toString(36).substring(2, 15)
  
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
        return createMockClient().auth.signInWithPassword({ email, password })
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
          return Promise.resolve({ data: newItems, error: null })
        },
        update: (data: any) => {
          const now = new Date().toISOString()
          storage[table] = storage[table].map((row: any) => {
            if (query.data.some((q: any) => q.id === row.id)) {
              return { ...row, ...data, updated_at: now }
            }
            return row
          })
          setStorage(storage)
          const updated = storage[table].filter((row: any) => query.data.some((q: any) => q.id === row.id))
          return Promise.resolve({ data: updated, error: null })
        },
        delete: () => {
          storage[table] = storage[table].filter((row: any) => !query.data.some((q: any) => q.id === row.id))
          setStorage(storage)
          return Promise.resolve({ error: null })
        }
      }
      
      return chain
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
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