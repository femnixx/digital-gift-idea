import React from 'react'

interface ThemeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: 'accent' | 'success' | 'warning' | 'error' | 'info' | 'muted'
  size?: 'sm' | 'default' | 'lg'
  children: React.ReactNode
}

const colorClasses: Record<string, string> = {
  accent: 'bg-accent/10 text-accent border-accent/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  info: 'bg-info/10 text-info border-info/20',
  muted: 'bg-base-2 text-muted border-card-border',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  default: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export function ThemeBadge({
  color = 'accent',
  size = 'default',
  className = '',
  children,
  ...props
}: ThemeBadgeProps) {
  const classes = [
    'inline-flex items-center rounded-full border font-medium',
    colorClasses[color],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}
