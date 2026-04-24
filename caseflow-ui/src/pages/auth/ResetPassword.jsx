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
    <div className="auth-page d-flex align-items-center justify-content-center p-3">
      <div className="auth-card card shadow-lg border-0" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h1 className="h3 mb-1">Reset Password</h1>
          <p className="text-muted mb-3">Enter the token from your email</p>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {msg && <div className="alert alert-success py-2">{msg}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Token</label>
              <input className="form-control" value={form.token} onChange={upd('token')} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">New Password</label>
              <input className="form-control" type="password" minLength={6} value={form.newPassword} onChange={upd('newPassword')} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Confirm Password</label>
              <input className="form-control" type="password" minLength={6} value={form.confirmPassword} onChange={upd('confirmPassword')} required />
            </div>
            <button className="btn btn-dark w-100" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          <div className="mt-3 small">
            <Link to="/login" className="text-decoration-none">Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
