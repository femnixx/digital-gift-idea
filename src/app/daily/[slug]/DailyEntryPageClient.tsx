'use client'

import { useDemoEntry } from '@/hooks/useDemoData'
import { DailyEntryPage } from './DailyEntryPage'

export function DailyEntryPageClient({ slug }: { slug: string }) {
  const { entry, loading } = useDemoEntry(slug)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full mx-auto mb-4 animate-spin" />
          <p className="font-handwriting text-sky-600">Loading your letter... ??</p>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="font-script text-3xl text-sky-600 mb-2">Letter Not Found</h1>
          <p className="text-sky-500 mb-6">This letter hasn't been written yet...</p>
          <a href="/" className="btn-primary">Back Home</a>
        </div>
      </div>
    )
  }

  return <DailyEntryPage entry={entry} />
}
