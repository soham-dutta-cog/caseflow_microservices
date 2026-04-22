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
      <div className="page-header"><h1 className="page-title">Judge Schedule Slots</h1></div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <div className="flex-row">
          <label>Judge ID:</label>
          <input type="number" value={judgeId} onChange={e => setJudgeId(e.target.value)} />
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="available">Available</option>
            <option value="all">All</option>
            <option value="date">By Date</option>
          </select>
          {filter === 'date' && <input type="date" value={byDate} onChange={e => setByDate(e.target.value)} />}
          <button className="btn btn-primary btn-sm" onClick={load} disabled={!judgeId}>Load</button>
        </div>
      </div>

      <div className="card">
        <h3>Add Slot</h3>
        <form onSubmit={addSlot}>
          <div className="form-grid">
            <div className="form-row"><label>Date</label><input type="date" value={addForm.scheduleDate} onChange={e => setAddForm({ ...addForm, scheduleDate: e.target.value })} required /></div>
            <div className="form-row"><label>Time Slot</label><input value={addForm.timeSlot} onChange={e => setAddForm({ ...addForm, timeSlot: e.target.value })} placeholder="10:00 AM" required /></div>
          </div>
          <button className="btn btn-primary" disabled={!judgeId}>Add Slot</button>
        </form>
      </div>

      <div className="card">
        <h3>Slots</h3>
        {slots.length === 0 ? <div className="empty">No slots</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Available</th><th>Hearing</th></tr></thead>
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
        )}
      </div>
    </div>
  )
}
