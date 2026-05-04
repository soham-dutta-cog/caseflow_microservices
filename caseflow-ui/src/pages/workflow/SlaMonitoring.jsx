import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { workflow } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'

export default function SlaMonitoring() {
  const [breached, setBreached] = useState([])
  const [active, setActive] = useState([])
  const [warnings, setWarnings] = useState([])
  const [tab, setTab] = useState('breached')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const [b, a, w] = await Promise.allSettled([
        workflow.breached(),
        workflow.active(),
        workflow.warnings(),
      ])
      if (b.status === 'fulfilled') setBreached(b.value || [])
      if (a.status === 'fulfilled') setActive(a.value || [])
      if (w.status === 'fulfilled') setWarnings(w.value || [])
    } catch (e) { setErr(e.message) }
  }

  useEffect(() => { load() }, [])

  const triggerCheck = async () => {
    setErr(''); setMsg('')
    try {
      const res = await workflow.checkSla()
      setMsg(typeof res === 'string' ? res : 'SLA check triggered')
      load()
    } catch (e) { setErr(e.message) }
  }

  const records = tab === 'breached' ? breached : tab === 'warnings' ? warnings : active
  const getSlaClass = (pct) => pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-warning' : 'bg-success'

  const stats = [
    { label: 'Active SLAs', value: active.length, icon: 'bi-check-circle', border: 'border-start border-4 border-primary' },
    { label: 'Warnings (80%+)', value: warnings.length, icon: 'bi-exclamation-triangle', border: 'border-start border-4 border-warning' },
    { label: 'Breached', value: breached.length, icon: 'bi-x-octagon', border: 'border-start border-4 border-danger' },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title h3 mb-1">SLA Monitoring</h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Track SLA compliance across all active workflows</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/workflow" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i>Back to Workflow
          </Link>
          <button className="btn btn-dark" onClick={triggerCheck}>
            <i className="bi bi-arrow-repeat me-2"></i>Trigger SLA Check
          </button>
        </div>
      </div>

      {err && <div className="alert alert-danger alert-dismissible fade show py-2">{err}<button type="button" className="btn-close" onClick={() => setErr('')}></button></div>}
      {msg && <div className="alert alert-success alert-dismissible fade show py-2">{msg}<button type="button" className="btn-close" onClick={() => setMsg('')}></button></div>}

      <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="col">
            <div className={`card h-100 shadow-sm ${s.border}`}>
              <div className="card-body d-flex align-items-center gap-3 py-3">
                <i className={`bi ${s.icon} fs-3 text-muted`}></i>
                <div>
                  <div className="fw-bold fs-4">{s.value}</div>
                  <div className="text-muted small">{s.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white border-bottom">
          <ul className="nav nav-pills" role="tablist">
            {[
              { key: 'breached', label: 'Breached', icon: 'bi-x-octagon', count: breached.length },
              { key: 'warnings', label: 'Warnings', icon: 'bi-exclamation-triangle', count: warnings.length },
              { key: 'active', label: 'Active', icon: 'bi-check-circle', count: active.length },
            ].map(t => (
              <li key={t.key} className="nav-item">
                <button
                  className={`nav-link d-flex align-items-center gap-2 ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  <i className={`bi ${t.icon}`}></i>
                  {t.label}
                  <span className={`badge rounded-pill ${tab === t.key ? 'bg-white text-dark' : 'bg-secondary'}`}>
                    {t.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-body p-0">
          {records.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox display-4 d-block mb-2 text-body-tertiary"></i>
              No records in this category
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle text-nowrap mb-0">
                <thead className="table-light">
                  <tr><th>ID</th><th>Case</th><th>Stage</th><th>Start</th><th>End</th><th>SLA Days</th><th>Elapsed</th><th>Remaining</th><th>Progress</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const pct = r.slaUsagePercent || 0
                    return (
                      <tr key={r.slaRecordId}>
                        <td>#{r.slaRecordId}</td>
                        <td><Link to={`/cases/${r.caseId}`} className="fw-semibold">#{r.caseId}</Link></td>
                        <td>{r.stageId}</td>
                        <td className="small text-secondary">{formatDate(r.startDate)}</td>
                        <td className="small text-secondary">{formatDate(r.endDate)}</td>
                        <td>{r.slaDays}</td>
                        <td>{r.daysElapsed}</td>
                        <td>{r.daysRemaining}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6, width: 60 }}>
                              <div className={`progress-bar ${getSlaClass(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                            </div>
                            <small className="fw-semibold text-nowrap">{pct.toFixed(0)}%</small>
                          </div>
                        </td>
                        <td><span className={`badge rounded-pill ${statusBadgeClass(r.status)}`}>{r.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
