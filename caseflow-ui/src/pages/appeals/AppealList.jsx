import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { appeals } from '../../api/services'
import { APPEAL_STATUS, statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function AppealList() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [filter, setFilter] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      let data
      if (filter) data = await appeals.byStatus(filter)
      else { const p = await appeals.paginated(0, 50); data = p?.content || p || [] }
      setList(Array.isArray(data) ? data : (data.content || []))
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const canFile = ['LITIGANT', 'LAWYER'].includes(user?.role)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Appeals</h1>
        {canFile && <Link to="/appeals/file" className="btn btn-primary">+ File Appeal</Link>}
      </div>
      <div className="card">
        <div className="flex-row" style={{ marginBottom: 14 }}>
          <label>Filter:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All</option>
            {APPEAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        {loading ? <div className="empty">Loading...</div> : list.length === 0 ? <div className="empty">No appeals</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Case</th><th>Filed By</th><th>Date</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map(a => (
                <tr key={a.appealId}>
                  <td>#{a.appealId}</td>
                  <td><Link to={`/cases/${a.caseId}`}>#{a.caseId}</Link></td>
                  <td>{a.filedByUserId}</td>
                  <td>{formatDate(a.filedDate)}</td>
                  <td>{a.reason}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(a.status)}`}>{a.status}</span></td>
                  <td><Link to={`/appeals/${a.appealId}`} className="btn btn-ghost btn-sm">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
