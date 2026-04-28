import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../../api/services'
import '../../components/AppLayout.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    setLoading(true)
    try {
      const res = await auth.forgotPassword({ email })
      setMsg(typeof res === 'string' ? res : 'Reset link sent to your email')
    } catch (e) {
      setErr(e.message || 'Request failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page d-flex" style={{ minHeight: '100vh' }}>
      {/* Left branding */}
      <div className="d-none d-lg-flex flex-column justify-content-center align-items-center p-5" style={{
        width: '42%', background: 'linear-gradient(160deg, #0a0e1a 0%, #1a2340 60%, #253157 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, borderRadius: '50%', background: 'rgba(201,168,76,0.05)', filter: 'blur(80px)' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="mb-4" style={{ fontSize: 48, filter: 'grayscale(1) brightness(2)' }}>⚖</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Forgot your password?</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 300, margin: '0 auto' }}>No worries. We'll send you a reset link to get back into your account.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4" style={{ background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="d-lg-none text-center mb-4">
            <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none">
              <span style={{ fontSize: 22, filter: 'grayscale(1) brightness(0.5)' }}>⚖</span>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#0f1629' }}>Case<span style={{ color: '#c9a84c' }}>Flow</span></span>
            </Link>
          </div>

          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 600, color: '#0f1629', marginBottom: 4 }}>Reset Password</h1>
          <p className="text-muted mb-4" style={{ fontSize: 14 }}>Enter your @gmail.com email address</p>

          {err && <div className="alert alert-danger py-2 small">{err}</div>}
          {msg && <div className="alert alert-success py-2 small">{msg}</div>}

          <form onSubmit={submit}>
            <div className="mb-4">
              <label className="form-label fw-semibold small text-dark">Email address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted" /></span>
                <input className="form-control border-start-0 ps-0" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" required style={{ boxShadow: 'none' }} />
              </div>
            </div>
            <button className="btn w-100 fw-semibold" disabled={loading}
              style={{ background: '#0f1629', color: '#fff', padding: '11px', borderRadius: 10 }}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</> : 'Send Reset Link'}
            </button>
          </form>

          <div className="d-flex justify-content-between mt-4 small">
            <Link to="/login" style={{ color: '#c9a84c', textDecoration: 'none' }}>← Back to sign in</Link>
            <Link to="/reset-password" style={{ color: '#6b7faa', textDecoration: 'none' }}>Have a token?</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
