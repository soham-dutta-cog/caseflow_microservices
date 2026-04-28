import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cases } from '../../api/services'
import { CASE_STATUS, statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function CaseList() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true); setErr('')
    try {
      let data
      if (filter) data = await cases.byStatus(filter)
      else data = await cases.list()
      setList(data || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Cases</h1>
        {(user?.role === 'LITIGANT' || user?.role === 'LAWYER' || user?.role === 'CLERK' || user?.role === 'ADMIN') && (
          <Link to="/cases/file" className="btn btn-dark">+ File New Case</Link>
        )}
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
            <label className="form-label fw-semibold small mb-0">Filter by status:</label>
            <select className="form-select form-select-sm w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All</option>
              {CASE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>Refresh</button>
          </div>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {loading ? <div className="text-center text-muted py-4">Loading...</div> : list.length === 0 ? (
            <div className="text-center text-muted py-4">No cases found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr><th>ID</th><th>Title</th><th>Litigant</th><th>Lawyer</th><th>Status</th><th>Filed</th><th></th></tr>
                </thead>
                <tbody>
                  {list.map(c => (
                    <tr key={c.caseId}>
                      <td>#{c.caseId}</td>
                      <td>{c.title}</td>
                      <td>{c.litigantId}</td>
                      <td>{c.lawyerId || '-'}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                      <td>{formatDate(c.filedDate)}</td>
                      <td><Link to={`/cases/${c.caseId}`} className="btn btn-outline-secondary btn-sm">Open</Link></td>
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
