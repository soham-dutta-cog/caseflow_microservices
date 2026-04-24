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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Notifications</h1>
        <button className="btn btn-dark btn-sm" onClick={markAll} disabled={!userId}>Mark All Read</button>
      </div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <label className="form-label fw-semibold small mb-0">User ID:</label>
            <input className="form-control form-control-sm w-auto" value={userId} onChange={e => setUserId(e.target.value)} />
            <div className="form-check">
              <input id="unreadOnly" className="form-check-input" type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} />
              <label htmlFor="unreadOnly" className="form-check-label small">Unread only</label>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>Refresh</button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          {loading ? <div className="text-center text-muted py-4">Loading...</div> : list.length === 0 ? <div className="text-center text-muted py-4">No notifications</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Category</th><th>Case</th><th>Message</th><th>Status</th><th>Date</th><th></th></tr></thead>
                <tbody>
                  {list.map(n => (
                    <tr key={n.notificationId}>
                      <td>#{n.notificationId}</td>
                      <td>{n.category}</td>
                      <td>{n.caseId ? <Link to={`/cases/${n.caseId}`}>#{n.caseId}</Link> : '-'}</td>
                      <td>{n.message}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(n.status)}`}>{n.status}</span></td>
                      <td>{formatDateTime(n.createdDate)}</td>
                      <td>{n.status === 'UNREAD' && <button className="btn btn-outline-secondary btn-sm" onClick={() => markRead(n.notificationId)}>Mark Read</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="h5 mb-3">Create Notification</h3>
          <form onSubmit={create}>
            <div className="row g-3">
              <div className="col-md-4"><label className="form-label fw-semibold small">User ID</label><input className="form-control" type="number" value={createForm.userId} onChange={e => setCreateForm({ ...createForm, userId: e.target.value })} required /></div>
              <div className="col-md-4"><label className="form-label fw-semibold small">Case ID (optional)</label><input className="form-control" type="number" value={createForm.caseId} onChange={e => setCreateForm({ ...createForm, caseId: e.target.value })} /></div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Category</label>
                <select className="form-select" value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                  {NOTIF_CATEGORY.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 mb-3"><label className="form-label fw-semibold small">Message</label><textarea className="form-control" value={createForm.message} onChange={e => setCreateForm({ ...createForm, message: e.target.value })} required /></div>
            <button className="btn btn-dark">Create</button>
          </form>
        </div>
      </div>
    </div>
  )
}
