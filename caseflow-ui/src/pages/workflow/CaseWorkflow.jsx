import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { workflow } from '../../api/services'
import { CASE_TYPES, statusBadgeClass, formatDate } from '../../utils/constants'

const CASE_TYPE_INFO = {
  civil: {
    icon: 'bi-balance-scale',
    title: 'Civil Case',
    description: 'Disputes between individuals or organizations, including property, contracts, family matters, and personal injury cases.',
    stages: ['Filing & Registration', 'Summons & Notice', 'Pleadings', 'Discovery', 'Pre-Trial', 'Trial', 'Judgment', 'Execution'],
    bg: 'primary',
  },
  criminal: {
    icon: 'bi-shield-lock',
    title: 'Criminal Case',
    description: 'Cases involving alleged violations of criminal law, including felonies, misdemeanors, and regulatory offences.',
    stages: ['FIR & Investigation', 'Charge Sheet', 'Arraignment', 'Evidence Review', 'Trial', 'Verdict', 'Sentencing', 'Appeal Window'],
    bg: 'danger',
  },
  corporate: {
    icon: 'bi-building',
    title: 'Corporate Case',
    description: 'Business and commercial disputes including mergers, compliance violations, shareholder conflicts, and regulatory matters.',
    stages: ['Complaint Filing', 'Regulatory Review', 'Board Response', 'Mediation', 'Hearing', 'Ruling', 'Compliance Order', 'Closure'],
    bg: 'success',
  }
}

