import React from 'react'

interface ThemeSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer' | 'nav'
  padding?: 'none' | 'sm' | 'default' | 'lg'
  border?: boolean
  rounded?: 'none' | 'sm' | 'default' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-4',
  default: 'p-6',
  lg: 'p-8',
}

const roundedClasses: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-lg',
  default: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
}

export function ThemeSurface({
  as: Component = 'div',
  padding = 'default',
  border = true,
  rounded = 'default',
  className = '',
  children,
  ...props
}: ThemeSurfaceProps) {
  const classes = [
    'bg-card transition-colors',
    border ? 'border border-card-border' : '',
    paddingClasses[padding],
    roundedClasses[rounded],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}
