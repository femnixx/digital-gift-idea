'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Loading() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/admin')
    }, 1500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto dark:border-romantic-500" />
        <p className="muted-foreground font-handwriting text-lg">Loading...</p>
      </div>
    </div>
  )
}
