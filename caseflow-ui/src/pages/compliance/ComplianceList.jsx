import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { compliance } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

function DonutChart({ value, max = 100, size = 120, strokeWidth = 16, tone = 'success' }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const offset = circ - (pct / 100) * circ
  const colors = { success: '#198754', danger: '#dc3545', warning: '#f59e0b', info: '#0dcaf0', primary: '#0d6efd' }
  const c = colors[tone] || '#0d6efd'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9ecef" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="44%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.21} fontWeight="700" fill={c}>{Math.round(pct)}%</text>
      <text x="50%" y="64%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.12} fill="#6c757d">pass rate</text>
    </svg>
  )
}

export default function ComplianceList() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const isAdminOrClerk = user?.role === 'ADMIN' || user?.role === 'CLERK'

  const [records, setRecords]       = useState([])
  const [filterCase, setFilterCase] = useState('')
  const [loading, setLoading]       = useState(false)
  const [err, setErr]               = useState('')
  const [expanded, setExpanded]     = useState({})

  const loadAll = async () => {
    setLoading(true); setErr('')
    try {
      const p = await compliance.complianceRecordsPaginated(0, 100)
      setRecords(p?.content || [])
      setExpanded({})
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  const loadByCase = async (e) => {
    e.preventDefault()
    if (!filterCase) return
    setLoading(true); setErr('')
    try {
      const data = await compliance.byCase(filterCase) || []
      setRecords(data)
      setExpanded({})
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const passCount = records.filter(r => r.result === 'PASS').length
  const failCount = records.filter(r => r.result === 'FAIL').length

  const caseGroups = useMemo(() => {
    const groups = {}
    records.forEach(r => {
      if (!groups[r.caseId]) groups[r.caseId] = []
      groups[r.caseId].push(r)
    })
    return Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]))
  }, [records])

  // undefined = open (default), false = collapsed
  const isOpen = id => expanded[id] !== false
  const toggle  = id => setExpanded(prev => ({ ...prev, [id]: !isOpen(id) }))
  const expandAll   = () => { const e = {}; caseGroups.forEach(([id]) => { e[id] = true });  setExpanded(e) }
  const collapseAll = () => { const e = {}; caseGroups.forEach(([id]) => { e[id] = false }); setExpanded(e) }

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="page-title h3 mb-0">{t('Compliance Records')}</h1>
          <p className="text-muted small mb-0 mt-1">
            Records grouped by case &mdash; {caseGroups.length} case{caseGroups.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdminOrClerk && (
          <Link to="/compliance/check" className="btn btn-primary d-flex align-items-center gap-2">
            <i className="bi bi-play-circle-fill" /> {t('Run Compliance Check')}
          </Link>
        )}
      </div>

      {/* ── Summary panel ────────────────────────────────────────────────────── */}
      {records.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row align-items-center g-4">
              <div className="col-auto text-center">
                <DonutChart
                  value={passCount}
                  max={records.length}
                  tone={failCount === 0 ? 'success' : records.length > 0 && passCount / records.length >= 0.7 ? 'warning' : 'danger'}
                />
              </div>
              <div className="col">
                <div className="row g-3">
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#f8f9fa' }}>
                      <div className="h3 fw-bold mb-0">{records.length}</div>
                      <div className="text-muted small mt-1">
                        <i className="bi bi-clipboard-check me-1" />Total Checks
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#f0fdf4' }}>
                      <div className="h3 fw-bold mb-0 text-success">{passCount}</div>
                      <div className="text-muted small mt-1">
                        <i className="bi bi-check-circle me-1 text-success" />Passed
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#fafafa' }}>
                      <div className="h3 fw-bold mb-0 text-secondary">{failCount}</div>
                      <div className="text-muted small mt-1">
                        <i className="bi bi-exclamation-circle me-1" />Need Review
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>{caseGroups.length} case{caseGroups.length !== 1 ? 's' : ''} checked</span>
                      <span>{passCount} / {records.length} checks passed</span>
                    </div>
                    <div className="progress" style={{ height: 10, borderRadius: 8 }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${(passCount / records.length) * 100}%` }}
                        title={`${passCount} passed`}
                      />
                      <div
                        className="progress-bar"
                        style={{ width: `${(failCount / records.length) * 100}%`, background: '#dee2e6' }}
                        title={`${failCount} need review`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter bar ───────────────────────────────────────────────────────── */}
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
            {caseGroups.length > 1 && (
              <>
                <span className="vr mx-1" />
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={expandAll}>
                  <i className="bi bi-arrows-expand me-1" />Expand all
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={collapseAll}>
                  <i className="bi bi-arrows-collapse me-1" />Collapse all
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2">{err}</div>}

      {/* ── Case groups ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center text-muted py-5">{t('Loading...')}</div>
      ) : caseGroups.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-shield display-4 d-block mb-3 opacity-25" />
            <p className="mb-2">No compliance records found.</p>
            {isAdminOrClerk && (
              <Link to="/compliance/check" className="btn btn-primary btn-sm">
                <i className="bi bi-play-circle me-1" />Run a Compliance Check
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {caseGroups.map(([caseId, recs]) => {
            const casePass = recs.filter(r => r.result === 'PASS').length
            const caseFail = recs.filter(r => r.result === 'FAIL').length
            const allPass  = caseFail === 0
            const open     = isOpen(caseId)
            const pct      = recs.length > 0 ? Math.round((casePass / recs.length) * 100) : 0

            return (
              <div key={caseId} className="card shadow-sm border-0">
                {/* Case header */}
                <div
                  className="card-header border-0 d-flex align-items-center justify-content-between gap-2"
                  style={{ background: 'transparent', cursor: 'pointer', paddingTop: '0.9rem', paddingBottom: '0.9rem' }}
                  onClick={() => toggle(caseId)}
                >
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="rounded-circle d-inline-block flex-shrink-0"
                        style={{ width: 10, height: 10, background: allPass ? '#198754' : '#adb5bd' }}
                      />
                      <span className="fw-semibold fs-6">
                        <Link
                          to={`/cases/${caseId}`}
                          className="text-decoration-none"
                          onClick={e => e.stopPropagation()}
                        >
                          Case #{caseId}
                        </Link>
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-1 flex-wrap">
                      <span className="badge rounded-pill text-bg-success">{casePass} Pass</span>
                      {caseFail > 0 && (
                        <span className="badge rounded-pill text-bg-secondary">{caseFail} Review</span>
                      )}
                      <span className="badge rounded-pill text-bg-light border text-muted">
                        {recs.length} check{recs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 flex-shrink-0">
                    <div style={{ width: 90 }}>
                      <div className="progress" style={{ height: 6, borderRadius: 4 }}>
                        <div className="progress-bar bg-success" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="d-flex justify-content-between" style={{ fontSize: '0.68rem' }}>
                        <span className="text-muted">0%</span>
                        <span className="fw-semibold text-success">{pct}%</span>
                      </div>
                    </div>
                    <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`} />
                  </div>
                </div>

                {/* Records sub-table */}
                {open && (
                  <div className="border-top">
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0" style={{ background: '#fafcff' }}>
                        <thead style={{ background: '#f1f3f5' }}>
                          <tr>
                            <th className="ps-4 text-muted fw-semibold small">ID</th>
                            <th className="text-muted fw-semibold small">Type</th>
                            <th className="text-muted fw-semibold small">Result</th>
                            <th className="text-muted fw-semibold small">Date</th>
                            <th className="text-muted fw-semibold small">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recs.map(r => (
                            <tr key={r.complianceId}>
                              <td className="ps-4 text-muted small">#{r.complianceId}</td>
                              <td>
                                <span className={`badge rounded-pill ${r.type === 'DOCUMENT' ? 'text-bg-info' : 'text-bg-secondary'}`}>
                                  <i className={`bi me-1 ${r.type === 'DOCUMENT' ? 'bi-file-earmark-check' : 'bi-diagram-3'}`} />
                                  {r.type}
                                </span>
                              </td>
                              <td>
                                <span className={`badge rounded-pill ${statusBadgeClass(r.result)}`}>
                                  <i className={`bi me-1 ${r.result === 'PASS' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                                  {r.result}
                                </span>
                              </td>
                              <td className="small text-nowrap text-muted">{formatDate(r.date)}</td>
                              <td className="small text-muted pe-3" style={{ maxWidth: 300 }}>{r.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
