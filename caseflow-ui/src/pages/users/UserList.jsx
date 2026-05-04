import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { users } from '../../api/services'
import { ROLES, USER_STATUS, statusBadgeClass } from '../../utils/constants'
import { useLanguage } from '../../context/LanguageContext'

export default function UserList() {
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CLERK' })

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let pwd = ''
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    setForm(f => ({ ...f, password: pwd }))
    setShowPass(true)
  }

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
      setMsg('User created'); setForm({ name: '', email: '', phone: '', password: '', role: 'CLERK' }); setShowPass(false); load()
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
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">{t('Users')}</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Create User</h3>
          <form onSubmit={create}>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold small">{t('Name')}</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} minLength={2} maxLength={100} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">{t('Email')}</label><input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Phone</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} pattern="\d{10}" required /></div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">{t('Password')}</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type={showPass ? 'text' : 'password'}
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Type or generate"
                    required
                    style={{ boxShadow: 'none' }}
                  />
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(v => !v)} title="Show/hide">
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                  <button type="button" className="btn btn-outline-dark" onClick={generatePassword} title="Auto-generate password">
                    <i className="bi bi-arrow-clockwise me-1" />Generate
                  </button>
                </div>

              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">{t('Role')}</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-dark mt-3">Create User</button>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? <div className="text-center text-muted py-4">{t('Loading...')}</div> : list.length === 0 ? <div className="text-center text-muted py-4">No users</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>{t('ID')}</th><th>{t('Name')}</th><th>{t('Email')}</th><th>Phone</th><th>{t('Role')}</th><th>{t('STATUS')}</th><th>{t('Action')}</th></tr></thead>
                <tbody>
                  {list.map(u => (
                    <tr key={u.userId}>
                      <td>{u.userId}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>{u.role}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(u.status)}`}>{u.status}</span></td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap align-items-center">
                          <select className="form-select form-select-sm w-auto" value={u.status} onChange={e => setStatus(u.userId, e.target.value)}>
                            {USER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => resetPwd(u.userId)}>Reset Pwd</button>
                          <Link to={`/users/audit-logs/${u.userId}`} className="btn btn-outline-secondary btn-sm">Logs</Link>
                          <button className="btn btn-danger btn-sm" onClick={() => del(u.userId)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
