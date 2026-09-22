import React from 'react'

interface ThemeIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ComponentType<{ className?: string }>
  label: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'default' | 'lg'
}

const variantClasses: Record<string, string> = {
  default: 'bg-card border-card-border hover:bg-base-2',
  ghost: 'bg-transparent border-transparent hover:bg-base-2',
  outline: 'bg-transparent border-card-border hover:bg-base-2',
}

const sizeClasses: Record<string, string> = {
  sm: 'p-1.5',
  default: 'p-2',
  lg: 'p-3',
}

export function ThemeIconButton({
  icon: Icon,
  label,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}: ThemeIconButtonProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-lg border transition-colors',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} aria-label={label} {...props}>
      <Icon className="w-5 h-5 text-text" />
    </button>
  )
}
