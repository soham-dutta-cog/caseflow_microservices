import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hearings } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const statusIcon = {
  SCHEDULED: 'bi-calendar-check',
  RESCHEDULED: 'bi-calendar-event',
  COMPLETED: 'bi-patch-check',
  CANCELLED: 'bi-calendar-x',
}

const cardStyle = { borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }

export default function HearingDetail() {
  const { hearingId } = useParams()
  const { user } = useAuth()
  const [h, setH] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [resched, setResched] = useState({ newDate: '', newTime: '', newScheduleId: '', rescheduleReason: '' })
  const [complete, setComplete] = useState({ hearingNotes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try { setH(await hearings.get(hearingId)) } catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [hearingId])

  const doReschedule = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setSubmitting(true)
    try {
      await hearings.reschedule(hearingId, {
        newDate: resched.newDate,
        newTime: resched.newTime,
        newScheduleId: Number(resched.newScheduleId),
        rescheduleReason: resched.rescheduleReason,
        clerkId: user.userId,
      })
      setMsg('Hearing rescheduled successfully.')
      setResched({ newDate: '', newTime: '', newScheduleId: '', rescheduleReason: '' })
      load()
    } catch (e) { setErr(e.message) } finally { setSubmitting(false) }
  }

  const doComplete = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setSubmitting(true)
    try {
      await hearings.complete(hearingId, {
        judgeId: user.userId,
        hearingNotes: complete.hearingNotes,
      })
      setMsg('Hearing marked as completed.')
      load()
    } catch (e) { setErr(e.message) } finally { setSubmitting(false) }
  }

  if (!h) return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Hearing</h1>
      </div>
      {err && <div className="alert alert-danger py-2" style={{ borderRadius: 10 }}>{err}</div>}
      <div className="card border-0 d-flex align-items-center justify-content-center py-5" style={cardStyle}>
        <div className="spinner-border spinner-border-sm text-muted mb-2" role="status" />
        <div className="text-muted" style={{ fontSize: 14 }}>Loading hearing details...</div>
      </div>
    </div>
  )

  const canClerk = ['CLERK', 'ADMIN'].includes(user?.role)
  const canJudge = ['JUDGE', 'ADMIN'].includes(user?.role)
  const isActive = h.status !== 'COMPLETED' && h.status !== 'CANCELLED'
  const icon = statusIcon[h.status] || 'bi-calendar-event'

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/hearings" className="text-muted" style={{ fontSize: 13, textDecoration: 'none' }}>
              <i className="bi bi-arrow-left me-1" />Hearings
            </Link>
            <span className="text-muted" style={{ fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: '#c9a84c', fontWeight: 500 }}>#{h.hearingId}</span>
          </div>
          <h1 className="page-title h3 mb-0">Hearing #{h.hearingId}</h1>
        </div>
        <span className={`badge rounded-pill ${statusBadgeClass(h.status)}`} style={{ fontSize: 13, padding: '7px 16px' }}>
          <i className={`bi ${icon} me-1`} />{h.status}
        </span>
      </div>

      {err && <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: 10 }}>{err}</div>}
      {msg && <div className="alert alert-success py-2 mb-3" style={{ borderRadius: 10 }}><i className="bi bi-check-circle me-2" />{msg}</div>}

      {/* Info card */}
      <div className="card border-0 mb-3" style={cardStyle}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #c9a84c, #d4b865)' }}>
              <i className="bi bi-calendar-event text-white" style={{ fontSize: 16 }} />
            </div>
            <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>Hearing Details</h3>
          </div>

          <div className="row g-3">
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3" style={{ background: '#f8f9fc' }}>
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: 11, letterSpacing: '0.04em' }}>CASE</div>
                <Link to={`/cases/${h.caseId}`} style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
                  #{h.caseId}
                </Link>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3" style={{ background: '#f8f9fc' }}>
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: 11, letterSpacing: '0.04em' }}>JUDGE</div>
                <div className="fw-semibold" style={{ fontSize: 14, color: '#0f1629' }}>
                  <i className="bi bi-person-badge me-1 text-muted" />{h.judgeId}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3" style={{ background: '#f8f9fc' }}>
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: 11, letterSpacing: '0.04em' }}>DATE</div>
                <div className="fw-semibold" style={{ fontSize: 14, color: '#0f1629' }}>
                  <i className="bi bi-calendar3 me-1 text-muted" />{formatDate(h.hearingDate)}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3" style={{ background: '#f8f9fc' }}>
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: 11, letterSpacing: '0.04em' }}>TIME</div>
                <div className="fw-semibold" style={{ fontSize: 14, color: '#0f1629' }}>
                  <i className="bi bi-clock me-1 text-muted" />{h.hearingTime}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3" style={{ background: '#f8f9fc' }}>
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: 11, letterSpacing: '0.04em' }}>SCHEDULED BY</div>
                <div className="fw-semibold" style={{ fontSize: 14, color: '#0f1629' }}>
                  <i className="bi bi-person me-1 text-muted" />{h.scheduledBy}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="p-3 rounded-3" style={{ background: '#f8f9fc' }}>
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: 11, letterSpacing: '0.04em' }}>STATUS</div>
                <span className={`badge rounded-pill ${statusBadgeClass(h.status)}`} style={{ fontSize: 12 }}>
                  {h.status}
                </span>
              </div>
            </div>
          </div>

          {(h.rescheduleReason || h.hearingNotes) && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f0f2f7' }}>
              {h.rescheduleReason && (
                <div className="mb-2 p-3 rounded-3" style={{ background: '#fffbf0', border: '1px solid #f5e7b2' }}>
                  <span className="fw-semibold text-muted" style={{ fontSize: 12 }}>
                    <i className="bi bi-info-circle me-1" />RESCHEDULE REASON
                  </span>
                  <p className="mb-0 mt-1" style={{ fontSize: 14 }}>{h.rescheduleReason}</p>
                </div>
              )}
              {h.hearingNotes && (
                <div className="p-3 rounded-3" style={{ background: '#f0f7ff', border: '1px solid #c7ddf5' }}>
                  <span className="fw-semibold text-muted" style={{ fontSize: 12 }}>
                    <i className="bi bi-journal-text me-1" />HEARING NOTES
                  </span>
                  <p className="mb-0 mt-1" style={{ fontSize: 14 }}>{h.hearingNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule card */}
      {canClerk && isActive && (
        <div className="card border-0 mb-3" style={cardStyle}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #4a90d9, #6baaf0)' }}>
                <i className="bi bi-calendar-event text-white" style={{ fontSize: 15 }} />
              </div>
              <div>
                <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>Reschedule Hearing</h3>
                <div className="text-muted" style={{ fontSize: 12 }}>Update the date, time, or slot for this hearing</div>
              </div>
            </div>
            <form onSubmit={doReschedule}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">New Date</label>
                  <input className="form-control" style={{ borderRadius: 8 }} type="date"
                    value={resched.newDate} onChange={e => setResched({ ...resched, newDate: e.target.value })} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">New Time</label>
                  <input className="form-control" style={{ borderRadius: 8 }}
                    value={resched.newTime} onChange={e => setResched({ ...resched, newTime: e.target.value })}
                    placeholder="e.g. 10:00 AM" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">New Slot ID</label>
                  <input className="form-control" style={{ borderRadius: 8 }} type="number"
                    value={resched.newScheduleId} onChange={e => setResched({ ...resched, newScheduleId: e.target.value })} required />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">Reason <span className="text-muted fw-normal">(5–500 characters)</span></label>
                  <textarea className="form-control" style={{ borderRadius: 8, resize: 'none' }} rows={3}
                    minLength={5} maxLength={500}
                    value={resched.rescheduleReason}
                    onChange={e => setResched({ ...resched, rescheduleReason: e.target.value })}
                    required />
                  <div className="text-end text-muted mt-1" style={{ fontSize: 11 }}>{resched.rescheduleReason.length}/500</div>
                </div>
              </div>
              <button className="btn btn-dark mt-2" style={{ borderRadius: 9, padding: '8px 20px', fontSize: 14 }} disabled={submitting}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Rescheduling...</> : <><i className="bi bi-calendar-event me-1" />Reschedule</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete card */}
      {canJudge && isActive && (
        <div className="card border-0 mb-3" style={cardStyle}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #34a85a, #4bbe72)' }}>
                <i className="bi bi-patch-check text-white" style={{ fontSize: 15 }} />
              </div>
              <div>
                <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>Complete Hearing</h3>
                <div className="text-muted" style={{ fontSize: 12 }}>Mark this hearing as completed and record notes</div>
              </div>
            </div>
            <form onSubmit={doComplete}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Hearing Notes <span className="text-muted fw-normal">(10–2000 characters)</span></label>
                <textarea className="form-control" style={{ borderRadius: 8, resize: 'none' }} rows={4}
                  minLength={10} maxLength={2000}
                  value={complete.hearingNotes}
                  onChange={e => setComplete({ hearingNotes: e.target.value })}
                  placeholder="Record the proceedings, decisions, and any relevant notes..."
                  required />
                <div className="text-end text-muted mt-1" style={{ fontSize: 11 }}>{complete.hearingNotes.length}/2000</div>
              </div>
              <button
                className="btn mt-1"
                style={{ borderRadius: 9, padding: '8px 20px', fontSize: 14, background: 'linear-gradient(135deg, #34a85a, #4bbe72)', color: '#fff', border: 'none' }}
                disabled={submitting}
              >
                {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : <><i className="bi bi-patch-check me-1" />Mark as Completed</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
