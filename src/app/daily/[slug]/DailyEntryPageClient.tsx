'use client'

import { useState, useEffect } from 'react'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { DailyEntryPage } from './DailyEntryPage'
import { useDemoEntry } from '@/hooks/useDemoData'

export function DailyEntryPageClient({ slug }: { slug: string }) {
  const { entry, loading } = useDemoEntry(slug)

  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </div>

            <Skeleton className="h-72 md:h-96 w-full rounded-xl" />

            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-3/4 mx-auto rounded" />
              <Skeleton className="h-6 w-1/4 mx-auto rounded" />
            </div>

            <div className="space-y-6">
              <SkeletonText lines={8} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 text-4xl">📭</div>
          <h1 className="font-script text-3xl text-accent mb-2">Letter Not Found</h1>
          <p className="text-muted mb-6">
            This letter hasn't been written yet...
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-2 transition-colors"
          >
            Back Home
          </a>
        </div>
      </div>
    )
  }

  return <DailyEntryPage entry={entry} />
}
