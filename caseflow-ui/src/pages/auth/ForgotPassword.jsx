import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../../api/services'

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
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p className="muted">Only @gmail.com addresses supported</p>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="links">
          <Link to="/login">Back to sign in</Link>
          <Link to="/reset-password">Have a token?</Link>
        </div>
      </div>
    </div>
  )
}
