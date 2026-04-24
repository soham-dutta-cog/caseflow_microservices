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
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Compliance Records</h1></div>
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <form onSubmit={loadByCase} className="d-flex gap-2 align-items-center flex-wrap">
            <label className="form-label fw-semibold small mb-0">By Case ID:</label>
            <input className="form-control form-control-sm w-auto" type="number" value={caseId} onChange={e => setCaseId(e.target.value)} />
            <button className="btn btn-dark btn-sm">Load</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadPaginated}>All</button>
          </form>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {loading ? <div className="text-center text-muted py-4">Loading...</div> : records.length === 0 ? <div className="text-center text-muted py-4">No records</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Case</th><th>Type</th><th>Result</th><th>Date</th><th>Notes</th></tr></thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.complianceId}>
                      <td>#{r.complianceId}</td>
                      <td><Link to={`/cases/${r.caseId}`}>#{r.caseId}</Link></td>
                      <td>{r.type}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(r.result)}`}>{r.result}</span></td>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.notes}</td>
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
