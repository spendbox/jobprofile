import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'available' | 'open' | 'not_looking' | 'indigo' | 'muted'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    available: 'bg-emerald-100 text-emerald-700',
    open: 'bg-amber-100 text-amber-700',
    not_looking: 'bg-slate-100 text-slate-500',
    indigo: 'bg-indigo-100 text-indigo-700',
    muted: 'bg-slate-50 text-slate-500 border border-slate-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
