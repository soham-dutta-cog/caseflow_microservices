import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { compliance } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'

export default function ComplianceList() {
  const [records, setRecords] = useState([])
  const [caseId, setCaseId] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const loadPaginated = async () => {
    setLoading(true); setErr('')
    try {
      const p = await compliance.complianceRecordsPaginated(0, 50)
      setRecords(p?.content || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  const loadByCase = async (e) => {
    e.preventDefault()
    if (!caseId) return
    setLoading(true); setErr('')
    try { setRecords(await compliance.byCase(caseId) || []) } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { loadPaginated() }, [])

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Compliance Records</h1></div>
      <div className="card">
        <form onSubmit={loadByCase} className="flex-row">
          <label>By Case ID:</label>
          <input type="number" value={caseId} onChange={e => setCaseId(e.target.value)} />
          <button className="btn btn-primary btn-sm">Load</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={loadPaginated}>All</button>
        </form>
      </div>
      <div className="card">
        {err && <div className="alert alert-error">{err}</div>}
        {loading ? <div className="empty">Loading...</div> : records.length === 0 ? <div className="empty">No records</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Case</th><th>Type</th><th>Result</th><th>Date</th><th>Notes</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.complianceId}>
                  <td>#{r.complianceId}</td>
                  <td><Link to={`/cases/${r.caseId}`}>#{r.caseId}</Link></td>
                  <td>{r.type}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(r.result)}`}>{r.result}</span></td>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
