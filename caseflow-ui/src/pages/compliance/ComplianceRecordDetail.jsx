import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { compliance, cases, workflow } from '../../api/services'
import { formatDate, formatDateTime } from '../../utils/constants'

/* ─── SLA status visual mapping (no PASS/FAIL semantics) ───────────────── */
const SLA_VISUAL = {
  ON_TIME:     { label: 'On time',     color: '#0d6efd', bg: '#eff6ff', icon: 'bi-clock' },
  WARNING:     { label: 'Warning',     color: '#f59e0b', bg: '#fffbeb', icon: 'bi-exclamation-triangle' },
  BREACHED:    { label: 'Breached',    color: '#dc3545', bg: '#fef2f2', icon: 'bi-exclamation-octagon-fill' },
  COMPLETED:   { label: 'Completed',   color: '#198754', bg: '#f0fdf4', icon: 'bi-check-circle-fill' },
  SKIPPED:     { label: 'Skipped',     color: '#6c757d', bg: '#f8f9fa', icon: 'bi-skip-forward' },
  ROLLED_BACK: { label: 'Rolled back', color: '#fd7e14', bg: '#fff7ed', icon: 'bi-arrow-counterclockwise' },
}

function SlaBadge({ status }) {
  const v = SLA_VISUAL[status] || { label: status || '—', color: '#6c757d', bg: '#f8f9fa', icon: 'bi-dash-circle' }
  return (
    <span className="badge rounded-pill d-inline-flex align-items-center gap-1"
      style={{ background: v.bg, color: v.color, border: `1px solid ${v.color}33`, fontWeight: 600 }}>
      <i className={`bi ${v.icon}`} />{v.label}
    </span>
  )
}

