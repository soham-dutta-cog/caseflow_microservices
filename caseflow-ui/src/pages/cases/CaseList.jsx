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
      <div className="page-header">
        <h1 className="page-title">Cases</h1>
        {(user?.role === 'LITIGANT' || user?.role === 'LAWYER' || user?.role === 'CLERK' || user?.role === 'ADMIN') && (
          <Link to="/cases/file" className="btn btn-primary">+ File New Case</Link>
        )}
      </div>

      <div className="card">
        <div className="flex-row" style={{ marginBottom: 14 }}>
          <label>Filter by status:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All</option>
            {CASE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        {loading ? <div className="empty">Loading...</div> : list.length === 0 ? (
          <div className="empty">No cases found</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Litigant</th><th>Lawyer</th><th>Status</th><th>Filed</th><th></th></tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.caseId}>
                  <td>#{c.caseId}</td>
                  <td>{c.title}</td>
                  <td>{c.litigantId}</td>
                  <td>{c.lawyerId || '-'}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                  <td>{formatDate(c.filedDate)}</td>
                  <td><Link to={`/cases/${c.caseId}`} className="btn btn-ghost btn-sm">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
