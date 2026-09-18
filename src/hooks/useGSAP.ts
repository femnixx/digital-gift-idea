import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useGSAPAnimation(
  animation: (ctx: gsap.Context, scope: HTMLElement) => void | (() => void),
  deps: unknown[] = []
) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const ctx = gsap.context(() => {}, ref.current)

    const cleanup = animation(ctx, ref.current)

    return () => {
      cleanup?.()
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
