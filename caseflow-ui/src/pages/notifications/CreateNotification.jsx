import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { notifications as notifApi, users as usersApi } from '../../api/services'
import { NOTIF_CATEGORY } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

/**
 * Manual notification creation — admin / clerk only.
 * Lives on its own route so the main /notifications page is just the inbox.
 */
export default function CreateNotification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'CLERK'

  const [form, setForm]       = useState({ userId: '', caseId: '', message: '', category: 'CASE' })
  const [err, setErr]         = useState('')
  const [msg, setMsg]         = useState('')
  const [busy, setBusy]       = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setBusy(true)
    try {
      await notifApi.create({
        userId:   form.userId.trim(),
        caseId:   form.caseId ? Number(form.caseId) : null,
        message:  form.message,
        category: form.category,
      })
      setMsg('Notification sent successfully.')
      setForm({ userId: '', caseId: '', message: '', category: 'CASE' })
    } catch (e) {
      setErr(e.message || 'Failed to send notification.')
    } finally {
      setBusy(false)
    }
  }

  if (!isPrivileged) {
    return (
      <div>
        <div className="alert alert-warning">
          <i className="bi bi-shield-lock me-2" />
          You don't have permission to send notifications.
          Only ADMIN and CLERK roles can do that.
        </div>
        <Link to="/notifications" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1" />Back to Inbox
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <Link to="/notifications" className="btn btn-link p-0 small text-muted mb-2 text-decoration-none">
            <i className="bi bi-arrow-left me-1" />Back to Inbox
          </Link>
          <h1 className="page-title h3 mb-0">Send Notification</h1>
          <p className="text-muted small mb-0 mt-1">
            Compose and dispatch a notification to a specific user.
          </p>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-triangle me-2" />{err}</div>}
      {msg && <div className="alert alert-success py-2"><i className="bi bi-check-circle me-2" />{msg}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-header border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
          <i className="bi bi-send text-primary" />
          <h2 className="h6 mb-0 fw-semibold">Compose</h2>
        </div>
        <div className="card-body">
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  Recipient User ID <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="e.g. JOH_LITIGANT_1 or user@example.com"
                  value={form.userId}
                  onChange={e => setForm({ ...form, userId: e.target.value })}
                  required
                  disabled={busy}
                />
                <div className="form-text small">User-id of the recipient (or their email).</div>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold small">
                  Case ID <span className="text-muted fw-normal">(optional)</span>
                </label>
                <input
                  className="form-control"
                  type="number"
                  placeholder="e.g. 42"
                  value={form.caseId}
                  onChange={e => setForm({ ...form, caseId: e.target.value })}
                  disabled={busy}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold small">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  disabled={busy}
                >
                  {(NOTIF_CATEGORY || ['CASE', 'HEARING', 'APPEAL', 'COMPLIANCE']).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold small">
                  Message <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="What do you want to tell this user?"
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                  disabled={busy}
                />
              </div>
            </div>

            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-dark d-flex align-items-center gap-2" disabled={busy}>
                {busy
                  ? <><span className="spinner-border spinner-border-sm" />Sending…</>
                  : <><i className="bi bi-send" />Send Notification</>}
              </button>
              <Link to="/notifications" className="btn btn-outline-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
