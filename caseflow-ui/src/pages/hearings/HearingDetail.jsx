import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hearings } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function HearingDetail() {
  const { hearingId } = useParams()
  const { user } = useAuth()
  const [h, setH] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [resched, setResched] = useState({ newDate: '', newTime: '', newScheduleId: '', rescheduleReason: '' })
  const [complete, setComplete] = useState({ hearingNotes: '' })

  const load = async () => {
    try { setH(await hearings.get(hearingId)) } catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [hearingId])

  const doReschedule = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      await hearings.reschedule(hearingId, {
        newDate: resched.newDate,
        newTime: resched.newTime,
        newScheduleId: Number(resched.newScheduleId),
        rescheduleReason: resched.rescheduleReason,
        clerkId: Number(user.email) || 0,
      })
      setMsg('Rescheduled'); load()
    } catch (e) { setErr(e.message) }
  }

  const doComplete = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      await hearings.complete(hearingId, {
        judgeId: Number(user.email) || 0,
        hearingNotes: complete.hearingNotes,
      })
      setMsg('Hearing completed'); load()
    } catch (e) { setErr(e.message) }
  }

  if (!h) return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Hearing</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      <div className="card shadow-sm"><div className="card-body">Loading...</div></div>
    </div>
  )

  const canClerk = ['CLERK', 'ADMIN'].includes(user?.role)
  const canJudge = ['JUDGE', 'ADMIN'].includes(user?.role)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Hearing #{h.hearingId}</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6"><strong>Case:</strong> <Link to={`/cases/${h.caseId}`}>#{h.caseId}</Link></div>
            <div className="col-md-6"><strong>Judge:</strong> {h.judgeId}</div>
            <div className="col-md-6"><strong>Date:</strong> {formatDate(h.hearingDate)}</div>
            <div className="col-md-6"><strong>Time:</strong> {h.hearingTime}</div>
            <div className="col-md-6"><strong>Status:</strong> <span className={`badge rounded-pill ${statusBadgeClass(h.status)}`}>{h.status}</span></div>
            <div className="col-md-6"><strong>Scheduled By:</strong> {h.scheduledBy}</div>
          </div>
          {h.rescheduleReason && <div className="mt-2"><strong>Reschedule Reason:</strong> {h.rescheduleReason}</div>}
          {h.hearingNotes && <div className="mt-2"><strong>Notes:</strong> {h.hearingNotes}</div>}
        </div>
      </div>

      {canClerk && h.status !== 'COMPLETED' && h.status !== 'CANCELLED' && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h3 className="h5 mb-3">Reschedule</h3>
            <form onSubmit={doReschedule}>
              <div className="row g-3">
                <div className="col-md-4"><label className="form-label fw-semibold small">New Date</label><input className="form-control" type="date" value={resched.newDate} onChange={e => setResched({ ...resched, newDate: e.target.value })} required /></div>
                <div className="col-md-4"><label className="form-label fw-semibold small">New Time</label><input className="form-control" value={resched.newTime} onChange={e => setResched({ ...resched, newTime: e.target.value })} required /></div>
                <div className="col-md-4"><label className="form-label fw-semibold small">New Slot ID</label><input className="form-control" type="number" value={resched.newScheduleId} onChange={e => setResched({ ...resched, newScheduleId: e.target.value })} required /></div>
              </div>
              <div className="mt-3 mb-3">
                <label className="form-label fw-semibold small">Reason (5-500 chars)</label>
                <textarea className="form-control" minLength={5} maxLength={500} value={resched.rescheduleReason} onChange={e => setResched({ ...resched, rescheduleReason: e.target.value })} required />
              </div>
              <button className="btn btn-dark">Reschedule</button>
            </form>
          </div>
        </div>
      )}

      {canJudge && h.status !== 'COMPLETED' && h.status !== 'CANCELLED' && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h3 className="h5 mb-3">Complete Hearing</h3>
            <form onSubmit={doComplete}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Hearing Notes (10-2000 chars)</label>
                <textarea className="form-control" minLength={10} maxLength={2000} value={complete.hearingNotes} onChange={e => setComplete({ hearingNotes: e.target.value })} required />
              </div>
              <button className="btn btn-dark">Complete</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
