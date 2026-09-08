import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import './ForgotPassword.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://music-website-zzol.onrender.com/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      setNotice('Please enter your email address.')
      return
    }
    setLoading(true)
    setNotice('')
    try {
      const data = await request('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setIsSuccess(true)
      setNotice(data.message || 'Check your email for the reset link.')
    } catch (err) {
      setNotice(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">◒</span> SONORA
          <span className="brand-dot">.</span>
        </Link>
        <Link className="ghost-btn" to="/">Back to sign in</Link>
      </header>
      <section className="auth-layout" id="top">
        <div className="intro">
          <p className="eyebrow">ACCOUNT RECOVERY / 03</p>
          <h1>
            Keep your
            <br />
            <em>frequency.</em>
          </h1>
          <p className="intro-copy">
            We&apos;ll send a secure link so you can get back to the sounds waiting
            in your Sonora rotation.
          </p>
          <div className="signal">
            <span className="signal-bars">▂ ▅ ▇ ▆ ▃</span>
            <span>secure and private</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="card-top">
            <span>Reset access</span>
            <span className="card-index">03</span>
          </div>
          <h2>
            Find your
            <br />
            way back.
          </h2>

          {isSuccess ? (
            <div className="auth-feedback auth-success">
              <p>{notice}</p>
              <span>Check your inbox and spam folder for the reset link.</span>
              <Link className="switch-btn" to="/">Back to sign in  →</Link>
            </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="forgot-email">Email address</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {notice && (
              <p className="auth-feedback auth-error">
                {notice}
              </p>
            )}

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link  →'}
            </button>

            <Link className="switch-btn" to="/">Back to sign in</Link>
          </form>
        )}
        </div>
      </section>
    </main>
  )
}