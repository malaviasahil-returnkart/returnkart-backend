import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { api } from '../lib/api'

export default function Settings() {
  const { userId, setUserId, setGmailConnected } = useContext(AuthContext)
  const navigate = useNavigate()
  const [revoking, setRevoking] = useState(false)
  const [msg, setMsg] = useState('')

  const handleRevoke = async () => {
    if (!window.confirm('Disconnect Gmail? ReturnKart will no longer sync your emails.')) return
    setRevoking(true)
    try {
      await api.revokeGmail(userId)
      setGmailConnected(false)
      setMsg('Gmail disconnected successfully.')
      setTimeout(() => navigate('/'), 1500)
    } catch (e) {
      setMsg('Error: ' + e.message)
    } finally {
      setRevoking(false)
    }
  }

  const handleDeleteData = () => {
    if (!window.confirm('Delete all your data? This cannot be undone.')) return
    localStorage.removeItem('rk_user_id')
    setUserId(null)
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-vault-black flex flex-col animate-fade-in">
      <header className="sticky top-0 z-10 bg-vault-black/90 backdrop-blur border-b border-vault-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-vault-gray">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4L4 10l8 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-white font-semibold">Settings Vault</span>
      </header>

      <main className="flex-1 px-5 py-6 space-y-4">

        {/* Account */}
        <section className="vault-card p-5 space-y-3">
          <h3 className="text-xs text-vault-gray uppercase tracking-widest">Account</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Gmail Connection</p>
              <p className="text-xs text-vault-gray truncate max-w-[200px]">
                {userId ? `ID: ${userId.slice(0, 8)}…` : 'Not connected'}
              </p>
            </div>
            <span className="text-xs text-vault-green bg-vault-green/10 px-2 py-0.5 rounded-full">Active</span>
          </div>
        </section>

        {/* DPDP / Privacy */}
        <section className="vault-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs text-vault-gray uppercase tracking-widest">Privacy</h3>
            <span className="text-xs text-vault-gold bg-vault-gold/10 px-2 py-0.5 rounded">DPDP 2023</span>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-white">Data Purpose</p>
            <p className="text-xs text-vault-gray">Return window tracking only</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-white">Auto-deletion</p>
            <p className="text-xs text-vault-gray">Your data is automatically deleted after 24 months</p>
          </div>
        </section>

        {/* Danger zone */}
        <section className="vault-card p-5 space-y-3 border-vault-red/20">
          <h3 className="text-xs text-vault-red uppercase tracking-widest">Danger Zone</h3>

          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="btn-ghost w-full text-vault-red border-vault-red/30"
          >
            {revoking ? 'Disconnecting…' : 'Disconnect Gmail'}
          </button>

          <button
            onClick={handleDeleteData}
            className="w-full py-3.5 text-sm text-vault-red text-center"
          >
            Delete All My Data
          </button>
        </section>

        {msg && <p className="text-center text-sm text-vault-gray">{msg}</p>}

      </main>
    </div>
  )
}
