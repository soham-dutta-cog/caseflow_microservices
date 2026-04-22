import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { auth } from '../../api/services'

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
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p className="muted">Enter the token from your email</p>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Token</label>
            <input value={form.token} onChange={upd('token')} required />
          </div>
          <div className="form-row">
            <label>New Password</label>
            <input type="password" minLength={6} value={form.newPassword} onChange={upd('newPassword')} required />
          </div>
          <div className="form-row">
            <label>Confirm Password</label>
            <input type="password" minLength={6} value={form.confirmPassword} onChange={upd('confirmPassword')} required />
          </div>
          <button className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <div className="links">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
