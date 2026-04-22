import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { notifications as notifApi } from '../../api/services'
import { statusBadgeClass, formatDateTime, NOTIF_CATEGORY } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function NotificationList() {
  const { user } = useAuth()
  const [userId, setUserId] = useState(user?.email || '')
  const [list, setList] = useState([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [createForm, setCreateForm] = useState({ userId: '', caseId: '', message: '', category: 'CASE_UPDATE' })

  const load = async () => {
    if (!userId) return
    setLoading(true); setErr('')
    try {
      const data = unreadOnly ? await notifApi.unread(userId) : await notifApi.byUser(userId)
      setList(data || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [userId, unreadOnly])

  const markRead = async (id) => {
    try { await notifApi.markRead(id); load() } catch (e) { setErr(e.message) }
  }
  const markAll = async () => {
    try { await notifApi.markAllRead(userId); setMsg('All marked read'); load() } catch (e) { setErr(e.message) }
  }

  const create = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      await notifApi.create({
        userId: Number(createForm.userId),
        caseId: createForm.caseId ? Number(createForm.caseId) : null,
        message: createForm.message,
        category: createForm.category,
      })
      setMsg('Notification created'); setCreateForm({ userId: '', caseId: '', message: '', category: 'CASE_UPDATE' }); load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <button className="btn btn-primary btn-sm" onClick={markAll} disabled={!userId}>Mark All Read</button>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <div className="flex-row">
          <label>User ID:</label>
          <input value={userId} onChange={e => setUserId(e.target.value)} />
          <label><input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} /> Unread only</label>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="empty">Loading...</div> : list.length === 0 ? <div className="empty">No notifications</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Category</th><th>Case</th><th>Message</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {list.map(n => (
                <tr key={n.notificationId}>
                  <td>#{n.notificationId}</td>
                  <td>{n.category}</td>
                  <td>{n.caseId ? <Link to={`/cases/${n.caseId}`}>#{n.caseId}</Link> : '-'}</td>
                  <td>{n.message}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(n.status)}`}>{n.status}</span></td>
                  <td>{formatDateTime(n.createdDate)}</td>
                  <td>{n.status === 'UNREAD' && <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.notificationId)}>Mark Read</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Create Notification</h3>
        <form onSubmit={create}>
          <div className="form-grid">
            <div className="form-row"><label>User ID</label><input type="number" value={createForm.userId} onChange={e => setCreateForm({ ...createForm, userId: e.target.value })} required /></div>
            <div className="form-row"><label>Case ID (optional)</label><input type="number" value={createForm.caseId} onChange={e => setCreateForm({ ...createForm, caseId: e.target.value })} /></div>
            <div className="form-row">
              <label>Category</label>
              <select value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                {NOTIF_CATEGORY.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row"><label>Message</label><textarea value={createForm.message} onChange={e => setCreateForm({ ...createForm, message: e.target.value })} required /></div>
          <button className="btn btn-primary">Create</button>
        </form>
      </div>
    </div>
  )
}
