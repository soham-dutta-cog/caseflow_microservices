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
      <div className="page-header">
        <h1 className="page-title">Hearings</h1>
        {canSchedule && <Link to="/hearings/schedule" className="btn btn-primary">+ Schedule Hearing</Link>}
      </div>
      <div className="card">
        <div className="flex-row" style={{ marginBottom: 14 }}>
          <label>Filter:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All</option>
            {HEARING_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        {loading ? <div className="empty">Loading...</div> : list.length === 0 ? <div className="empty">No hearings</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Case</th><th>Judge</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map(h => (
                <tr key={h.hearingId}>
                  <td>#{h.hearingId}</td>
                  <td><Link to={`/cases/${h.caseId}`}>#{h.caseId}</Link></td>
                  <td>{h.judgeId}</td>
                  <td>{formatDate(h.hearingDate)}</td>
                  <td>{h.hearingTime}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(h.status)}`}>{h.status}</span></td>
                  <td><Link to={`/hearings/${h.hearingId}`} className="btn btn-ghost btn-sm">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
