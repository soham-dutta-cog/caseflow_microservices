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
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Schedule Hearing</h1></div>
      <div className="card shadow-sm" style={{ maxWidth: 640 }}>
        <div className="card-body">
          <p className="text-muted small">Add a slot for the judge first, then use its ID here.</p>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold small">Case ID</label><input className="form-control" type="number" value={form.caseId} onChange={e => setForm({ ...form, caseId: e.target.value })} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Judge ID</label><input className="form-control" type="number" value={form.judgeId} onChange={e => setForm({ ...form, judgeId: e.target.value })} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Hearing Date</label><input className="form-control" type="date" value={form.hearingDate} onChange={e => setForm({ ...form, hearingDate: e.target.value })} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Hearing Time</label><input className="form-control" value={form.hearingTime} onChange={e => setForm({ ...form, hearingTime: e.target.value })} placeholder="10:00 AM" required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Schedule Slot ID</label><input className="form-control" type="number" value={form.scheduleId} onChange={e => setForm({ ...form, scheduleId: e.target.value })} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Scheduled By (user id)</label><input className="form-control" type="number" value={form.scheduledBy} onChange={e => setForm({ ...form, scheduledBy: e.target.value })} required /></div>
            </div>
            <button className="btn btn-dark mt-3" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
