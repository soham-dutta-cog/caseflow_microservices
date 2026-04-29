import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { compliance } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function ComplianceList() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const isAdminOrClerk = user?.role === 'ADMIN' || user?.role === 'CLERK'

  const [records, setRecords]       = useState([])
  const [filterCase, setFilterCase] = useState('')
  const [loading, setLoading]       = useState(false)
  const [err, setErr]               = useState('')

  const loadAll = async () => {
    setLoading(true); setErr('')
    try {
      const p = await compliance.complianceRecordsPaginated(0, 100)
      setRecords(p?.content || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  const loadByCase = async (e) => {
    e.preventDefault()
    if (!filterCase) return
    setLoading(true); setErr('')
    try { setRecords(await compliance.byCase(filterCase) || []) }
    catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const passCount = records.filter(r => r.result === 'PASS').length
  const failCount = records.filter(r => r.result === 'FAIL').length

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="page-title h3 mb-0">{t('Compliance Records')}</h1>
        {isAdminOrClerk && (
          <Link to="/compliance/check" className="btn btn-primary d-flex align-items-center gap-2">
            <i className="bi bi-play-circle-fill" /> {t('Run Compliance Check')}
          </Link>
        )}
      </div>

      {/* Summary counters */}
      {records.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm text-center py-3">
              <div className="h4 mb-0 fw-bold">{records.length}</div>
              <div className="text-muted small">Total Records</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm text-center py-3">
              <div className="h4 mb-0 fw-bold text-success">{passCount}</div>
              <div className="text-muted small">Passed</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className={`card border-0 shadow-sm text-center py-3 ${failCount > 0 ? 'bg-danger bg-opacity-10' : ''}`}>
              <div className={`h4 mb-0 fw-bold ${failCount > 0 ? 'text-danger' : 'text-success'}`}>{failCount}</div>
              <div className="text-muted small">Failed</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm text-center py-3">
              <div className="h4 mb-0 fw-bold">
                {records.length ? Math.round((passCount / records.length) * 100) : 0}%
              </div>
              <div className="text-muted small">Pass Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body py-2">
          <form onSubmit={loadByCase} className="d-flex gap-2 align-items-center flex-wrap">
            <label className="form-label fw-semibold small mb-0">Filter by Case ID:</label>
            <input
              className="form-control form-control-sm"
              style={{ width: 120 }}
              type="number"
              placeholder="Case ID"
              value={filterCase}
              onChange={e => setFilterCase(e.target.value)}
            />
            <button className="btn btn-dark btn-sm" type="submit">Filter</button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => { setFilterCase(''); loadAll() }}
            >
              All
            </button>
          </form>
        </div>
      </div>

      {/* Records table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {err && <div className="alert alert-danger m-3 py-2">{err}</div>}
          {loading ? (
            <div className="text-center text-muted py-5">{t('Loading...')}</div>
          ) : records.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-shield display-4 d-block mb-3 opacity-25" />
              <p className="mb-2">No compliance records found.</p>
              {isAdminOrClerk && (
                <Link to="/compliance/check" className="btn btn-primary btn-sm">
                  <i className="bi bi-play-circle me-1" />Run a Compliance Check
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Case</th>
                    <th>Type</th>
                    <th>Result</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.complianceId} className={r.result === 'FAIL' ? 'table-danger' : ''}>
                      <td className="text-muted small">#{r.complianceId}</td>
                      <td>
                        <Link to={`/cases/${r.caseId}`} className="fw-semibold">
                          #{r.caseId}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${r.type === 'DOCUMENT' ? 'text-bg-info' : 'text-bg-secondary'}`}>
                          <i className={`bi me-1 ${r.type === 'DOCUMENT' ? 'bi-file-earmark-check' : 'bi-diagram-3'}`} />
                          {r.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${statusBadgeClass(r.result)}`}>
                          {r.result}
                        </span>
                      </td>
                      <td className="small text-nowrap">{formatDate(r.date)}</td>
                      <td className="small text-muted" style={{ maxWidth: 320 }}>{r.notes}</td>
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
