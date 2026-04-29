import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { auth } from '../../api/services'
import '../../components/AppLayout.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [form, setForm] = useState({
    token: params.get('token') || '',
    newPassword: '',
    confirmPassword: '',
  })
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (form.newPassword !== form.confirmPassword) {
      setErr('Passwords do not match'); return
    }
    setLoading(true)
    try {
      const res = await auth.resetPassword(form)
      setMsg(typeof res === 'string' ? res : 'Password reset. Redirecting...')
      setTimeout(() => nav('/login'), 1500)
    } catch (e) { setErr(e.message || 'Reset failed') } finally { setLoading(false) }
  }

  return (
    <div className="auth-page d-flex" style={{ minHeight: '100vh' }}>
      {/* Left branding */}
      <div className="d-none d-lg-flex flex-column justify-content-center align-items-center p-5" style={{
        width: '42%', background: 'linear-gradient(160deg, #0a0e1a 0%, #1a2340 60%, #253157 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(74,144,217,0.05)', filter: 'blur(60px)' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="mb-4" style={{ fontSize: 48, filter: 'grayscale(1) brightness(2)' }}>⚖</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Set your new password</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 280, margin: '0 auto' }}>Enter the reset token from your email and choose a new password.</p>
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
          <p className="text-muted mb-4" style={{ fontSize: 14 }}>Enter the token from your email</p>

          {err && <div className="alert alert-danger py-2 small">{err}</div>}
          {msg && <div className="alert alert-success py-2 small">{msg}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-dark">Reset Token</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-key text-muted" /></span>
                <input className="form-control border-start-0 ps-0" value={form.token} onChange={upd('token')} placeholder="Paste token here" required style={{ boxShadow: 'none' }} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-dark">New Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted" /></span>
                <input className="form-control border-start-0 border-end-0 ps-0" type={showPass ? 'text' : 'password'} minLength={6} value={form.newPassword} onChange={upd('newPassword')} required style={{ boxShadow: 'none' }} />
                <button type="button" className="input-group-text bg-light border-start-0" onClick={() => setShowPass(!showPass)} style={{ cursor: 'pointer' }}>
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'} text-muted`} />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold small text-dark">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-shield-check text-muted" /></span>
                <input className="form-control border-start-0 ps-0" type={showPass ? 'text' : 'password'} minLength={6} value={form.confirmPassword} onChange={upd('confirmPassword')} required style={{ boxShadow: 'none' }} />
              </div>
            </div>
            <button className="btn w-100 fw-semibold" disabled={loading}
              style={{ background: '#0f1629', color: '#fff', padding: '11px', borderRadius: 10 }}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Resetting...</> : 'Reset Password'}
            </button>
          </form>

          <div className="mt-4 small">
            <Link to="/login" style={{ color: '#c9a84c', textDecoration: 'none' }}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
