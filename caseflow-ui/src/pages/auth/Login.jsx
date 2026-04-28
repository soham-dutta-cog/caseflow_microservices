import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../../components/AppLayout.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      const to = location.state?.from?.pathname || '/dashboard'
      navigate(to, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page d-flex" style={{ minHeight: '100vh' }}>
      {/* Left branding panel - hidden on mobile */}
      <div className="d-none d-lg-flex flex-column justify-content-between p-5" style={{
        width: '45%', background: 'linear-gradient(160deg, #0a0e1a 0%, #1a2340 60%, #253157 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-15%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(201,168,76,0.06)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(45,212,168,0.04)', filter: 'blur(50px)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none mb-5">
            <span style={{ fontSize: 28, filter: 'grayscale(1) brightness(2)' }}>⚖</span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#fff' }}>
              Case<span style={{ color: '#c9a84c' }}>Flow</span>
            </span>
          </Link>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 3.5vw, 44px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
            Justice deserves<br />modern tools.
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 380 }}>
            Manage cases, track deadlines, schedule hearings, and ensure compliance — all from one intelligent platform built for legal teams.
          </p>

          <div className="d-flex gap-4 mt-5">
            {[
              { num: '8', label: 'Microservices' },
              { num: '50+', label: 'API Endpoints' },
              { num: '100%', label: 'Secured' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#c9a84c' }}>{s.num}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 CaseFlow — Cognizant Internship Project</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4" style={{ background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile-only logo */}
          <div className="d-lg-none text-center mb-4">
            <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none">
              <span style={{ fontSize: 24, filter: 'grayscale(1) brightness(0.5)' }}>⚖</span>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#0f1629' }}>
                Case<span style={{ color: '#c9a84c' }}>Flow</span>
              </span>
            </Link>
          </div>

          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 600, color: '#0f1629', marginBottom: 4 }}>Welcome back</h1>
          <p className="text-muted mb-4" style={{ fontSize: 14 }}>Sign in to your CaseFlow account</p>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-dark">Email address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted" /></span>
                <input className="form-control border-start-0 ps-0" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required style={{ boxShadow: 'none' }} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-dark">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted" /></span>
                <input className="form-control border-start-0 border-end-0 ps-0" type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ boxShadow: 'none' }} />
                <button type="button" className="input-group-text bg-light border-start-0" onClick={() => setShowPass(!showPass)} style={{ cursor: 'pointer' }}>
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'} text-muted`} />
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input id="rm" className="form-check-input" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                <label htmlFor="rm" className="form-check-label small">Remember for 7 days</label>
              </div>
              <Link to="/forgot-password" className="small fw-medium" style={{ color: '#c9a84c', textDecoration: 'none' }}>Forgot password?</Link>
            </div>

            <button type="submit" className="btn w-100 fw-semibold" disabled={loading}
              style={{ background: '#0f1629', color: '#fff', padding: '11px', borderRadius: 10, transition: 'all 0.2s' }}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-4 small text-muted">
            Don't have an account? <Link to="/register" className="fw-semibold" style={{ color: '#c9a84c', textDecoration: 'none' }}>Create one</Link>
          </p>
          <div className="text-center">
            <Link to="/" className="text-muted small" style={{ textDecoration: 'none' }}>← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
