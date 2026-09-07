import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

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

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setNotice('')
    setIsError(false)

    if (form.password.length < 6) {
      setIsError(true)
      setNotice('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setIsError(true)
      setNotice('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const data = await request(`/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: form.password }),
      })
      setIsSuccess(true)
      setNotice(data.message || 'Password reset successfully!')
      // Redirect to login after 2.5 seconds
      setTimeout(() => navigate('/'), 2500)
    } catch (err) {
      setIsError(true)
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
            Reset Password
          </h2>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Enter your new password below.
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
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <p style={{ margin: 0, color: '#6ee7b7', fontSize: '14px' }}>
                {notice}
              </p>
              <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                Redirecting you to login…
              </p>
            </div>
            <Link
              to="/"
              style={{ color: '#a78bfa', fontSize: '14px', textDecoration: 'none' }}
            >
              Go to Login now →
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '16px',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirm"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)'}`,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {form.confirm && form.confirm !== form.password && (
                <p style={{ margin: '6px 0 0', color: '#fca5a5', fontSize: '12px' }}>
                  Passwords don't match yet
                </p>
              )}
            </div>

            {/* Error notice */}
            {notice && isError && (
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
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                to="/"
                style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '13px' }}
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