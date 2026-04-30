import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { workflow } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useLanguage } from '../../context/LanguageContext'

export default function WorkflowDashboard() {
  const { user } = useAuth()
  const isAdmin = ['ADMIN', 'CLERK'].includes(user?.role)

  const [caseIdInput, setCaseIdInput] = useState('')
  const [loadedCaseId, setLoadedCaseId] = useState(null)
  const [stages, setStages] = useState([])
  const [current, setCurrent] = useState(null)
  const [slaRecords, setSlaRecords] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const [activeAction, setActiveAction] = useState(null)
  const [skipForm, setSkipForm] = useState('')
  const [extForm, setExtForm] = useState({ additionalDays: 1, reason: '' })
  const [reassignForm, setReassignForm] = useState({ stageId: '', newRole: '' })

  const loadCase = async (id) => {
    if (!id) return
    setErr(''); setMsg(''); setLoading(true)
    try {
      const [s, c, r] = await Promise.allSettled([
        workflow.stages(id),
        workflow.current(id),
        workflow.sla(id),
      ])
      if (s.status === 'fulfilled') setStages(s.value || []); else setStages([])
      if (c.status === 'fulfilled') setCurrent(c.value); else setCurrent(null)
      if (r.status === 'fulfilled') setSlaRecords(r.value || []); else setSlaRecords([])
      setLoadedCaseId(id)
      if (s.status === 'rejected') setErr(s.reason?.message || 'Failed to load workflow')
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  const handleSearch = (e) => { e.preventDefault(); if (caseIdInput.trim()) loadCase(caseIdInput.trim()) }

  const advance = async () => { try { const r = await workflow.advance(loadedCaseId); setMsg(r?.message || 'Advanced'); loadCase(loadedCaseId) } catch (e) { setErr(e.message) } }
  const rollback = async () => { try { await workflow.rollback(loadedCaseId); setMsg('Rolled back'); loadCase(loadedCaseId) } catch (e) { setErr(e.message) } }
  const skip = async (e) => { e.preventDefault(); try { await workflow.skip(loadedCaseId, { reason: skipForm }); setMsg('Stage skipped'); setSkipForm(''); setActiveAction(null); loadCase(loadedCaseId) } catch (e) { setErr(e.message) } }
  const extend = async (e) => { e.preventDefault(); try { await workflow.extendSla(loadedCaseId, { additionalDays: Number(extForm.additionalDays), reason: extForm.reason }); setMsg('SLA extended'); setExtForm({ additionalDays: 1, reason: '' }); setActiveAction(null); loadCase(loadedCaseId) } catch (e) { setErr(e.message) } }
  const reassign = async (e) => { e.preventDefault(); try { await workflow.reassign(loadedCaseId, { stageId: Number(reassignForm.stageId), newRole: reassignForm.newRole }); setMsg('Reassigned'); setReassignForm({ stageId: '', newRole: '' }); setActiveAction(null); loadCase(loadedCaseId) } catch (e) { setErr(e.message) } }

  const completedCount = stages.filter(s => s.completedAt && !s.active).length
  const totalStages = stages.length
  const progressPct = totalStages > 0 ? Math.round((completedCount / totalStages) * 100) : 0
  const getSlaClass = (pct) => pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-warning' : 'bg-success'

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title h3 mb-1">Workflow Management</h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            {isAdmin ? 'Search a case to view and manage its workflow pipeline' : 'Search a case to view its workflow progress'}
          </p>
        </div>
        {isAdmin && (
          <Link to="/workflow/sla" className="btn btn-outline-dark">
            <i className="bi bi-speedometer2 me-2"></i>SLA Monitoring
          </Link>
        )}
      </div>

      {err && <div className="alert alert-danger alert-dismissible fade show py-2">{err}<button type="button" className="btn-close" onClick={() => setErr('')}></button></div>}
      {msg && <div className="alert alert-success alert-dismissible fade show py-2">{msg}<button type="button" className="btn-close" onClick={() => setMsg('')}></button></div>}

      {/* Case search */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearch} className="d-flex gap-2 align-items-center">
            <i className="bi bi-search text-muted"></i>
            <input className="form-control" placeholder="Enter Case ID (e.g. 101)" value={caseIdInput} onChange={e => setCaseIdInput(e.target.value)} style={{ maxWidth: 300 }} />
            <button type="submit" className="btn btn-dark" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-1"></span>}
              Load Workflow
            </button>
          </form>
        </div>
      </div>

      {/* Empty state */}
      {!loadedCaseId && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-diagram-3 d-block mb-2" style={{ fontSize: 48, opacity: 0.2 }}></i>
          <p className="mb-0">Enter a Case ID above to view its workflow</p>
        </div>
      )}

      {/* No workflow */}
      {loadedCaseId && stages.length === 0 && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-diagram-3 d-block mb-2" style={{ fontSize: 48, opacity: 0.2 }}></i>
          <p className="mb-1">No workflow initialized for Case #{loadedCaseId}</p>
          {isAdmin && (
            <Link to={`/workflow/${loadedCaseId}`} className="btn btn-dark mt-2">
              <i className="bi bi-plus-circle me-1"></i>Initialize Workflow
            </Link>
          )}
        </div>
      )}

      {/* Loaded workflow */}
      {loadedCaseId && stages.length > 0 && (
        <>
          {/* Progress + arrow indicators */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0"><i className="bi bi-bar-chart-steps me-2"></i>Case #{loadedCaseId} — Pipeline Progress</h6>
                <span className="badge bg-dark rounded-pill">{completedCount} / {totalStages} stages</span>
              </div>
              <div className="progress mb-3" style={{ height: 10 }}>
                <div className="progress-bar bg-dark progress-bar-striped progress-bar-animated" style={{ width: `${progressPct}%` }}></div>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-1 justify-content-center">
                {stages.map((s, i) => {
                  const isCompleted = !!s.completedAt && !s.active
                  const isActive = s.active
                  const isSkipped = s.skipped
                  let bg = '#e9ecef', color = '#6c757d'
                  if (isCompleted) { bg = '#212529'; color = '#fff' }
                  if (isActive) { bg = '#495057'; color = '#fff' }
                  if (isSkipped) { bg = '#dee2e6'; color = '#6c757d' }
                  return (
                    <div key={s.stageId} className="d-flex align-items-center gap-1">
                      <div className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
                        style={{ background: bg, color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                        title={`${s.stageName} — ${isCompleted ? 'Completed' : isActive ? 'Active' : isSkipped ? 'Skipped' : 'Pending'}`}>
                        {isCompleted && <i className="bi bi-check-lg"></i>}
                        {isSkipped && <i className="bi bi-skip-forward"></i>}
                        {isActive && <i className="bi bi-circle-fill" style={{ fontSize: 6 }}></i>}
                        {s.stageName}
                      </div>
                      {i < stages.length - 1 && <i className={`bi bi-chevron-right ${isCompleted || isSkipped ? '' : 'text-body-tertiary'}`} style={{ fontSize: 10 }}></i>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Current stage — admin can manipulate */}
          {current && isAdmin && (
            <div className="card shadow-sm border-0 mb-4" style={{ background: '#212529', color: '#fff' }}>
              <div className="card-body py-4">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-5">
                    <span className="badge bg-light text-dark fw-bold mb-2">ACTIVE STAGE</span>
                    <h4 className="fw-bold mb-1">{current.stageName}</h4>
                    <p className="opacity-75 mb-0 small">Assigned to <strong>{current.roleResponsible}</strong> &middot; Seq #{current.sequenceNumber}</p>
                  </div>
                  <div className="col-6 col-md-2 text-center">
                    <div className="display-6 fw-bold">{current.slaDays}</div>
                    <small className="text-uppercase opacity-75" style={{ letterSpacing: '0.5px', fontSize: 11 }}>SLA Days</small>
                  </div>
                  <div className="col-6 col-md-2 text-center">
                    <div className="fw-bold">{formatDate(current.startedAt)}</div>
                    <small className="text-uppercase opacity-75" style={{ letterSpacing: '0.5px', fontSize: 11 }}>Started</small>
                  </div>
                  <div className="col-12 col-md-3 d-flex gap-2 justify-content-md-end flex-wrap">
                    <button className="btn btn-light fw-semibold" onClick={advance}>Advance <i className="bi bi-arrow-right ms-1"></i></button>
                    <button className="btn btn-outline-light fw-semibold" onClick={rollback}><i className="bi bi-arrow-left me-1"></i> Rollback</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current stage — read only for non-admin */}
          {current && !isAdmin && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body py-4">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-6">
                    <span className="badge bg-dark fw-bold mb-2">ACTIVE STAGE</span>
                    <h4 className="fw-bold mb-1">{current.stageName}</h4>
                    <p className="text-muted mb-0 small">Assigned to <strong>{current.roleResponsible}</strong> &middot; Seq #{current.sequenceNumber}</p>
                  </div>
                  <div className="col-6 col-md-3 text-center">
                    <div className="display-6 fw-bold">{current.slaDays}</div>
                    <small className="text-muted text-uppercase" style={{ letterSpacing: '0.5px', fontSize: 11 }}>SLA Days</small>
                  </div>
                  <div className="col-6 col-md-3 text-center">
                    <div className="fw-bold">{formatDate(current.startedAt)}</div>
                    <small className="text-muted text-uppercase" style={{ letterSpacing: '0.5px', fontSize: 11 }}>Started</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!current && (
            <div className="card shadow-sm mb-4">
              <div className="card-body text-center text-muted py-4">
                <i className="bi bi-check-circle display-6 d-block mb-2"></i>
                No active stage — workflow may be completed.
              </div>
            </div>
          )}

          {/* Admin action forms */}
          {isAdmin && (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-white border-bottom">
                <ul className="nav nav-pills nav-fill" role="tablist">
                  {[
                    { key: 'skip', icon: 'bi-skip-forward', label: 'Skip Stage' },
                    { key: 'extend', icon: 'bi-clock-history', label: 'Extend SLA' },
                    { key: 'reassign', icon: 'bi-people', label: 'Reassign Role' },
                  ].map(a => (
                    <li key={a.key} className="nav-item">
                      <button className={`nav-link ${activeAction === a.key ? 'active' : ''}`} onClick={() => setActiveAction(activeAction === a.key ? null : a.key)}>
                        <i className={`bi ${a.icon} me-1`}></i>{a.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {activeAction && (
                <div className="card-body">
                  {activeAction === 'skip' && (
                    <form onSubmit={skip}>
                      <h6 className="fw-bold mb-3"><i className="bi bi-skip-forward me-2"></i>Skip Current Stage</h6>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Reason (5 - 1000 chars)</label>
                        <textarea className="form-control" rows={3} minLength={5} maxLength={1000} value={skipForm} onChange={e => setSkipForm(e.target.value)} required placeholder="Explain why this stage should be skipped..." />
                      </div>
                      <button type="submit" className="btn btn-dark fw-semibold"><i className="bi bi-skip-forward me-1"></i>Skip Stage</button>
                    </form>
                  )}
                  {activeAction === 'extend' && (
                    <form onSubmit={extend}>
                      <h6 className="fw-bold mb-3"><i className="bi bi-clock-history me-2"></i>Extend SLA Deadline</h6>
                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Additional Days</label>
                          <input className="form-control" type="number" min={1} value={extForm.additionalDays} onChange={e => setExtForm({ ...extForm, additionalDays: e.target.value })} required />
                        </div>
                        <div className="col-md-8">
                          <label className="form-label small fw-semibold">Reason</label>
                          <input className="form-control" value={extForm.reason} onChange={e => setExtForm({ ...extForm, reason: e.target.value })} required placeholder="Why extend?" />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-dark fw-semibold"><i className="bi bi-clock-history me-1"></i>Extend SLA</button>
                    </form>
                  )}
                  {activeAction === 'reassign' && (
                    <form onSubmit={reassign}>
                      <h6 className="fw-bold mb-3"><i className="bi bi-people me-2"></i>Reassign Stage Role</h6>
                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Stage ID</label>
                          <input className="form-control" type="number" value={reassignForm.stageId} onChange={e => setReassignForm({ ...reassignForm, stageId: e.target.value })} required placeholder="Stage ID" />
                        </div>
                        <div className="col-md-8">
                          <label className="form-label small fw-semibold">New Role</label>
                          <input className="form-control" value={reassignForm.newRole} onChange={e => setReassignForm({ ...reassignForm, newRole: e.target.value })} required placeholder="e.g. JUDGE" />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-dark fw-semibold"><i className="bi bi-people me-1"></i>Reassign</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SLA Records */}
          {slaRecords.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-white d-flex align-items-center gap-2 border-bottom">
                <i className="bi bi-speedometer2"></i>
                <h5 className="mb-0 fw-bold">SLA Tracking</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {slaRecords.map(r => {
                    const pct = r.slaUsagePercent || 0
                    const cls = getSlaClass(pct)
                    return (
                      <div key={r.slaRecordId} className="col-12 col-md-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold small">Stage #{r.stageId}</span>
                            <span className={`badge rounded-pill ${statusBadgeClass(r.status)}`}>{r.status}</span>
                          </div>
                          <div className="progress mb-2" style={{ height: 8 }}>
                            <div className={`progress-bar ${cls}`} style={{ width: `${Math.min(pct, 100)}%`, transition: 'width 0.6s ease' }}></div>
                          </div>
                          <div className="d-flex justify-content-between small text-secondary">
                            <span>{formatDate(r.startDate)} &rarr; {formatDate(r.endDate)}</span>
                            <span className="fw-semibold">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* All Stages Table */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white d-flex align-items-center gap-2 border-bottom">
              <i className="bi bi-table"></i>
              <h5 className="mb-0 fw-bold">All Stages</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr><th>ID</th><th>Seq</th><th>Stage</th><th>Role</th><th>SLA</th><th>Started</th><th>Completed</th><th>Status</th></tr></thead>
                  <tbody>
                    {stages.map(s => (
                      <tr key={s.stageId}>
                        <td className="text-muted small">#{s.stageId}</td>
                        <td><span className="badge bg-body-secondary text-dark rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>{s.sequenceNumber}</span></td>
                        <td className="fw-semibold">{s.stageName}</td>
                        <td><span className="badge bg-body-secondary text-secondary">{s.roleResponsible}</span></td>
                        <td>{s.slaDays} days</td>
                        <td className="small text-secondary">{formatDate(s.startedAt)}</td>
                        <td className="small text-secondary">{formatDate(s.completedAt)}</td>
                        <td>
                          {s.active && <span className="badge rounded-pill text-bg-dark">Active</span>}
                          {s.skipped && <span className="badge rounded-pill text-bg-secondary">Skipped</span>}
                          {s.completedAt && !s.active && <span className="badge rounded-pill text-bg-dark">Done</span>}
                          {!s.active && !s.skipped && !s.completedAt && <span className="badge rounded-pill bg-body-secondary text-secondary">Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to={`/cases/${loadedCaseId}`} className="btn btn-outline-dark btn-sm">
              <i className="bi bi-folder2-open me-1"></i>View Full Case Details
            </Link>
            {isAdmin && (
              <Link to={`/workflow/${loadedCaseId}`} className="btn btn-outline-dark btn-sm ms-2">
                <i className="bi bi-gear me-1"></i>Case Workflow Page
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
