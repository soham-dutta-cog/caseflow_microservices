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

  if (!h) return <div><div className="page-header"><h1 className="page-title">Hearing</h1></div>{err && <div className="alert alert-error">{err}</div>}<div className="card">Loading...</div></div>

  const canClerk = ['CLERK', 'ADMIN'].includes(user?.role)
  const canJudge = ['JUDGE', 'ADMIN'].includes(user?.role)

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Hearing #{h.hearingId}</h1></div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <div className="form-grid">
          <div><strong>Case:</strong> <Link to={`/cases/${h.caseId}`}>#{h.caseId}</Link></div>
          <div><strong>Judge:</strong> {h.judgeId}</div>
          <div><strong>Date:</strong> {formatDate(h.hearingDate)}</div>
          <div><strong>Time:</strong> {h.hearingTime}</div>
          <div><strong>Status:</strong> <span className={`badge-pill ${statusBadgeClass(h.status)}`}>{h.status}</span></div>
          <div><strong>Scheduled By:</strong> {h.scheduledBy}</div>
        </div>
        {h.rescheduleReason && <div style={{ marginTop: 10 }}><strong>Reschedule Reason:</strong> {h.rescheduleReason}</div>}
        {h.hearingNotes && <div style={{ marginTop: 10 }}><strong>Notes:</strong> {h.hearingNotes}</div>}
      </div>

      {canClerk && h.status !== 'COMPLETED' && h.status !== 'CANCELLED' && (
        <div className="card">
          <h3>Reschedule</h3>
          <form onSubmit={doReschedule}>
            <div className="form-grid">
              <div className="form-row"><label>New Date</label><input type="date" value={resched.newDate} onChange={e => setResched({ ...resched, newDate: e.target.value })} required /></div>
              <div className="form-row"><label>New Time</label><input value={resched.newTime} onChange={e => setResched({ ...resched, newTime: e.target.value })} required /></div>
              <div className="form-row"><label>New Slot ID</label><input type="number" value={resched.newScheduleId} onChange={e => setResched({ ...resched, newScheduleId: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <label>Reason (5-500 chars)</label>
              <textarea minLength={5} maxLength={500} value={resched.rescheduleReason} onChange={e => setResched({ ...resched, rescheduleReason: e.target.value })} required />
            </div>
            <button className="btn btn-primary">Reschedule</button>
          </form>
        </div>
      )}

      {canJudge && h.status !== 'COMPLETED' && h.status !== 'CANCELLED' && (
        <div className="card">
          <h3>Complete Hearing</h3>
          <form onSubmit={doComplete}>
            <div className="form-row">
              <label>Hearing Notes (10-2000 chars)</label>
              <textarea minLength={10} maxLength={2000} value={complete.hearingNotes} onChange={e => setComplete({ hearingNotes: e.target.value })} required />
            </div>
            <button className="btn btn-primary">Complete</button>
          </form>
        </div>
      )}
    </div>
  )
}
