import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { api } from '../lib/api'

// Generate a simple UUID v4 for the user session
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export default function Onboarding() {
  const { setUserId, setGmailConnected } = useContext(AuthContext)
  const [step, setStep] = useState(1)    // 1 = intro, 2 = consent, 3 = connecting
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleConnectGmail = () => {
    if (!agreed) {
      setError('Please accept the data usage terms to continue.')
      return
    }
    setError('')
    setStep(3)

    // Create or restore user ID
    let uid = localStorage.getItem('rk_user_id')
    if (!uid) {
      uid = uuidv4()
      localStorage.setItem('rk_user_id', uid)
    }
    setUserId(uid)

    // Redirect to backend OAuth flow
    api.startGmailOAuth(uid)
  }

  return (
    <div className="min-h-dvh bg-vault-black flex flex-col items-center justify-between px-5 py-8 animate-fade-in">

      {/* Top wordmark */}
      <div className="w-full flex items-center justify-center pt-4">
        <span className="text-gold-gradient text-2xl font-bold tracking-tight">ReturnKart</span>
      </div>

      {/* Main content */}
      <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-slide-up">

        {step === 1 && (
          <>
            {/* Hero icon */}
            <div className="w-24 h-24 rounded-full bg-vault-card border border-vault-border flex items-center justify-center animate-pulse-gold">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <path d="M22 4L6 12V22C6 31.4 13.1 40.2 22 42C30.9 40.2 38 31.4 38 22V12L22 4Z"
                  stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M14 22L19 27L30 16" stroke="#D4AF37" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Headline */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold leading-tight">
                Never miss a{' '}
                <span className="text-gold-gradient">return window</span>
                {' '}again
              </h1>
              <p className="text-vault-gray text-base leading-relaxed">
                ReturnKart automatically scans your order emails and alerts you before your return window closes.
              </p>
            </div>

            {/* Feature pills */}
            <div className="w-full space-y-3">
              {[
                { icon: '⚡', text: 'Zero setup — connect Gmail once' },
                { icon: '🛡️', text: 'Read-only access, never sends emails' },
                { icon: '🇮🇳', text: 'Amazon, Flipkart, Myntra, Meesho, Ajio' },
              ].map((f, i) => (
                <div key={i} className="vault-card flex items-center gap-4 px-4 py-3.5">
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-sm text-vault-white">{f.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn-gold w-full"
            >
              Get Started — It's Free
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <div className="text-4xl">🔒</div>
              <h2 className="text-2xl font-bold">Your data, your control</h2>
              <p className="text-vault-gray text-sm leading-relaxed">
                We read your order emails to track return windows. Nothing else.
              </p>
            </div>

            {/* DPDP Consent card */}
            <div className="vault-card w-full p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-vault-gold bg-vault-gold/10 px-2 py-0.5 rounded">DPDP Act 2023</span>
                <span className="text-xs text-vault-gray">Data Protection Compliant</span>
              </div>

              <ul className="space-y-3 text-sm text-vault-gray">
                {[
                  'We only read order & shipping emails',
                  'No emails are stored — only order data',
                  'You can disconnect Gmail anytime',
                  'Data auto-deleted after 24 months',
                  'Never shared with third parties',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-vault-gold mt-0.5 flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Consent checkbox */}
              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-vault-border">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                    agreed
                      ? 'bg-vault-gold border-vault-gold'
                      : 'border-vault-border bg-transparent'
                  }`}
                >
                  {agreed && <span className="text-vault-black text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm text-vault-gray">
                  I agree to ReturnKart reading my order emails to track return windows, as described above.
                </span>
              </label>
            </div>

            {error && (
              <p className="text-vault-red text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleConnectGmail}
              disabled={!agreed}
              className="btn-gold w-full"
            >
              <span className="flex items-center justify-center gap-2">
                <GoogleIcon />
                Connect Gmail
              </span>
            </button>

            <button
              onClick={() => setStep(1)}
              className="text-vault-gray text-sm"
            >
              ← Back
            </button>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-16 h-16 rounded-full border-2 border-vault-gold border-t-transparent animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-white font-medium">Connecting to Google…</p>
              <p className="text-vault-gray text-sm">You'll be redirected to Google's sign-in page</p>
            </div>
          </div>
        )}

      </div>

      {/* Bottom safe area */}
      <div className="text-xs text-vault-border text-center pb-2">
        returnkart.in · Secure · DPDP Compliant
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
