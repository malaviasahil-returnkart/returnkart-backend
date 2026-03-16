import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

// Simple auth context — reads user_id from localStorage
// In production this would use Supabase auth session
export const AuthContext = React.createContext(null)

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('rk_user_id'))
  const [gmailConnected, setGmailConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check URL params for OAuth result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail') === 'connected') {
      setGmailConnected(true)
      window.history.replaceState({}, '', '/')
    }
    if (params.get('error')) {
      console.error('OAuth error:', params.get('error'))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ userId, setUserId, gmailConnected, setGmailConnected, loading, setLoading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={userId && gmailConnected ? <Navigate to="/dashboard" /> : <Onboarding />} />
          <Route path="/dashboard" element={userId ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/settings" element={userId ? <Settings /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
