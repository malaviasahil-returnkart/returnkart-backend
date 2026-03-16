/**
 * Shared formatters for dates, currency, countdown timers.
 */

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function daysRemaining(deadlineStr) {
  if (!deadlineStr) return null
  const deadline = new Date(deadlineStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)
  return Math.round((deadline - today) / (1000 * 60 * 60 * 24))
}

export function urgencyLevel(days) {
  if (days === null) return 'unknown'
  if (days < 0) return 'expired'
  if (days <= 1) return 'critical'
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'warning'
  return 'safe'
}

export function urgencyColor(level) {
  switch (level) {
    case 'expired':  return '#666666'
    case 'critical': return '#FF4444'
    case 'urgent':   return '#FF8C00'
    case 'warning':  return '#FFD700'
    default:         return '#22C55E'
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function brandSlug(brand) {
  return brand?.toLowerCase().replace(/\s+/g, '') || 'unknown'
}

export function brandColor(brand) {
  const colors = {
    amazon: '#FF9900',
    myntra: '#FF3F6C',
    flipkart: '#2874F0',
    meesho: '#9C27B0',
    ajio: '#1B1B1B',
  }
  return colors[brandSlug(brand)] || '#D4AF37'
}
