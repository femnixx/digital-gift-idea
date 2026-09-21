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
    <div className="flex flex-col gap-2.5 w-full">
      <label className="label">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none muted-foreground"
          />
        )}
        <input
          type={inputType}
          className={`input ${isPassword ? 'pr-10' : ''} ${Icon ? 'pl-10' : ''} ${className || ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 muted hover:opacity-80"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  )
}
