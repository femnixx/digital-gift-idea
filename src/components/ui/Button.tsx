import { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  loading?: boolean
}

export function Button({ children, icon: Icon, loading, className, ...props }: ButtonProps) {
  return (
    <button
      className={`btn-primary w-full rounded-xl py-3.5 ${className || ''}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <span>{children}</span>
          {Icon && <Icon className="h-5 w-5" />}
        </>
      )}
    </button>
  )
}
