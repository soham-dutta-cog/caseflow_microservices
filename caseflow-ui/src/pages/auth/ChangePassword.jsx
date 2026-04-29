import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { auth } from '../../api/services'

export default function ChangePassword() {
  const { user } = useAuth()
  const [form, setForm] = useState({ oldPassword: '', newPassword: '' })
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    setLoading(true)
    try {
      const res = await auth.changePassword({ email: user.email, ...form })
      setMsg(typeof res === 'string' ? res : 'Password changed')
      setForm({ oldPassword: '', newPassword: '' })
    } catch (e) { setErr(e.message || 'Change failed') } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Change Password</h1>
      </div>
      <div className="card shadow-sm" style={{ maxWidth: 500 }}>
        <div className="card-body">
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {msg && <div className="alert alert-success py-2">{msg}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Email</label>
              <input className="form-control" value={user?.email || ''} disabled />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Current Password</label>
              <input className="form-control" type="password" value={form.oldPassword} onChange={e => setForm({ ...form, oldPassword: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">New Password</label>
              <input className="form-control" type="password" minLength={6} value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
            </div>
            <button className="btn btn-dark" disabled={loading}>{loading ? 'Saving...' : 'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
