import React, { useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { api } from '../lib/api'

export default function Dashboard() {
  const { userId } = useContext(AuthContext)
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [urgent, setUrgent] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncMsg, setSyncMsg] = useState('')

  const loadOrders = useCallback(async () => {
    if (!userId) return
    try {
      const [all, urg] = await Promise.all([
        api.getOrders(userId, 'active'),
        api.getUrgentOrders(userId, 3),
      ])
      setOrders(all.orders || [])
      setUrgent(urg.orders || [])
    } catch (e) {
      console.error('Load orders failed:', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadOrders() }, [loadOrders])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      await api.triggerSync(userId)
      setSyncMsg('Sync started — checking your inbox…')
      setTimeout(() => { setSyncMsg(''); loadOrders() }, 4000)
    } catch (e) {
      setSyncMsg('Sync failed: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleMarkStatus = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, userId, status)
      setOrders(prev => prev.filter(o => o.id !== orderId))
      setUrgent(prev => prev.filter(o => o.id !== orderId))
    } catch (e) {
      console.error('Update failed:', e)
    }
  }

  const totalAtRisk = orders.reduce((sum, o) => sum + (o.price || 0), 0)

  return (
    <div className="min-h-dvh bg-vault-black flex flex-col animate-fade-in">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-vault-black/90 backdrop-blur border-b border-vault-border px-5 py-4 flex items-center justify-between">
        <span className="text-gold-gradient text-xl font-bold">ReturnKart</span>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full bg-vault-card border border-vault-border flex items-center justify-center text-vault-gray"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="7" r="3"/>
            <path d="M2.5 18c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" strokeLinecap="round"/>
          </svg>
        </button>
      </header>

      <main className="flex-1 px-5 py-5 space-y-5 pb-24">

        {/* Money at Risk card */}
        <div className="vault-card p-5 border-vault-gold/30 space-y-1">
          <p className="text-vault-gray text-xs uppercase tracking-widest">Money at Risk</p>
          <p className="text-3xl font-bold">
            <span className="text-gold-gradient">₹{totalAtRisk.toLocaleString('en-IN')}</span>
          </p>
          <p className="text-vault-gray text-sm">{orders.length} active return window{orders.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-gold w-full flex items-center justify-center gap-2"
        >
          {syncing ? (
            <span className="w-4 h-4 border-2 border-vault-black/40 border-t-vault-black rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M15 12V6H9" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 6A6.5 6.5 0 0 0 3 8M1.5 10a6.5 6.5 0 0 0 11.5 2" strokeLinecap="round"/>
            </svg>
          )}
          {syncing ? 'Syncing…' : 'Sync Gmail'}
        </button>
        {syncMsg && <p className="text-center text-sm text-vault-gray">{syncMsg}</p>}

        {/* Urgent carousel */}
        {urgent.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-vault-red uppercase tracking-wider flex items-center gap-2">
              <span>🚨</span> Expiring Soon
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {urgent.map(order => (
                <UrgentCard key={order.id} order={order} onAction={handleMarkStatus} />
              ))}
            </div>
          </section>
        )}

        {/* All active orders */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-vault-gray uppercase tracking-wider">Active Returns</h2>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="vault-card p-4 h-20 animate-pulse bg-vault-card" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderRow key={order.id} order={order} onAction={handleMarkStatus} />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-vault-black/90 backdrop-blur border-t border-vault-border flex">
        <NavTab icon="🏠" label="Home" active />
        <NavTab icon="⚙️" label="Settings" onClick={() => navigate('/settings')} />
      </nav>
    </div>
  )
}

function UrgentCard({ order, onAction }) {
  const days = daysLeft(order.return_deadline)
  return (
    <div className="flex-shrink-0 w-64 vault-card border-urgent snap-start p-4 space-y-3">
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold text-vault-gold">{order.brand}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          days <= 1 ? 'bg-red-900/50 text-vault-red' :
          days <= 2 ? 'bg-amber-900/50 text-vault-amber' :
          'bg-yellow-900/50 text-vault-gold'
        }`}>
          {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d left`}
        </span>
      </div>
      <p className="text-sm text-white font-medium leading-snug line-clamp-2">{order.item_name}</p>
      <p className="text-vault-gold font-semibold">₹{(order.price || 0).toLocaleString('en-IN')}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onAction(order.id, 'returned')}
          className="flex-1 text-xs py-2 rounded-lg bg-vault-gold text-vault-black font-semibold"
        >Returned ✓</button>
        <button
          onClick={() => onAction(order.id, 'kept')}
          className="flex-1 text-xs py-2 rounded-lg border border-vault-border text-vault-gray"
        >Keeping</button>
      </div>
    </div>
  )
}

function OrderRow({ order, onAction }) {
  const days = daysLeft(order.return_deadline)
  const urgency = days <= 1 ? 'text-vault-red' : days <= 3 ? 'text-vault-amber' : 'text-vault-gray'

  return (
    <div className="vault-card p-4 flex items-center gap-3">
      {/* Brand dot */}
      <div className="w-10 h-10 rounded-xl bg-vault-black border border-vault-border flex items-center justify-center flex-shrink-0">
        <span className="text-lg">{brandEmoji(order.brand)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{order.item_name}</p>
        <p className="text-xs text-vault-gray">{order.brand} · ₹{(order.price || 0).toLocaleString('en-IN')}</p>
      </div>

      {/* Deadline */}
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-semibold ${urgency}`}>
          {days < 0 ? 'Expired' : days === 0 ? 'Today!' : `${days}d`}
        </p>
        <p className="text-xs text-vault-border">{fmtDate(order.return_deadline)}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="vault-card p-8 flex flex-col items-center gap-4 text-center">
      <span className="text-4xl">📭</span>
      <div className="space-y-1">
        <p className="text-white font-medium">No active return windows</p>
        <p className="text-vault-gray text-sm">Tap Sync Gmail to scan your recent orders</p>
      </div>
    </div>
  )
}

function NavTab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${
        active ? 'text-vault-gold' : 'text-vault-gray'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  )
}

// Helpers
function daysLeft(deadline) {
  if (!deadline) return 999
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function brandEmoji(brand) {
  const map = { amazon: '📦', flipkart: '🛍️', myntra: '👗', meesho: '🛒', ajio: '✨' }
  return map[(brand || '').toLowerCase()] || '🏷️'
}
