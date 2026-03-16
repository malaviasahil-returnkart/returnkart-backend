/**
 * RETURNKART.IN — API CLIENT
 * Thin fetch wrapper pointing at /api/* (proxied to Python backend in dev,
 * served directly in production since both live on the same domain).
 */

const BASE = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Health
  health: () => request('GET', '/health'),

  // Auth
  startGmailOAuth: (userId) => {
    // Redirect to backend OAuth — not a fetch, it's a full page redirect
    window.location.href = `${BASE}/auth/google?user_id=${userId}`
  },
  revokeGmail: (userId) => request('DELETE', `/auth/revoke?user_id=${userId}`),
  gmailStatus: (userId) => request('GET', `/auth/status?user_id=${userId}`),

  // Orders
  getOrders: (userId, status) => {
    const q = status ? `?user_id=${userId}&status=${status}` : `?user_id=${userId}`
    return request('GET', `/orders${q}`)
  },
  getUrgentOrders: (userId, days = 3) =>
    request('GET', `/orders/urgent?user_id=${userId}&days=${days}`),
  updateOrderStatus: (orderId, userId, status) =>
    request('PATCH', `/orders/${orderId}`, { user_id: userId, status }),
  triggerSync: (userId) =>
    request('POST', '/orders/sync', { user_id: userId }),
}
