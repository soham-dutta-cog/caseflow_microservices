import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { notifications as notifApi } from '../../api/services'
import { statusBadgeClass, formatDateTime } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function NotificationList() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'CLERK'

  // Admin/clerk can look up another user's notifications by entering their ID
  const [lookupId, setLookupId] = useState('')

  const [list, setList]     = useState([])
  // Default = UNREAD ONLY. User clicks "Show All" to see everything.
  const [showAll, setShowAll] = useState(false)
  const [err, setErr]       = useState('')
  const [msg, setMsg]       = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      let data
      if (isPrivileged && lookupId.trim()) {
        data = showAll
          ? await notifApi.byUser(lookupId.trim())
          : await notifApi.unread(lookupId.trim())
      } else {
        data = showAll
          ? await notifApi.my()
          : await notifApi.myUnread()
      }
      setList(Array.isArray(data) ? data : [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [showAll, lookupId])

  const markRead = async (id) => {
    try {
      await notifApi.markRead(id)
      // Optimistic local update so the bell icon and the list both feel instant.
      if (showAll) {
        setList(prev => prev.map(n => n.notificationId === id ? { ...n, status: 'READ' } : n))
      } else {
        setList(prev => prev.filter(n => n.notificationId !== id))
      }
    } catch (e) { setErr(e.message) }
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

  const unreadCount = list.filter(n => n.status === 'UNREAD').length
  const inboxCount  = list.length

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <h1 className="page-title h3 mb-0">{t('Notifications')}</h1>
          {unreadCount > 0 && (
            <span className="badge text-bg-danger rounded-pill">{unreadCount} unread</span>
          )}
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={markAll}
            disabled={unreadCount === 0}
            title={unreadCount === 0 ? 'No unread notifications' : 'Mark every notification as read'}
          >
            <i className="bi bi-check2-all me-1" />Mark All Read
          </button>
          {isPrivileged && (
            <Link to="/notifications/create" className="btn btn-primary btn-sm">
              <i className="bi bi-plus-circle me-1" />Send Notification
            </Link>
          )}
        </div>
      </div>

      {err && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-triangle me-2" />{err}</div>}
      {msg && <div className="alert alert-success py-2"><i className="bi bi-check-circle me-2" />{msg}</div>}

      {/* Filter bar */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body py-2">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            {/* Toggle: unread only ↔ all */}
            <div className="btn-group btn-group-sm" role="group" aria-label="View filter">
              <button
                type="button"
                className={`btn ${!showAll ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => setShowAll(false)}
              >
                <i className="bi bi-bell-fill me-1" />Unread
                {!showAll && unreadCount > 0 && (
                  <span className="badge bg-danger ms-2">{unreadCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`btn ${showAll ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => setShowAll(true)}
              >
                <i className="bi bi-archive me-1" />Show All
                {showAll && <span className="badge bg-light text-dark ms-2">{inboxCount}</span>}
              </button>
            </div>

            {/* Admin-only: look up another user */}
            {isPrivileged && (
              <div className="d-flex align-items-center gap-2">
                <label className="form-label fw-semibold small mb-0 text-nowrap">User ID:</label>
                <input
                  className="form-control form-control-sm"
                  style={{ width: 200 }}
                  placeholder="leave blank for your own"
                  value={lookupId}
                  onChange={e => setLookupId(e.target.value)}
                />
                {lookupId.trim() && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setLookupId('')}
                    title="Clear and view your own notifications"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                )}
              </div>
            )}

            <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={load}>
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
              <i className={`bi ${showAll ? 'bi-inbox' : 'bi-bell-slash'} display-4 d-block mb-3 opacity-25`} />
              <p className="mb-0 fw-semibold">
                {showAll ? 'No notifications yet.' : 'You\'re all caught up!'}
              </p>
              <p className="text-muted small">
                {showAll ? 'You\'ll see notifications here as they arrive.' : 'No unread notifications.'}
              </p>
              {!showAll && (
                <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => setShowAll(true)}>
                  <i className="bi bi-archive me-1" />Show All Notifications
                </button>
              )}
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
                      <td style={{ maxWidth: 360 }} className="small">{n.message}</td>
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
    </div>
  )
}
