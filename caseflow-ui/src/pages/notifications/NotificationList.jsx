import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { notifications as notifApi } from '../../api/services'
import { statusBadgeClass, formatDateTime, NOTIF_CATEGORY } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function NotificationList() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'CLERK'

  // Admin/clerk can look up another user's notifications by entering their ID
  const [lookupId, setLookupId] = useState('')

  const [list, setList]           = useState([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [err, setErr]             = useState('')
  const [msg, setMsg]             = useState('')
  const [loading, setLoading]     = useState(false)

  // Manual create form — admin/clerk only
  const [createForm, setCreateForm] = useState({ userId: '', caseId: '', message: '', category: 'CASE' })

  const load = async () => {
    setLoading(true); setErr('')
    try {
      let data
      if (isPrivileged && lookupId.trim()) {
        // Admin looking up a specific user
        data = unreadOnly
          ? await notifApi.unread(lookupId.trim())
          : await notifApi.byUser(lookupId.trim())
      } else {
        // Own notifications — works for ALL roles
        data = unreadOnly
          ? await notifApi.myUnread()
          : await notifApi.my()
      }
      setList(data || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [unreadOnly, lookupId])

  const markRead = async (id) => {
    try { await notifApi.markRead(id); load() } catch (e) { setErr(e.message) }
  }

  const markAll = async () => {
    setErr(''); setMsg('')
    try {
      if (isPrivileged && lookupId.trim()) {
        await notifApi.markAllRead(lookupId.trim())
      } else {
        await notifApi.myMarkAllRead()
      }
      setMsg('All notifications marked as read.')
      load()
    } catch (e) { setErr(e.message) }
  }

  const create = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      await notifApi.create({
        userId:   createForm.userId.trim(),
        caseId:   createForm.caseId ? Number(createForm.caseId) : null,
        message:  createForm.message,
        category: createForm.category,
      })
      setMsg('Notification created successfully.')
      setCreateForm({ userId: '', caseId: '', message: '', category: 'CASE' })
      load()
    } catch (e) { setErr(e.message) }
  }

  const unreadCount = list.filter(n => n.status === 'UNREAD').length

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="page-title h3 mb-0">{t('Notifications')}</h1>
          {unreadCount > 0 && (
            <span className="badge text-bg-danger rounded-pill ms-2">{unreadCount} unread</span>
          )}
        </div>
        <button
          className="btn btn-dark btn-sm"
          onClick={markAll}
          disabled={list.filter(n => n.status === 'UNREAD').length === 0}
        >
          <i className="bi bi-check2-all me-1" />Mark All Read
        </button>
      </div>

      {err && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-triangle me-2" />{err}</div>}
      {msg && <div className="alert alert-success py-2"><i className="bi bi-check-circle me-2" />{msg}</div>}

      {/* Filter bar */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body py-2">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            {/* Admin-only: look up another user */}
            {isPrivileged && (
              <div className="d-flex align-items-center gap-2">
                <label className="form-label fw-semibold small mb-0 text-nowrap">User ID:</label>
                <input
                  className="form-control form-control-sm"
                  style={{ width: 180 }}
                  placeholder={`leave blank for your own`}
                  value={lookupId}
                  onChange={e => setLookupId(e.target.value)}
                />
              </div>
            )}
            <div className="form-check mb-0">
              <input
                id="unreadOnly"
                className="form-check-input"
                type="checkbox"
                checked={unreadOnly}
                onChange={e => setUnreadOnly(e.target.checked)}
              />
              <label htmlFor="unreadOnly" className="form-check-label small">Unread only</label>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>
              <i className="bi bi-arrow-clockwise me-1" />{t('Refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications table */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center text-muted py-5">{t('Loading...')}</div>
          ) : list.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-bell-slash display-4 d-block mb-3 opacity-25" />
              <p className="mb-0">No notifications{unreadOnly ? ' (unread)' : ''} found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Case</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(n => (
                    <tr key={n.notificationId} className={n.status === 'UNREAD' ? 'fw-semibold' : ''}>
                      <td className="text-muted small">#{n.notificationId}</td>
                      <td>
                        <span className={`badge rounded-pill ${
                          n.category === 'COMPLIANCE' ? 'text-bg-warning' :
                          n.category === 'HEARING'    ? 'text-bg-info'    :
                          n.category === 'APPEAL'     ? 'text-bg-secondary' :
                          'text-bg-primary'
                        }`}>
                          {n.category}
                        </span>
                      </td>
                      <td>
                        {n.caseId
                          ? <Link to={`/cases/${n.caseId}`} className="fw-semibold">#{n.caseId}</Link>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td style={{ maxWidth: 340 }} className="small">{n.message}</td>
                      <td>
                        <span className={`badge rounded-pill ${statusBadgeClass(n.status)}`}>
                          {n.status}
                        </span>
                      </td>
                      <td className="small text-nowrap">{formatDateTime(n.createdDate)}</td>
                      <td>
                        {n.status === 'UNREAD' && (
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => markRead(n.notificationId)}
                          >
                            <i className="bi bi-check2 me-1" />Read
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manual create — admin/clerk only */}
      {isPrivileged && (
        <div className="card shadow-sm border-0">
          <div className="card-header border-bottom" style={{ background: 'transparent' }}>
            <h2 className="h6 mb-0 fw-semibold d-flex align-items-center gap-2">
              <i className="bi bi-plus-circle text-primary" />
              Send Notification
              <span className="text-muted fw-normal small">(manual — admin / clerk)</span>
            </h2>
          </div>
          <div className="card-body">
            <form onSubmit={create}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Recipient User ID <span className="text-danger">*</span></label>
                  <input
                    className="form-control"
                    placeholder="e.g. user@example.com"
                    value={createForm.userId}
                    onChange={e => setCreateForm({ ...createForm, userId: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Case ID <span className="text-muted fw-normal">(optional)</span></label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="Case ID"
                    value={createForm.caseId}
                    onChange={e => setCreateForm({ ...createForm, caseId: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Category</label>
                  <select
                    className="form-select"
                    value={createForm.category}
                    onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                  >
                    {(NOTIF_CATEGORY || ['CASE', 'HEARING', 'APPEAL', 'COMPLIANCE']).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">Message <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={createForm.message}
                    onChange={e => setCreateForm({ ...createForm, message: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-dark d-flex align-items-center gap-2">
                  <i className="bi bi-send" />Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