export default function ComplianceRecordDetail() {
  const { complianceId } = useParams()
  const { state }        = useLocation()
  const navigate         = useNavigate()

  const [record, setRecord] = useState(state?.record || null)
  const [caseInfo, setCaseInfo]     = useState(null)
  const [stages, setStages]         = useState([])
  const [slaRecords, setSlaRecords] = useState([])
  const [docs, setDocs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [err, setErr]               = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setErr('')
      try {
        // 1) Resolve the compliance record
        let rec = record
        if (!rec) {
          const page = await compliance.complianceRecordsPaginated(0, 500)
          const all = page?.content || []
          rec = all.find(r => String(r.complianceId) === String(complianceId)) || null
          if (active) setRecord(rec)
        }
        if (!rec) {
          if (active) setErr('Compliance record not found.')
          return
        }
        // 2) Load case-level data so the page reflects the live SLA + doc state
        const [c, st, sla, docList] = await Promise.allSettled([
          cases.get(rec.caseId),
          workflow.stages(rec.caseId),
          workflow.sla(rec.caseId),
          cases.docs(rec.caseId),
        ])
        if (!active) return
        if (c.status === 'fulfilled')       setCaseInfo(c.value || null)
        if (st.status === 'fulfilled')      setStages(st.value || [])
        if (sla.status === 'fulfilled')     setSlaRecords(sla.value || [])
        if (docList.status === 'fulfilled') setDocs(docList.value || [])
      } catch (e) {
        if (active) setErr(e.message || 'Failed to load compliance record')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complianceId])

  // ── Derived ────────────────────────────────────────────────────────────
  const dc = (() => {
    const total = docs.length
    const verified = docs.filter(d => d.verificationStatus === 'VERIFIED').length
    const rejected = docs.filter(d => d.verificationStatus === 'REJECTED').length
    const pending  = docs.filter(d => d.verificationStatus === 'PENDING').length
    return { total, verified, rejected, pending }
  })()

  const stageState = (() => {
    if (stages.length === 0) {
      return { kind: 'NOT_INITIATED', label: 'Workflow not initiated for this case', tone: 'secondary' }
    }
    const breaches = slaRecords.filter(s => s.status === 'BREACHED')
    if (breaches.length > 0) {
      return { kind: 'BREACHED', label: `${breaches.length} stage${breaches.length !== 1 ? 's' : ''} BREACHED`, tone: 'danger' }
    }
    const active = stages.find(s => s.active)
    if (active) {
      return { kind: 'ACTIVE', label: `Currently in: ${active.stageName}`, tone: 'primary' }
    }
    if (stages.every(s => s.completedAt != null || s.skipped)) {
      return { kind: 'COMPLETED', label: 'All stages complete', tone: 'success' }
    }
    return { kind: 'UNKNOWN', label: 'No active stage', tone: 'secondary' }
  })()

  const computeDeadline = (stage, slaRecord) => {
    if (slaRecord?.startDate && stage?.slaDays != null) {
      const start = new Date(slaRecord.startDate)
      return new Date(start.getTime() + stage.slaDays * 24 * 60 * 60 * 1000)
    }
    if (stage?.startedAt && stage?.slaDays != null) {
      const start = new Date(stage.startedAt)
      return new Date(start.getTime() + stage.slaDays * 24 * 60 * 60 * 1000)
    }
    return null
  }

  const sortedStages = stages.slice().sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) return <div className="text-center text-muted py-5">Loading…</div>
  if (err) return <div className="alert alert-danger">{err}</div>
  if (!record) return <div className="alert alert-warning">Compliance record not found.</div>

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <button className="btn btn-link p-0 small text-muted mb-2" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1" />Back
          </button>
          <h1 className="page-title h3 mb-0">
            Compliance Record <span className="text-muted fw-normal">#{record.complianceId}</span>
          </h1>
          <p className="text-muted small mb-0 mt-1">
            Live SLA &amp; document state for the case this record was calculated on.
          </p>
        </div>
        <Link to={`/cases/${record.caseId}`} className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-folder2-open me-1" />Open Case #{record.caseId}
        </Link>
      </div>

      {/* ── Record metadata ─────────────────────────────────────────────── */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header border-bottom" style={{ background: '#f8f9fc' }}>
          <h2 className="h6 mb-0 fw-semibold">
            <i className="bi bi-info-circle me-1 text-primary" />Record Metadata
          </h2>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Calculated On</div>
              <div className="fw-semibold mt-1">
                <i className="bi bi-calendar3 me-1 text-muted" />
                {formatDate(record.date)}
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Scope (Case)</div>
              <div className="fw-semibold mt-1">
                <Link to={`/cases/${record.caseId}`} className="text-decoration-none">
                  Case #{record.caseId}
                </Link>
                {caseInfo?.title && <span className="text-muted small ms-2">{caseInfo.title}</span>}
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Check Type</div>
              <div className="mt-1">
                <span className={`badge rounded-pill ${record.type === 'DOCUMENT' ? 'text-bg-info' : 'text-bg-secondary'}`}>
                  <i className={`bi me-1 ${record.type === 'DOCUMENT' ? 'bi-file-earmark-check' : 'bi-diagram-3'}`} />
                  {record.type}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Record ID</div>
              <div className="fw-semibold mt-1">#{record.complianceId}</div>
            </div>
            {record.notes && (
              <div className="col-12">
                <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Notes captured at calculation time</div>
                <div className="mt-1 p-2 rounded-2 small text-muted" style={{ background: '#f8f9fa' }}>{record.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Documents panel ────────────────────────────────────────────── */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header border-bottom" style={{ background: 'transparent' }}>
          <h2 className="h6 mb-0 fw-semibold">
            <i className="bi bi-file-earmark-text me-1 text-primary" />Documents
          </h2>
        </div>
        <div className="card-body">
          <div className="row g-2">
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-3 text-center border">
                <div className="h4 mb-0 fw-bold">{dc.total}</div>
                <div className="text-muted small mt-1">Submitted</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-3 text-center" style={{ background: '#f0fdf4' }}>
                <div className="h4 mb-0 fw-bold text-success">{dc.verified}</div>
                <div className="text-muted small mt-1">Verified</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-3 text-center" style={{ background: '#fff7ed' }}>
                <div className="h4 mb-0 fw-bold text-warning">{dc.rejected}</div>
                <div className="text-muted small mt-1">Rejected</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-3 text-center" style={{ background: '#f8f9fa' }}>
                <div className="h4 mb-0 fw-bold">{dc.pending}</div>
                <div className="text-muted small mt-1">Pending</div>
              </div>
            </div>
          </div>
          {dc.total === 0 && (
            <div className="alert alert-secondary py-2 small mt-3 mb-0">
              <i className="bi bi-info-circle me-1" />No documents have been submitted for this case yet.
            </div>
          )}
        </div>
      </div>

      {/* ── SLA stages ─────────────────────────────────────────────────── */}
      <div className="card shadow-sm border-0 mb-4"
        style={stageState.kind === 'BREACHED' ? { borderLeft: '4px solid #dc3545' } : {}}>
        <div className="card-header border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{ background: 'transparent' }}>
          <h2 className="h6 mb-0 fw-semibold">
            <i className="bi bi-stopwatch me-1 text-primary" />SLA Stages
          </h2>
          {stageState.kind === 'NOT_INITIATED' && (
            <span className="badge rounded-pill text-bg-secondary">
              <i className="bi bi-dash-circle me-1" />Workflow not initiated
            </span>
          )}
          {stageState.kind === 'BREACHED' && (
            <span className="badge rounded-pill text-bg-danger">
              <i className="bi bi-exclamation-octagon-fill me-1" />{stageState.label}
            </span>
          )}
          {stageState.kind === 'ACTIVE' && (
            <span className="badge rounded-pill text-bg-info">
              <i className="bi bi-arrow-right-circle me-1" />{stageState.label}
            </span>
          )}
          {stageState.kind === 'COMPLETED' && (
            <span className="badge rounded-pill text-bg-success">
              <i className="bi bi-check-circle-fill me-1" />{stageState.label}
            </span>
          )}
        </div>
        <div className="card-body">
          {stageState.kind === 'NOT_INITIATED' ? (
            <div className="alert alert-secondary py-2 mb-0 small">
              <i className="bi bi-info-circle me-1" />
              This case does not have an initiated workflow yet. SLA stages will appear once the lifecycle is initialized.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {sortedStages.map(stg => {
                const sla        = slaRecords.find(s => s.stageId === stg.stageId)
                const status     = sla?.status || (stg.completedAt ? 'COMPLETED' : stg.active ? 'ON_TIME' : null)
                const isActive   = stg.active
                const isBreached = status === 'BREACHED'
                const deadline   = computeDeadline(stg, sla)

                return (
                  <div key={stg.stageId}
                    className="d-flex align-items-center gap-3 p-2 rounded-3"
                    style={{
                      background: isBreached ? '#fef2f2' : isActive ? '#eff6ff' : '#fafafa',
                      border: isBreached ? '1px solid #fecaca'
                        : isActive ? '1px solid #bfdbfe'
                        : '1px solid #f0f2f7',
                    }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: 32, height: 32,
                        background: isBreached ? '#dc3545'
                          : isActive ? '#0d6efd'
                          : status === 'COMPLETED' ? '#198754'
                          : '#dee2e6',
                        color: '#fff', fontWeight: 600, fontSize: 13,
                      }}>
                      {stg.sequenceNumber ?? '?'}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-semibold">{stg.stageName}</span>
                        {isActive && (
                          <span className="badge rounded-pill text-bg-info" style={{ fontSize: 10 }}>
                            <i className="bi bi-circle-fill me-1" style={{ fontSize: 6 }} />CURRENT
                          </span>
                        )}
                        <SlaBadge status={status} />
                        {stg.roleResponsible && (
                          <span className="badge text-bg-light border text-muted" style={{ fontSize: 11 }}>
                            {stg.roleResponsible}
                          </span>
                        )}
                      </div>
                      <div className="text-muted small mt-1">
                        SLA: <strong>{stg.slaDays}</strong> day{stg.slaDays !== 1 ? 's' : ''}
                        {sla?.startDate && <> &middot; started {formatDate(sla.startDate)}</>}
                        {deadline && (
                          <> &middot; deadline <strong style={{ color: isBreached ? '#dc3545' : 'inherit' }}>
                            {deadline.toLocaleDateString()}
                          </strong></>
                        )}
                        {sla?.daysRemaining != null && !isBreached && status !== 'COMPLETED' && (
                          <> &middot; <strong>{sla.daysRemaining}</strong> day{sla.daysRemaining !== 1 ? 's' : ''} remaining</>
                        )}
                      </div>
                      {isBreached && (
                        <div className="text-danger small mt-1 fw-semibold">
                          <i className="bi bi-exclamation-triangle-fill me-1" />
                          SLA BREACHED — this stage missed its deadline.
                        </div>
                      )}
                    </div>
                    {sla?.slaUsagePercent != null && status !== 'COMPLETED' && (
                      <div style={{ width: 70 }} className="flex-shrink-0">
                        <div className="text-end small text-muted">{Math.round(sla.slaUsagePercent)}%</div>
                        <div className="progress" style={{ height: 4, borderRadius: 4 }}>
                          <div
                            className={`progress-bar ${isBreached ? 'bg-danger' : sla.slaUsagePercent > 80 ? 'bg-warning' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, sla.slaUsagePercent)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
