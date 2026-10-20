'use client'

import { useSyncExternalStore } from 'react'

type Pref = 'light' | 'dark' | 'system'
const OPTIONS: Pref[] = ['light', 'dark', 'system']

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-pref'] })
  const mq = matchMedia('(prefers-color-scheme: dark)')
  const onMq = () => { if (document.documentElement.dataset.themePref === 'system') apply('system') }
  mq.addEventListener('change', onMq)
  return () => { mo.disconnect(); mq.removeEventListener('change', onMq) }
}
const getSnapshot = (): Pref => (document.documentElement.dataset.themePref as Pref) || 'system'
const getServerSnapshot = (): Pref => 'system'

function apply(p: Pref) {
  const dark = p === 'dark' || (p === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.documentElement.dataset.themePref = p
  try {
    localStorage.setItem('theme', p)
  } catch {
    // no-op
  }
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex border border-line rounded-[4px] overflow-hidden font-ui text-xs">
      {OPTIONS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={pref === p}
          onClick={() => apply(p)}
          className={pref === p ? 'bg-accent text-white px-3 py-1.5' : 'px-3 py-1.5 text-text-soft hover:bg-surface hover:text-text'}
        >
          {p === 'light' ? 'Light' : p === 'dark' ? 'Dark' : 'System'}
        </button>
      ))}
    </div>
  )
}
