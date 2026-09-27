import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-stone-200', className)}
      {...props}
    />
  )
}

export { Skeleton }

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 p-4', className)}>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-full min-h-[120px] w-full" />
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <Skeleton className="h-8 w-8 rounded-lg mb-3" />
      <Skeleton className="h-5 w-3/4 mb-1" />
      <Skeleton className="h-8 w-1/4" />
    </div>
  )
}

export function SkeletonTableRow({ cells = 6 }: { cells?: number }) {
  return (
    <div className="grid grid-cols-6 gap-4 px-6 py-4">
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="min-w-0">
          {i === 0 ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ) : (
            <Skeleton className="h-4 w-full max-w-[80px]" />
          )}
        </div>
      ))}
    </div>
  )
}

export function SkeletonEntryTable({ rows = 5, cells = 6 }: { rows?: number; cells?: number }) {
  return (
    <div className="divide-y divide-stone-200">
      <div className="grid grid-cols-6 gap-4 p-4 border-b border-stone-200">
        {Array.from({ length: cells }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full max-w-[100px]" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cells={cells} />
      ))}
    </div>
  )
}
