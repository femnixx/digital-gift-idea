'use client'

/**
 * Global loading UI, shown while any route segment suspends.
 *
 * This must be purely presentational. It previously navigated to the admin
 * dashboard after a timeout, which meant any slow route in the public create
 * flow was yanked into the admin login screen.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="muted-foreground font-handwriting text-lg">Loading...</p>
      </div>
    </div>
  )
}
