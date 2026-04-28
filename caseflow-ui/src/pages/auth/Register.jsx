import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../../components/AppLayout.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'LITIGANT' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await register(form)
      setSuccess('Account created! Redirecting to sign in...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page d-flex" style={{ minHeight: '100vh' }}>
      {/* Left branding panel */}
      <div className="d-none d-lg-flex flex-column justify-content-between p-5" style={{
        width: '42%', background: 'linear-gradient(160deg, #0a0e1a 0%, #1a2340 60%, #253157 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(45,212,168,0.05)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '10%', width: 250, height: 250, borderRadius: '50%', background: 'rgba(201,168,76,0.06)', filter: 'blur(50px)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <span style={{ fontSize: 28, filter: 'grayscale(1) brightness(2)' }}>⚖</span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#fff' }}>
              Case<span style={{ color: '#c9a84c' }}>Flow</span>
            </span>
          </Link>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 600, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
            Join the platform<br />built for legal teams.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 340 }}>
            Create your account and start managing cases, tracking deadlines, and collaborating with your legal team instantly.
          </p>
        </div>

        <p style={{ position: 'relative', zIndex: 1, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 CaseFlow — Cognizant</p>
      </div>

      {/* Right form */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4" style={{ background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="d-lg-none text-center mb-4">
            <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none">
              <span style={{ fontSize: 22, filter: 'grayscale(1) brightness(0.5)' }}>⚖</span>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#0f1629' }}>Case<span style={{ color: '#c9a84c' }}>Flow</span></span>
            </Link>
          </div>

          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 600, color: '#0f1629', marginBottom: 4 }}>Create Account</h1>
          <p className="text-muted mb-4" style={{ fontSize: 14 }}>Register as a Litigant on CaseFlow</p>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {success && <div className="alert alert-success py-2 small">{success}</div>}

          <form onSubmit={submit}>
            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label fw-semibold small text-dark">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-person text-muted" /></span>
                  <input className="form-control border-start-0 ps-0" value={form.name} onChange={update('name')} placeholder="John Doe" minLength={2} maxLength={100} required style={{ boxShadow: 'none' }} />
                </div>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small text-dark">Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted" /></span>
                  <input className="form-control border-start-0 ps-0" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required style={{ boxShadow: 'none' }} />
                </div>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small text-dark">Phone (10 digits)</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-phone text-muted" /></span>
                  <input className="form-control border-start-0 ps-0" value={form.phone} onChange={update('phone')} placeholder="9876543210" pattern="\d{10}" required style={{ boxShadow: 'none' }} />
                </div>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small text-dark">Password (min 6 characters)</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted" /></span>
                  <input className="form-control border-start-0 border-end-0 ps-0" type={showPass ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Create a secure password" minLength={6} required style={{ boxShadow: 'none' }} />
                  <button type="button" className="input-group-text bg-light border-start-0" onClick={() => setShowPass(!showPass)} style={{ cursor: 'pointer' }}>
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'} text-muted`} />
                  </button>
                </div>
              </div>
            </div>
            <input type="hidden" value={form.role} />
            <button type="submit" className="btn w-100 fw-semibold mt-2" disabled={loading}
              style={{ background: '#0f1629', color: '#fff', padding: '11px', borderRadius: 10 }}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-4 small text-muted">
            Already have an account? <Link to="/login" className="fw-semibold" style={{ color: '#c9a84c', textDecoration: 'none' }}>Sign in</Link>
          </p>
          <div className="text-center">
            <Link to="/" className="text-muted small" style={{ textDecoration: 'none' }}>← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
