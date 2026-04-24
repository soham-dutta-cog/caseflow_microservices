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
    <div className="auth-page d-flex align-items-center justify-content-center p-3">
      <div className="auth-card card shadow-lg border-0" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h1 className="h3 mb-1">Sign In</h1>
          <p className="text-muted mb-3">Access your CaseFlow account</p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Password</label>
              <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="form-check mb-3">
              <input id="rm" className="form-check-input" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
              <label htmlFor="rm" className="form-check-label small">Remember me for 7 days</label>
            </div>
            <button type="submit" className="btn btn-dark w-100" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="d-flex justify-content-between mt-3 small">
            <Link to="/forgot-password" className="text-decoration-none">Forgot password?</Link>
            <Link to="/register" className="text-decoration-none">Create account</Link>
          </div>
          <div className="text-center mt-3">
            <Link to="/" className="text-muted text-decoration-none small">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
