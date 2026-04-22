import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hearings } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function ScheduleHearing() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({
    caseId: '', judgeId: '', hearingDate: '', hearingTime: '', scheduleId: '', scheduledBy: '',
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await hearings.schedule({
        caseId: Number(form.caseId),
        judgeId: Number(form.judgeId),
        hearingDate: form.hearingDate,
        hearingTime: form.hearingTime,
        scheduleId: Number(form.scheduleId),
        scheduledBy: Number(form.scheduledBy) || 0,
      })
      nav(`/hearings/${res.hearingId}`)
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Schedule Hearing</h1></div>
      <div className="card" style={{ maxWidth: 640 }}>
        <p className="muted">Add a slot for the judge first, then use its ID here.</p>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-row"><label>Case ID</label><input type="number" value={form.caseId} onChange={e => setForm({ ...form, caseId: e.target.value })} required /></div>
            <div className="form-row"><label>Judge ID</label><input type="number" value={form.judgeId} onChange={e => setForm({ ...form, judgeId: e.target.value })} required /></div>
            <div className="form-row"><label>Hearing Date</label><input type="date" value={form.hearingDate} onChange={e => setForm({ ...form, hearingDate: e.target.value })} required /></div>
            <div className="form-row"><label>Hearing Time</label><input value={form.hearingTime} onChange={e => setForm({ ...form, hearingTime: e.target.value })} placeholder="10:00 AM" required /></div>
            <div className="form-row"><label>Schedule Slot ID</label><input type="number" value={form.scheduleId} onChange={e => setForm({ ...form, scheduleId: e.target.value })} required /></div>
            <div className="form-row"><label>Scheduled By (user id)</label><input type="number" value={form.scheduledBy} onChange={e => setForm({ ...form, scheduledBy: e.target.value })} required /></div>
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule'}</button>
        </form>
      </div>
    </div>
  )
}
