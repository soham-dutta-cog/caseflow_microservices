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
      <div className="page-header"><h1 className="page-title">Change Password</h1></div>
      <div className="card" style={{ maxWidth: 500 }}>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Email</label>
            <input value={user?.email || ''} disabled />
          </div>
          <div className="form-row">
            <label>Current Password</label>
            <input type="password" value={form.oldPassword} onChange={e => setForm({ ...form, oldPassword: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>New Password</label>
            <input type="password" minLength={6} value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  )
}
