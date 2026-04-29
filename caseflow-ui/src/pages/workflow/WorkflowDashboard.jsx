import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { workflow } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useLanguage } from '../../context/LanguageContext'

export default function WorkflowDashboard() {
  const { t } = useLanguage()
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
    { label: 'Active SLAs', value: active.length, icon: 'bi-check-circle', bg: 'bg-primary bg-opacity-10', text: 'text-primary', border: 'border-primary border-opacity-25' },
    { label: 'Warnings (80%+)', value: warnings.length, icon: 'bi-exclamation-triangle', bg: 'bg-warning bg-opacity-10', text: 'text-warning', border: 'border-warning border-opacity-25' },
    { label: 'Breached', value: breached.length, icon: 'bi-x-octagon', bg: 'bg-danger bg-opacity-10', text: 'text-danger', border: 'border-danger border-opacity-25' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">{t('Workflow / SLA')}</h1>
        <button className="btn btn-primary shadow-sm" onClick={triggerCheck}>
          <i className="bi bi-arrow-repeat me-2"></i>Trigger SLA Check
        </button>
      </div>

      {err && <div className="alert alert-danger alert-dismissible fade show py-2">{err}<button type="button" className="btn-close" onClick={() => setErr('')}></button></div>}
      {msg && <div className="alert alert-success alert-dismissible fade show py-2">{msg}<button type="button" className="btn-close" onClick={() => setMsg('')}></button></div>}

      {/* Stat Cards */}
      <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="col">
            <div className={`card h-100 border ${s.border} shadow-sm`}>
              <div className="card-body text-center py-4">
                <i className={`bi ${s.icon} display-5 ${s.text} d-block mb-2`}></i>
                <div className={`display-6 fw-bold ${s.text}`}>{s.value}</div>
                <div className="text-secondary small fw-medium mt-1">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white border-bottom">
          <ul className="nav nav-pills" role="tablist">
            {[
              { key: 'breached', label: 'Breached', icon: 'bi-x-octagon', badge: 'bg-danger' },
              { key: 'warnings', label: 'Warnings', icon: 'bi-exclamation-triangle', badge: 'bg-warning text-dark' },
              { key: 'active', label: 'Active', icon: 'bi-check-circle', badge: 'bg-primary' },
            ].map(t => (
              <li key={t.key} className="nav-item">
                <button
                  className={`nav-link d-flex align-items-center gap-2 ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  <i className={`bi ${t.icon}`}></i>
                  {t.label}
                  <span className={`badge rounded-pill ${tab === t.key ? 'bg-white text-primary' : t.badge}`}>
                    {t.key === 'breached' ? breached.length : t.key === 'warnings' ? warnings.length : active.length}
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
                        <td><Link to={`/cases/${r.caseId}`} className="text-primary fw-semibold">#{r.caseId}</Link></td>
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
