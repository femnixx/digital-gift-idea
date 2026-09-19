'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  isPassword?: boolean
  error?: string
}

export function Input({ label, icon: Icon, isPassword, error, className, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : (props.type ?? 'text')

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="label">{label}</label>
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-3.5 w-5 h-5 muted-foreground" />}
        <input
          type={inputType}
          className={`input bg-base-2/50 border-card-border rounded-xl h-12 text-text placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 ${Icon ? 'pl-10' : 'pl-3.5'} ${error ? 'border-accent' : ''} ${className || ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 muted hover:opacity-80"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  )
}
