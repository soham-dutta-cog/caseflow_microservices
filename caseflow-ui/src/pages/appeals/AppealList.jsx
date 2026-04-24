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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Appeals</h1>
        {canFile && <Link to="/appeals/file" className="btn btn-dark">+ File Appeal</Link>}
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
            <label className="form-label fw-semibold small mb-0">Filter:</label>
            <select className="form-select form-select-sm w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All</option>
              {APPEAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>Refresh</button>
          </div>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {loading ? <div className="text-center text-muted py-4">Loading...</div> : list.length === 0 ? <div className="text-center text-muted py-4">No appeals</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Case</th><th>Filed By</th><th>Date</th><th>Reason</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {list.map(a => (
                    <tr key={a.appealId}>
                      <td>#{a.appealId}</td>
                      <td><Link to={`/cases/${a.caseId}`}>#{a.caseId}</Link></td>
                      <td>{a.filedByUserId}</td>
                      <td>{formatDate(a.filedDate)}</td>
                      <td>{a.reason}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(a.status)}`}>{a.status}</span></td>
                      <td><Link to={`/appeals/${a.appealId}`} className="btn btn-outline-secondary btn-sm">Open</Link></td>
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
