import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { users } from '../../api/services'
import { ROLES, USER_STATUS, statusBadgeClass } from '../../utils/constants'

export default function UserList() {
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CLERK' })

  const load = async () => {
    setLoading(true); setErr('')
    try { setList(await users.list() || []) } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      await users.create(form)
      setMsg('User created'); setForm({ name: '', email: '', phone: '', password: '', role: 'CLERK' }); load()
    } catch (e) { setErr(e.message) }
  }

  const setStatus = async (id, status) => {
    try { await users.setStatus(id, status); setMsg('Status updated'); load() } catch (e) { setErr(e.message) }
  }
  const resetPwd = async (id) => {
    const p = prompt('New password (min 6 chars):')
    if (!p || p.length < 6) return
    try { await users.resetPassword(id, p); setMsg('Password reset') } catch (e) { setErr(e.message) }
  }
  const del = async (id) => {
    if (!confirm('Delete user?')) return
    try { await users.del(id); setMsg('User deleted'); load() } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Users</h1></div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <h3>Create User</h3>
        <form onSubmit={create}>
          <div className="form-grid">
            <div className="form-row"><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} minLength={2} maxLength={100} required /></div>
            <div className="form-row"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="form-row"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} pattern="\d{10}" required /></div>
            <div className="form-row"><label>Password</label><input type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="form-row">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary">Create User</button>
        </form>
      </div>

      <div className="card">
        {loading ? <div className="empty">Loading...</div> : list.length === 0 ? <div className="empty">No users</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map(u => (
                <tr key={u.userId}>
                  <td>{u.userId}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(u.status)}`}>{u.status}</span></td>
                  <td className="row-actions">
                    <select value={u.status} onChange={e => setStatus(u.userId, e.target.value)}>
                      {USER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm" onClick={() => resetPwd(u.userId)}>Reset Pwd</button>
                    <Link to={`/users/audit-logs/${u.userId}`} className="btn btn-ghost btn-sm">Logs</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => del(u.userId)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
