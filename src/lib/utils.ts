import { type AvailabilityStatus } from '@/types'

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function availabilityColor(status: AvailabilityStatus): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-100 text-emerald-700'
    case 'open':
      return 'bg-amber-100 text-amber-700'
    case 'not_looking':
      return 'bg-slate-100 text-slate-600'
  }
}

export function availabilityDot(status: AvailabilityStatus): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-500'
    case 'open':
      return 'bg-amber-500'
    case 'not_looking':
      return 'bg-slate-400'
  }
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
