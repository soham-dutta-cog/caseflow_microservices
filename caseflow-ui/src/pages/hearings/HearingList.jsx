import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hearings } from '../../api/services'
import { HEARING_STATUS, statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function HearingList() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [filter, setFilter] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const data = filter ? await hearings.byStatus(filter) : await hearings.list()
      setList(data || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const canSchedule = ['CLERK', 'JUDGE', 'ADMIN'].includes(user?.role)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Hearings</h1>
        {canSchedule && <Link to="/hearings/schedule" className="btn btn-dark">+ Schedule Hearing</Link>}
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
            <label className="form-label fw-semibold small mb-0">Filter:</label>
            <select className="form-select form-select-sm w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All</option>
              {HEARING_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>Refresh</button>
          </div>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {loading ? <div className="text-center text-muted py-4">Loading...</div> : list.length === 0 ? <div className="text-center text-muted py-4">No hearings</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Case</th><th>Judge</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {list.map(h => (
                    <tr key={h.hearingId}>
                      <td>#{h.hearingId}</td>
                      <td><Link to={`/cases/${h.caseId}`}>#{h.caseId}</Link></td>
                      <td>{h.judgeId}</td>
                      <td>{formatDate(h.hearingDate)}</td>
                      <td>{h.hearingTime}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(h.status)}`}>{h.status}</span></td>
                      <td><Link to={`/hearings/${h.hearingId}`} className="btn btn-outline-secondary btn-sm">Open</Link></td>
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
