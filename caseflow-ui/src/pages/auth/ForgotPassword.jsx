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
    <div className="auth-page d-flex align-items-center justify-content-center p-3">
      <div className="auth-card card shadow-lg border-0" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h1 className="h3 mb-1">Forgot Password</h1>
          <p className="text-muted mb-3">Only @gmail.com addresses supported</p>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {msg && <div className="alert alert-success py-2">{msg}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-dark w-100" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <div className="d-flex justify-content-between mt-3 small">
            <Link to="/login" className="text-decoration-none">Back to sign in</Link>
            <Link to="/reset-password" className="text-decoration-none">Have a token?</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
