/** Format money with the app currency using Intl (falls back to a plain prefix). */
export function formatMoney(
  amount: number,
  currency = 'INR',
  locale = typeof navigator !== 'undefined' ? navigator.language : 'en-IN'
): string {
  const value = Number.isFinite(amount) ? amount : 0
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

/** Compact relative time for recent activity (e.g. "2h ago"). */
export function formatRelativeTime(iso: string, nowMs: number = Date.now()): string {
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return '—'

  const deltaSec = Math.round((nowMs - then) / 1000)
  if (deltaSec < 45) return 'just now'
  if (deltaSec < 90) return '1m ago'

  const minutes = Math.round(deltaSec / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`

  const years = Math.round(months / 12)
  return `${years}y ago`
}
