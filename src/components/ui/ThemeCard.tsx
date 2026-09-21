import React from 'react'

interface ThemeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'ghost'
  padding?: 'none' | 'sm' | 'default' | 'lg'
}

const variantClasses: Record<string, string> = {
  default: 'bg-card border-card-border',
  elevated: 'bg-card border-card-border shadow-lg',
  outline: 'bg-transparent border-card-border',
  ghost: 'bg-transparent border-transparent',
}

const paddingClasses: Record<string, string> = {
  none: 'p-0',
  sm: 'p-4',
  default: 'p-6',
  lg: 'p-8',
}

export function ThemeCard({
  variant = 'default',
  padding = 'default',
  className = '',
  children,
  ...props
}: ThemeCardProps) {
  const classes = [
    'rounded-xl border transition-colors',
    variantClasses[variant],
    paddingClasses[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
