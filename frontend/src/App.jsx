import { useState, useEffect } from 'react'
import { api } from './lib/api'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('rk_user_id'))
  const [gmailConnected, setGmailConnected] = useState(false)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'settings'
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('rk_user_profile')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  // Check URL params after OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail') === 'connected') {
      setGmailConnected(true)

      // Store Google profile data from callback
      const name = params.get('user_name')
      const email = params.get('user_email')
      const picture = params.get('user_picture')
      if (name || email || picture) {
        const profile = { name: name || '', email: email || '', picture: picture || '' }
        localStorage.setItem('rk_user_profile', JSON.stringify(profile))
        setUserProfile(profile)
      }

      window.history.replaceState({}, '', '/')
    }
    if (params.get('error')) {
      console.error('OAuth error:', params.get('error'))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // Check Gmail connection status
  useEffect(() => {
    if (!userId) { setChecking(false); return }
    api.authStatus(userId)
      .then(data => setGmailConnected(data.connected))
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [userId])

  function handleConnect(uid) {
    localStorage.setItem('rk_user_id', uid)
    setUserId(uid)
    window.location.href = api.gmailOAuthUrl(uid)
  }

  function handleDisconnect() {
    if (userId) api.authRevoke(userId).catch(() => {})
    localStorage.removeItem('rk_user_id')
    localStorage.removeItem('rk_user_profile')
    setUserId(null)
    setUserProfile(null)
    setGmailConnected(false)
    setPage('dashboard')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-vault-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vault-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!userId || !gmailConnected) {
    return <Onboarding onConnect={handleConnect} />
  }

  if (page === 'settings') {
    return (
      <Settings
        userId={userId}
        userProfile={userProfile}
        onBack={() => setPage('dashboard')}
        onDisconnect={handleDisconnect}
      />
    )
  }

  return (
    <Dashboard
      userId={userId}
      userProfile={userProfile}
      onDisconnect={handleDisconnect}
      onOpenSettings={() => setPage('settings')}
    />
  )
}