export default function CaseWorkflow() {
  const { caseId } = useParams()
  const [stages, setStages] = useState([])
  const [current, setCurrent] = useState(null)
  const [slaRecords, setSlaRecords] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const [initForm, setInitForm] = useState({ caseType: 'civil', mode: 'auto' })
  const [manualStages, setManualStages] = useState([{ sequenceNumber: 1, stageName: '', roleResponsible: '', slaDays: 7 }])
  const [skipForm, setSkipForm] = useState('')
  const [extForm, setExtForm] = useState({ additionalDays: 1, reason: '' })
  const [reassignForm, setReassignForm] = useState({ stageId: '', newRole: '' })
  const [activeAction, setActiveAction] = useState(null)

  const load = async () => {
    setErr('')
    try {
      const [s, c, r] = await Promise.allSettled([
        workflow.stages(caseId),
        workflow.current(caseId),
        workflow.sla(caseId),
      ])
      if (s.status === 'fulfilled') setStages(s.value || [])
      if (c.status === 'fulfilled') setCurrent(c.value)
      else setCurrent(null)
      if (r.status === 'fulfilled') setSlaRecords(r.value || [])
    } catch (e) { setErr(e.message) }
  }

  useEffect(() => { load() }, [caseId])

  const initialize = async (e) => {
    e.preventDefault(); setErr(''); setMsg('')
    try {
      const body = { caseType: initForm.caseType, mode: initForm.mode }
      if (initForm.mode === 'manual') body.stages = manualStages.map(s => ({ ...s, slaDays: Number(s.slaDays), sequenceNumber: Number(s.sequenceNumber) }))
      const res = await workflow.init(caseId, body)
      setMsg(res?.message || 'Workflow initialized')
      load()
    } catch (e) { setErr(e.message) }
  }
  const advance = async () => { try { const r = await workflow.advance(caseId); setMsg(r?.message || 'Advanced'); load() } catch (e) { setErr(e.message) } }
  const rollback = async () => { try { await workflow.rollback(caseId); setMsg('Rolled back'); load() } catch (e) { setErr(e.message) } }
  const skip = async (e) => { e.preventDefault(); try { await workflow.skip(caseId, { reason: skipForm }); setMsg('Stage skipped'); setSkipForm(''); load() } catch (e) { setErr(e.message) } }
  const extend = async (e) => { e.preventDefault(); try { await workflow.extendSla(caseId, { additionalDays: Number(extForm.additionalDays), reason: extForm.reason }); setMsg('SLA extended'); setExtForm({ additionalDays: 1, reason: '' }); load() } catch (e) { setErr(e.message) } }
  const reassign = async (e) => { e.preventDefault(); try { await workflow.reassign(caseId, { stageId: Number(reassignForm.stageId), newRole: reassignForm.newRole }); setMsg('Reassigned'); load() } catch (e) { setErr(e.message) } }

  const addStage = () => setManualStages([...manualStages, { sequenceNumber: manualStages.length + 1, stageName: '', roleResponsible: '', slaDays: 7 }])
  const updStage = (i, k, v) => { const x = [...manualStages]; x[i] = { ...x[i], [k]: v }; setManualStages(x) }
  const rmStage = (i) => setManualStages(manualStages.filter((_, idx) => idx !== i))

  const getSlaClass = (pct) => pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-warning' : 'bg-success'

  const completedCount = stages.filter(s => s.completedAt && !s.active).length
  const totalStages = stages.length
  const progressPct = totalStages > 0 ? Math.round((completedCount / totalStages) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Workflow &mdash; Case #{caseId}</h1>
        <Link to={`/cases/${caseId}`} className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i>Back to Case
        </Link>
      </div>

      {err && <div className="alert alert-danger alert-dismissible fade show py-2" role="alert">{err}<button type="button" className="btn-close" onClick={() => setErr('')}></button></div>}
      {msg && <div className="alert alert-success alert-dismissible fade show py-2" role="alert">{msg}<button type="button" className="btn-close" onClick={() => setMsg('')}></button></div>}

      {/* ============ INITIALIZATION FORM ============ */}
      {stages.length === 0 ? (
        <form onSubmit={initialize}>
          {/* Hero */}
          <div className="card border-0 bg-primary bg-gradient text-white shadow mb-4">
            <div className="card-body text-center py-5">
              <i className="bi bi-diagram-3 display-4 d-block mb-3"></i>
              <h2 className="card-title fw-bold mb-2">Initialize Workflow</h2>
              <p className="card-text opacity-75 mx-auto mb-0" style={{ maxWidth: 520 }}>
                Set up the lifecycle pipeline for this case. Choose automatic templates or build your own custom stages.
              </p>
            </div>
          </div>

          {/* Mode selector */}
          <div className="row g-3 mb-4 justify-content-center">
            {[
              { key: 'auto', icon: 'bi-lightning-charge', title: 'Automatic', desc: 'Use predefined stage templates based on case type. Recommended for standard proceedings.' },
              { key: 'manual', icon: 'bi-tools', title: 'Manual', desc: 'Define custom stages, roles, and SLA timelines. For specialized or non-standard cases.' },
            ].map(m => (
              <div key={m.key} className="col-12 col-md-5">
                <div
                  className={`card h-100 text-center border-2 shadow-sm position-relative overflow-hidden ${initForm.mode === m.key ? 'border-primary' : 'border-light'}`}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setInitForm({ ...initForm, mode: m.key })}
                >
                  {initForm.mode === m.key && (
                    <span className="position-absolute top-0 end-0 m-2 badge rounded-pill bg-primary">
                      <i className="bi bi-check-lg"></i>
                    </span>
                  )}
                  <div className="card-body py-4">
                    <i className={`bi ${m.icon} display-5 text-primary d-block mb-2`}></i>
                    <h5 className="card-title fw-bold">{m.title}</h5>
                    <p className="card-text text-secondary small mb-0">{m.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Auto: Case type selection */}
          {initForm.mode === 'auto' && (
            <div className="mb-4">
              <h5 className="text-center text-secondary fw-semibold mb-4">Select Case Type</h5>
              <div className="row row-cols-1 row-cols-md-3 g-4 mb-4">
                {CASE_TYPES.map(type => {
                  const info = CASE_TYPE_INFO[type]
                  const selected = initForm.caseType === type
                  return (
                    <div key={type} className="col">
                      <div
                        className={`card h-100 border-2 shadow-sm position-relative overflow-hidden ${selected ? `border-${info.bg}` : 'border-light'}`}
                        style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                        onClick={() => setInitForm({ ...initForm, caseType: type })}
                      >
                        {selected && (
                          <span className={`position-absolute top-0 end-0 m-2 badge rounded-pill bg-${info.bg}`}>
                            <i className="bi bi-check-lg me-1"></i>Selected
                          </span>
                        )}
                        <div className={`bg-${info.bg} bg-opacity-10 text-center py-4`}>
                          <i className={`bi ${info.icon} display-3 text-${info.bg}`}></i>
                        </div>
                        <div className="card-body">
                          <h5 className="card-title fw-bold">{info.title}</h5>
                          <p className="card-text text-secondary small">{info.description}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {info.stages.map((s, i) => (
                              <span key={i} className="badge bg-body-secondary text-secondary fw-medium">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Manual: stage builder */}
          {initForm.mode === 'manual' && (
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <label className="form-label fw-semibold mb-0">Case Type:</label>
                <select className="form-select form-select-sm w-auto" value={initForm.caseType} onChange={e => setInitForm({ ...initForm, caseType: e.target.value })}>
                  {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="card shadow-sm mb-3">
                <div className="card-header bg-body-secondary d-flex align-items-center gap-2">
                  <i className="bi bi-list-ol text-primary"></i>
                  <h6 className="mb-0 fw-bold text-uppercase small">Build Your Stages</h6>
                </div>
                <div className="card-body">
                  <p className="text-secondary small mb-3">Define each stage with name, responsible role, and SLA deadline.</p>
                  {manualStages.map((s, i) => (
                    <div key={i} className="row g-2 align-items-center mb-2 p-2 rounded bg-body-tertiary">
                      <div className="col-auto">
                        <input type="number" className="form-control form-control-sm text-center" style={{ width: 60 }} value={s.sequenceNumber} onChange={e => updStage(i, 'sequenceNumber', e.target.value)} title="Sequence" />
                      </div>
                      <div className="col">
                        <input className="form-control form-control-sm" placeholder="Stage name (e.g. Filing)" value={s.stageName} onChange={e => updStage(i, 'stageName', e.target.value)} required />
                      </div>
                      <div className="col">
                        <input className="form-control form-control-sm" placeholder="Role (e.g. CLERK)" value={s.roleResponsible} onChange={e => updStage(i, 'roleResponsible', e.target.value)} required />
                      </div>
                      <div className="col-auto">
                        <input type="number" className="form-control form-control-sm text-center" style={{ width: 80 }} placeholder="SLA" value={s.slaDays} onChange={e => updStage(i, 'slaDays', e.target.value)} required title="SLA Days" />
                      </div>
                      <div className="col-auto">
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => rmStage(i)}>
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={addStage}>
                    <i className="bi bi-plus-lg me-1"></i>Add Stage
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="text-center mt-3">
            <button type="submit" className="btn btn-primary btn-lg px-5 shadow">
              <i className="bi bi-rocket-takeoff me-2"></i>Initialize Workflow
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* ============ ACTIVE WORKFLOW VIEW ============ */}

          {/* Overall Progress */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-bar-chart-steps me-2 text-primary"></i>Pipeline Progress
                </h6>
                <span className="badge bg-primary rounded-pill">{completedCount} / {totalStages} stages</span>
              </div>
              <div className="progress mb-3" style={{ height: 10 }}>
                <div className="progress-bar bg-primary progress-bar-striped progress-bar-animated" style={{ width: `${progressPct}%` }}></div>
              </div>

              {/* Stage step indicators */}
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {stages.map((s, i) => {
                  const isCompleted = !!s.completedAt && !s.active
                  const isActive = s.active
                  const isSkipped = s.skipped
                  let badgeClass = 'bg-body-secondary text-secondary'
                  if (isCompleted) badgeClass = 'bg-success text-white'
                  if (isActive) badgeClass = 'bg-primary text-white'
                  if (isSkipped) badgeClass = 'bg-warning text-dark'
                  return (
                    <div key={s.stageId} className="d-flex align-items-center gap-1">
                      <span className={`badge rounded-circle ${badgeClass} d-inline-flex align-items-center justify-content-center`}
                        style={{ width: 32, height: 32, fontSize: 13 }} title={s.stageName}>
                        {isCompleted ? <i className="bi bi-check-lg"></i> : isSkipped ? <i className="bi bi-skip-forward"></i> : s.sequenceNumber}
                      </span>
                      <small className={`fw-medium ${isActive ? 'text-primary' : 'text-secondary'}`} style={{ fontSize: 11 }}>{s.stageName}</small>
                      {i < stages.length - 1 && <i className={`bi bi-chevron-right ${isCompleted || isSkipped ? 'text-success' : 'text-body-tertiary'}`} style={{ fontSize: 10 }}></i>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Current Stage Card */}
          {current ? (
            <div className="card border-0 bg-primary bg-gradient text-white shadow mb-4">
              <div className="card-body py-4">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-5">
                    <span className="badge bg-white text-primary fw-bold mb-2">ACTIVE</span>
                    <h4 className="fw-bold mb-1">{current.stageName}</h4>
                    <p className="opacity-75 mb-0 small">
                      Assigned to <strong>{current.roleResponsible}</strong> &middot; Sequence #{current.sequenceNumber}
                    </p>
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
                    <button className="btn btn-light fw-semibold" onClick={advance}>
                      Advance <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                    <button className="btn btn-outline-light fw-semibold" onClick={rollback}>
                      <i className="bi bi-arrow-left me-1"></i> Rollback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm mb-4">
              <div className="card-body text-center text-muted py-4">
                <i className="bi bi-check-circle display-6 d-block mb-2 text-success"></i>
                No active stage — workflow may be completed.
              </div>
            </div>
          )}

          {/* SLA Records */}
          {slaRecords.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-white d-flex align-items-center gap-2 border-bottom">
                <i className="bi bi-speedometer2 text-primary"></i>
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
                          <div className="d-flex gap-3 mt-1 small text-secondary">
                            <span>{r.daysElapsed}d elapsed</span>
                            <span>{r.daysRemaining}d remaining</span>
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
              <i className="bi bi-table text-primary"></i>
              <h5 className="mb-0 fw-bold">All Stages</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr><th>Seq</th><th>Stage</th><th>Role</th><th>SLA</th><th>Started</th><th>Completed</th><th>Status</th></tr></thead>
                  <tbody>
                    {stages.map(s => (
                      <tr key={s.stageId}>
                        <td><span className="badge bg-body-secondary text-dark rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>{s.sequenceNumber}</span></td>
                        <td className="fw-semibold">{s.stageName}</td>
                        <td><span className="badge bg-body-secondary text-secondary">{s.roleResponsible}</span></td>
                        <td>{s.slaDays} days</td>
                        <td className="small text-secondary">{formatDate(s.startedAt)}</td>
                        <td className="small text-secondary">{formatDate(s.completedAt)}</td>
                        <td>
                          {s.active && <span className="badge rounded-pill text-bg-info">Active</span>}
                          {s.skipped && <span className="badge rounded-pill text-bg-warning">Skipped</span>}
                          {s.completedAt && !s.active && <span className="badge rounded-pill text-bg-success">Done</span>}
                          {!s.active && !s.skipped && !s.completedAt && <span className="badge rounded-pill text-bg-secondary">Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Cards — nav pills tabs */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white border-bottom">
              <ul className="nav nav-pills nav-fill" role="tablist">
                {[
                  { key: 'skip', icon: 'bi-skip-forward', label: 'Skip Stage' },
                  { key: 'extend', icon: 'bi-clock-history', label: 'Extend SLA' },
                  { key: 'reassign', icon: 'bi-people', label: 'Reassign Role' },
                ].map(t => (
                  <li key={t.key} className="nav-item">
                    <button
                      className={`nav-link ${activeAction === t.key ? 'active' : ''}`}
                      onClick={() => setActiveAction(activeAction === t.key ? null : t.key)}
                    >
                      <i className={`bi ${t.icon} me-1`}></i>{t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {activeAction && (
              <div className="card-body">
                {activeAction === 'skip' && (
                  <form onSubmit={skip}>
                    <h6 className="fw-bold mb-3"><i className="bi bi-skip-forward me-2 text-warning"></i>Skip Current Stage</h6>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Reason (5 - 1000 chars)</label>
                      <textarea className="form-control" rows={3} minLength={5} maxLength={1000} value={skipForm} onChange={e => setSkipForm(e.target.value)} required placeholder="Explain why this stage should be skipped..." />
                    </div>
                    <button type="submit" className="btn btn-warning fw-semibold">
                      <i className="bi bi-skip-forward me-1"></i>Skip Stage
                    </button>
                  </form>
                )}
                {activeAction === 'extend' && (
                  <form onSubmit={extend}>
                    <h6 className="fw-bold mb-3"><i className="bi bi-clock-history me-2 text-info"></i>Extend SLA Deadline</h6>
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
                    <button type="submit" className="btn btn-info text-white fw-semibold">
                      <i className="bi bi-clock-history me-1"></i>Extend SLA
                    </button>
                  </form>
                )}
                {activeAction === 'reassign' && (
                  <form onSubmit={reassign}>
                    <h6 className="fw-bold mb-3"><i className="bi bi-people me-2 text-secondary"></i>Reassign Stage Role</h6>
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
                    <button type="submit" className="btn btn-secondary fw-semibold">
                      <i className="bi bi-people me-1"></i>Reassign
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
