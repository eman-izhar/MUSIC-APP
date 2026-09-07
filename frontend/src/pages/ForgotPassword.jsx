import { useState } from 'react'
import { Link } from 'react-router-dom'

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
      }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '8px',
          }}>🔑</div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
            Forgot Password?
          </h2>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {isSuccess ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📬</div>
              <p style={{ margin: 0, color: '#6ee7b7', fontSize: '14px' }}>
                {notice}
              </p>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              Didn't get the email? Check your spam folder.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                marginTop: '12px',
                color: '#a78bfa',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              ← Back to Login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {notice && (
              <div style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#fca5a5',
              }}>
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? 'rgba(124,58,237,0.5)' : '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                to="/"
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  fontSize: '13px',
                }}
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}