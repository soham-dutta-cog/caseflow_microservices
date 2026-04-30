import { useState, useEffect } from 'react'
import { hearings, users } from '../../api/services'
import { formatDate } from '../../utils/constants'

const TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
]

const cardStyle = { borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }

export default function JudgeSlots() {
  const [judgeList, setJudgeList] = useState([])
  const [judgeId, setJudgeId] = useState('')
  const [slots, setSlots] = useState([])
  const [addForm, setAddForm] = useState({ scheduleDate: '', timeSlot: '' })
  const [filter, setFilter] = useState('available')
  const [byDate, setByDate] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    users.byRole('JUDGE').then(d => setJudgeList(d || [])).catch(() => {})
  }, [])

  const selectedJudge = judgeList.find(j => j.userId === judgeId)

  const load = async (jid = judgeId, f = filter, d = byDate) => {
    setErr(''); setMsg('')
    if (!jid) return
    setSlotsLoading(true)
    try {
      let data
      if (f === 'available') data = await hearings.availableSlots(jid)
      else if (f === 'date' && d) data = await hearings.slotsByDate(jid, d)
      else data = await hearings.allSlots(jid)
      setSlots(data || [])
    } catch (e) { setErr(e.message) } finally { setSlotsLoading(false) }
  }

  const handleJudgeChange = (newJudgeId) => {
    setJudgeId(newJudgeId)
    setSlots([])
    if (newJudgeId) load(newJudgeId, filter, byDate)
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    if (newFilter !== 'date') load(judgeId, newFilter, byDate)
  }

  const addSlot = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setAddLoading(true)
    try {
      await hearings.addSlot({ judgeId, scheduleDate: addForm.scheduleDate, timeSlot: addForm.timeSlot })
      setMsg('Slot added successfully')
      setAddForm({ scheduleDate: '', timeSlot: '' })
      load()
    } catch (e) { setErr(e.message) } finally { setAddLoading(false) }
  }

  const availableCount = slots.filter(s => s.available).length
  const bookedCount = slots.length - availableCount

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="page-title h3 mb-1">Judge Schedule Slots</h1>
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
          Manage and view hearing time slots for judges.
        </p>
      </div>

      {err && <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: 10 }}>{err}</div>}
      {msg && <div className="alert alert-success py-2 mb-3" style={{ borderRadius: 10 }}><i className="bi bi-check-circle me-2" />{msg}</div>}

      {/* Judge picker + filter */}
      <div className="card border-0 mb-3" style={cardStyle}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #4a90d9, #6baaf0)' }}>
              <i className="bi bi-person-badge text-white" style={{ fontSize: 16 }} />
            </div>
            <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>Select Judge</h3>
          </div>

          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <label className="form-label fw-semibold small mb-1">Judge</label>
              <select
                className="form-select"
                style={{ borderRadius: 9 }}
                value={judgeId}
                onChange={e => handleJudgeChange(e.target.value)}
              >
                <option value="">Select a judge...</option>
                {judgeList.map(j => (
                  <option key={j.userId} value={j.userId}>
                    {j.name || j.email} — {j.userId}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold small mb-1">View</label>
              <select
                className="form-select"
                style={{ borderRadius: 9 }}
                value={filter}
                onChange={e => handleFilterChange(e.target.value)}
                disabled={!judgeId}
              >
                <option value="available">Available</option>
                <option value="all">All Slots</option>
                <option value="date">By Date</option>
              </select>
            </div>

            {filter === 'date' && (
              <div className="col-md-3">
                <label className="form-label fw-semibold small mb-1">Date</label>
                <input
                  className="form-control"
                  style={{ borderRadius: 9 }}
                  type="date"
                  value={byDate}
                  onChange={e => { setByDate(e.target.value); load(judgeId, filter, e.target.value) }}
                  disabled={!judgeId}
                />
              </div>
            )}

            <div className={`col-md-${filter === 'date' ? 1 : 2} d-flex align-items-end`}>
              <button
                className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-1"
                style={{ borderRadius: 9, fontSize: 13 }}
                onClick={() => load()}
                disabled={!judgeId || slotsLoading}
              >
                <i className="bi bi-arrow-clockwise" /> Load
              </button>
            </div>
          </div>

          {/* Stats strip */}
          {selectedJudge && slots.length > 0 && (
            <div className="d-flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #f0f2f7' }}>
              <div className="px-3 py-2 rounded-3 d-flex align-items-center gap-2" style={{ background: '#e8f5ec' }}>
                <i className="bi bi-check-circle-fill" style={{ color: '#34a85a', fontSize: 14 }} />
                <span className="fw-semibold" style={{ fontSize: 13, color: '#34a85a' }}>{availableCount} Available</span>
              </div>
              <div className="px-3 py-2 rounded-3 d-flex align-items-center gap-2" style={{ background: '#f0f2f7' }}>
                <i className="bi bi-calendar-x-fill text-muted" style={{ fontSize: 14 }} />
                <span className="fw-semibold text-muted" style={{ fontSize: 13 }}>{bookedCount} Booked</span>
              </div>
              <div className="px-3 py-2 rounded-3 d-flex align-items-center gap-2" style={{ background: '#f0f2f7' }}>
                <i className="bi bi-stack text-muted" style={{ fontSize: 14 }} />
                <span className="fw-semibold text-muted" style={{ fontSize: 13 }}>{slots.length} Total</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Slot */}
      <div className="card border-0 mb-3" style={cardStyle}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #c9a84c, #d4b865)' }}>
              <i className="bi bi-plus-circle text-white" style={{ fontSize: 16 }} />
            </div>
            <div>
              <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>Add Time Slot</h3>
              <div className="text-muted" style={{ fontSize: 12 }}>Add a new availability slot for the selected judge</div>
            </div>
          </div>

          {!judgeId && (
            <div className="rounded-3 p-3 d-flex align-items-center gap-2 mb-3"
              style={{ background: '#fffbf0', border: '1px solid #f5e7b2' }}>
              <i className="bi bi-info-circle" style={{ color: '#c9a84c' }} />
              <span className="text-muted" style={{ fontSize: 13 }}>Select a judge above before adding a slot.</span>
            </div>
          )}

          <form onSubmit={addSlot}>
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label fw-semibold small">Date</label>
                <input
                  className="form-control"
                  style={{ borderRadius: 9 }}
                  type="date"
                  value={addForm.scheduleDate}
                  onChange={e => setAddForm({ ...addForm, scheduleDate: e.target.value })}
                  disabled={!judgeId}
                  required
                />
              </div>

              <div className="col-md-5">
                <label className="form-label fw-semibold small">Time Slot</label>
                <select
                  className="form-select"
                  style={{ borderRadius: 9 }}
                  value={addForm.timeSlot}
                  onChange={e => setAddForm({ ...addForm, timeSlot: e.target.value })}
                  disabled={!judgeId}
                  required
                >
                  <option value="">Select a time slot...</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="col-md-2">
                <button
                  className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-1"
                  style={{ borderRadius: 9, fontSize: 14 }}
                  disabled={!judgeId || addLoading}
                >
                  {addLoading
                    ? <span className="spinner-border spinner-border-sm" />
                    : <><i className="bi bi-plus-lg" /> Add</>
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Slots table */}
      <div className="card border-0" style={cardStyle}>
        <div className="card-body p-0">
          <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid #f0f2f7' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-calendar3 text-muted" style={{ fontSize: 14 }} />
              <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>
                Slots {judgeId && selectedJudge && <span className="text-muted fw-normal">— {selectedJudge.name || selectedJudge.email}</span>}
              </h3>
            </div>
            {slots.length > 0 && (
              <span className="badge bg-light text-dark border" style={{ fontSize: 12 }}>{slots.length} slot{slots.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {slotsLoading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm mb-2" role="status" />
              <div style={{ fontSize: 14 }}>Loading slots...</div>
            </div>
          ) : !judgeId ? (
            <div className="text-center py-5">
              <i className="bi bi-calendar3 d-block mb-2" style={{ fontSize: 36, color: '#c9a84c', opacity: 0.5 }} />
              <div className="fw-semibold" style={{ color: '#0f1629', fontSize: 14 }}>No judge selected</div>
              <div className="text-muted mt-1" style={{ fontSize: 13 }}>Pick a judge above to view their schedule slots.</div>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x d-block mb-2" style={{ fontSize: 36, color: '#adb5bd' }} />
              <div className="fw-semibold" style={{ color: '#0f1629', fontSize: 14 }}>No slots found</div>
              <div className="text-muted mt-1" style={{ fontSize: 13 }}>Add a slot using the form above.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f2f7' }}>
                    {['SLOT ID', 'DATE', 'TIME', 'STATUS', 'HEARING'].map(h => (
                      <th key={h} className="text-muted fw-semibold px-4"
                        style={{ fontSize: 11, letterSpacing: '0.04em', paddingTop: 12, paddingBottom: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slots.map(s => (
                    <tr key={s.scheduleId} style={{ borderBottom: '1px solid #f8f9fc' }}>
                      <td className="px-4 fw-semibold" style={{ color: '#0f1629' }}>#{s.scheduleId}</td>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-calendar3 text-muted" style={{ fontSize: 12 }} />
                          {formatDate(s.scheduleDate)}
                        </div>
                      </td>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-clock text-muted" style={{ fontSize: 12 }} />
                          {s.timeSlot}
                        </div>
                      </td>
                      <td className="px-4">
                        <span
                          className="badge rounded-pill"
                          style={{
                            fontSize: 11,
                            background: s.available ? '#e8f5ec' : '#f0f2f7',
                            color: s.available ? '#34a85a' : '#6c757d',
                            border: `1px solid ${s.available ? '#b8e6c4' : '#dee2e6'}`,
                            padding: '4px 10px',
                          }}
                        >
                          <i className={`bi ${s.available ? 'bi-check-circle-fill' : 'bi-calendar-x-fill'} me-1`} />
                          {s.available ? 'Available' : 'Booked'}
                        </span>
                      </td>
                      <td className="px-4">
                        {s.hearingId
                          ? <span style={{ color: '#c9a84c', fontWeight: 500 }}>#{s.hearingId}</span>
                          : <span className="text-muted">—</span>
                        }
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
