'use client'

import * as React from 'react'

/**
 * Reusable primitives for the whole product.
 *
 * Everything here is driven by the same design tokens as the component classes
 * in globals.css (--text-*, --control-h-*, --space-card), so light and dark
 * mode and the mobile-to-desktop size ladder come for free and stay consistent
 * across the create flow, the gift pages and the admin panel.
 *
 * Props are split deliberately:
 *   - non-nullable: the ones a caller must always supply (`children`)
 *   - optional with a default: the ones that vary (`tone`, `size`)
 *   - optional pass-through: `className`, so a caller can always extend
 */

export type Tone = 'brand' | 'neutral' | 'positive' | 'danger'
export type Size = 'sm' | 'md' | 'lg'

/** Maps a tone and size onto the matching CSS classes. */
const TONE_CLASS: Record<Tone, string> = {
  brand: 'btn-primary',
  neutral: 'btn-secondary',
  positive: 'btn-primary',
  danger: 'btn-primary',
}

const TONE_STYLE: Record<Tone, React.CSSProperties | undefined> = {
  brand: undefined,
  neutral: undefined,
  positive: { background: 'rgb(22 163 74)' },
  danger: { background: 'rgb(220 38 38)' },
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: what the button does, also its accessible name. */
  children: React.ReactNode
  /** Optional. Defaults to 'brand'. */
  tone?: Tone
  /** Optional. Defaults to 'md'. */
  size?: Size
}

export function Button({ children, tone = 'brand', size = 'md', className = '', style, ...rest }: ButtonProps) {
  return (
    <button
      className={`btn ${TONE_CLASS[tone]} ${SIZE_CLASS[size]} ${className}`.trim()}
      style={{ ...TONE_STYLE[tone], ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Required: the panel's contents. */
  children: React.ReactNode
  /** Optional. Defaults to 'md'. */
  size?: Size
  /** Optional. Defaults to 'raised'. */
  variant?: 'raised' | 'flat' | 'outline'
}

const PANEL_SIZE: Record<Size, string> = { sm: 'card-sm', md: '', lg: 'card-lg' }
const PANEL_VARIANT: Record<NonNullable<PanelProps['variant']>, string> = {
  raised: 'card',
  flat: 'bg-surface-2',
  outline: 'border-2 border-line',
}

export function Panel({ children, size = 'md', variant = 'raised', className = '', ...rest }: PanelProps) {
  return (
    <div
      className={`${PANEL_VARIANT[variant]} ${PANEL_SIZE[size]} rounded-2xl ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Required: the field's label text. */
  label: string
  /** Optional: marks the control as not required, and labels it so. */
  optional?: boolean
  /** Optional: helper copy shown under the control. */
  hint?: string
  /** Optional: the error message, which also marks the control invalid. */
  error?: string
  /** Required: the control itself. */
  children: React.ReactNode
}

export function Field({ label, optional, hint, error, children, className = '', ...rest }: FieldProps) {
  const describedBy = [error ? 'field-error' : null, hint ? 'field-hint' : null].filter(Boolean).join(' ')

  return (
    <div className={`space-y-1 ${className}`} {...rest}>
      <label className="label">
        {label}
        {optional ? <span className="muted-foreground font-normal"> (optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id="field-error" role="alert" className="text-sm" style={{ color: 'rgb(220 38 38)' }}>
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id="field-hint" className="hint">
          {hint}
        </p>
      ) : null}
      {/* Screen readers get the hint/error relationship without a DOM id dance. */}
      <span className="sr-only" aria-describedby={describedBy || undefined} />
    </div>
  )
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Required: the badge text. */
  children: React.ReactNode
  /** Optional. Defaults to 'brand'. */
  tone?: Tone
}

const BADGE_BG: Record<Tone, string> = {
  brand: 'var(--accent)',
  neutral: 'var(--muted)',
  positive: 'rgb(22 163 74)',
  danger: 'rgb(220 38 38)',
}

export function Badge({ children, tone = 'brand', className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`badge ${className}`.trim()}
      style={{ background: `rgb(${BADGE_BG[tone]} / 0.14)`, color: `rgb(${BADGE_BG[tone]})` }}
      {...rest}
    >
      {children}
    </span>
  )
}
