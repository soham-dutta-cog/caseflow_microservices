import { useState } from 'react'
import { hearings } from '../../api/services'
import { formatDate } from '../../utils/constants'

export default function JudgeSlots() {
  const [judgeId, setJudgeId] = useState('')
  const [slots, setSlots] = useState([])
  const [addForm, setAddForm] = useState({ scheduleDate: '', timeSlot: '' })
  const [filter, setFilter] = useState('available')
  const [byDate, setByDate] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    setErr(''); setMsg('')
    if (!judgeId) return
    try {
      let data
      if (filter === 'available') data = await hearings.availableSlots(judgeId)
      else if (filter === 'date' && byDate) data = await hearings.slotsByDate(judgeId, byDate)
      else data = await hearings.allSlots(judgeId)
      setSlots(data || [])
    } catch (e) { setErr(e.message) }
  }

  const addSlot = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      await hearings.addSlot({
        judgeId: Number(judgeId),
        scheduleDate: addForm.scheduleDate,
        timeSlot: addForm.timeSlot,
      })
      setMsg('Slot added')
      setAddForm({ scheduleDate: '', timeSlot: '' })
      load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Judge Schedule Slots</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <label className="form-label fw-semibold small mb-0">Judge ID:</label>
            <input className="form-control form-control-sm w-auto" type="number" value={judgeId} onChange={e => setJudgeId(e.target.value)} />
            <select className="form-select form-select-sm w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="available">Available</option>
              <option value="all">All</option>
              <option value="date">By Date</option>
            </select>
            {filter === 'date' && <input className="form-control form-control-sm w-auto" type="date" value={byDate} onChange={e => setByDate(e.target.value)} />}
            <button className="btn btn-dark btn-sm" onClick={load} disabled={!judgeId}>Load</button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Add Slot</h3>
          <form onSubmit={addSlot}>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold small">Date</label><input className="form-control" type="date" value={addForm.scheduleDate} onChange={e => setAddForm({ ...addForm, scheduleDate: e.target.value })} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Time Slot</label><input className="form-control" value={addForm.timeSlot} onChange={e => setAddForm({ ...addForm, timeSlot: e.target.value })} placeholder="10:00 AM" required /></div>
            </div>
            <button className="btn btn-dark mt-3" disabled={!judgeId}>Add Slot</button>
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Slots</h3>
          {slots.length === 0 ? <div className="text-center text-muted py-4">No slots</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Date</th><th>Time</th><th>Available</th><th>Hearing</th></tr></thead>
                <tbody>
                  {slots.map(s => (
                    <tr key={s.scheduleId}>
                      <td>#{s.scheduleId}</td>
                      <td>{formatDate(s.scheduleDate)}</td>
                      <td>{s.timeSlot}</td>
                      <td>{s.available ? '✓' : '✗'}</td>
                      <td>{s.hearingId ? `#${s.hearingId}` : '-'}</td>
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
