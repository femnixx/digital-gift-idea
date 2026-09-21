import React from 'react'

interface ThemeTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'error' | 'info'
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: React.ReactNode
}

const variantClasses: Record<string, string> = {
  default: 'text-text',
  muted: 'text-muted',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
}

export function ThemeText({
  variant = 'default',
  as: Component = 'p',
  className = '',
  children,
  ...props
}: ThemeTextProps) {
  const classes = [variantClasses[variant], className].filter(Boolean).join(' ')

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}
