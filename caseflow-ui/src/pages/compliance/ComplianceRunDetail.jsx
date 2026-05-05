import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { compliance, cases, workflow } from '../../api/services'
import { formatDate, formatDateTime } from '../../utils/constants'

/* ─── SLA status visual mapping ─────────────────────────────────────── */
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

/* ─── A reusable case-level SLA + document summary card.
   Shows SLA stage status (not initiated / in stage X / breached) and
   document counts (submitted / verified / rejected / pending).
   Exported so other pages (RunComplianceCheck) can show the same view. ─ */
export function CaseSlaSummary({ caseId, stages, slaRecords, docs, caseInfo }) {
  const dc = useMemo(() => {
    const total    = docs?.length || 0
    const verified = (docs || []).filter(d => d.verificationStatus === 'VERIFIED').length
    const rejected = (docs || []).filter(d => d.verificationStatus === 'REJECTED').length
    const pending  = (docs || []).filter(d => d.verificationStatus === 'PENDING').length
    return { total, verified, rejected, pending }
  }, [docs])

  const stageState = useMemo(() => {
    if (!stages || stages.length === 0) {
      return { kind: 'NOT_INITIATED', label: 'Workflow not initiated', color: '#6c757d', bg: '#f8f9fa' }
    }
    const breaches = (slaRecords || []).filter(s => s.status === 'BREACHED')
    if (breaches.length > 0) {
      return { kind: 'BREACHED', label: `${breaches.length} stage${breaches.length !== 1 ? 's' : ''} BREACHED`, color: '#dc3545', bg: '#fef2f2' }
    }
    const active = stages.find(s => s.active)
    if (active) {
      return { kind: 'ACTIVE', label: `In stage: ${active.stageName}`, color: '#0d6efd', bg: '#eff6ff' }
    }
    if (stages.every(s => s.completedAt != null || s.skipped)) {
      return { kind: 'COMPLETED', label: 'All stages complete', color: '#198754', bg: '#f0fdf4' }
    }
    return { kind: 'UNKNOWN', label: 'No active stage', color: '#6c757d', bg: '#f8f9fa' }
  }, [stages, slaRecords])

  const sortedStages = useMemo(
    () => (stages || []).slice().sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0)),
    [stages]
  )

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

  const cardStyle = stageState.kind === 'BREACHED' ? { borderLeft: '4px solid #dc3545' } : {}

  return (
    <div className="card border-0 shadow-sm" style={cardStyle}>
      {/* Header */}
      <div className="card-header border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
        style={{ background: 'transparent' }}>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="fw-semibold">
            <Link to={`/cases/${caseId}`} className="text-decoration-none">Case #{caseId}</Link>
          </span>
          {caseInfo?.title && <span className="text-muted small">{caseInfo.title}</span>}
        </div>
        <span className="badge rounded-pill"
          style={{ background: stageState.bg, color: stageState.color, border: `1px solid ${stageState.color}33`, fontWeight: 600 }}>
          {stageState.kind === 'BREACHED' && <i className="bi bi-exclamation-octagon-fill me-1" />}
          {stageState.kind === 'ACTIVE' && <i className="bi bi-arrow-right-circle me-1" />}
          {stageState.kind === 'NOT_INITIATED' && <i className="bi bi-dash-circle me-1" />}
          {stageState.kind === 'COMPLETED' && <i className="bi bi-check-circle-fill me-1" />}
          {stageState.label}
        </span>
      </div>

      <div className="card-body">
        {/* Document counts */}
        <div className="mb-3">
          <div className="text-muted small fw-semibold mb-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
            <i className="bi bi-file-earmark-text me-1" />Documents
          </div>
          <div className="row g-2">
            <div className="col-3">
              <div className="p-2 rounded-3 text-center border">
                <div className="h5 mb-0 fw-bold">{dc.total}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Submitted</div>
              </div>
            </div>
            <div className="col-3">
              <div className="p-2 rounded-3 text-center" style={{ background: '#f0fdf4' }}>
                <div className="h5 mb-0 fw-bold text-success">{dc.verified}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Verified</div>
              </div>
            </div>
            <div className="col-3">
              <div className="p-2 rounded-3 text-center" style={{ background: '#fff7ed' }}>
                <div className="h5 mb-0 fw-bold text-warning">{dc.rejected}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Rejected</div>
              </div>
            </div>
            <div className="col-3">
              <div className="p-2 rounded-3 text-center" style={{ background: '#f8f9fa' }}>
                <div className="h5 mb-0 fw-bold">{dc.pending}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Stages */}
        <div>
          <div className="text-muted small fw-semibold mb-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
            <i className="bi bi-stopwatch me-1" />SLA Stages
          </div>
          {stageState.kind === 'NOT_INITIATED' ? (
            <div className="alert alert-secondary py-2 small mb-0">
              <i className="bi bi-info-circle me-1" />
              Workflow not initiated for this case. SLA stages will appear once the lifecycle is initialized.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {sortedStages.map(stg => {
                const sla        = (slaRecords || []).find(s => s.stageId === stg.stageId)
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
                        width: 28, height: 28,
                        background: isBreached ? '#dc3545'
                          : isActive ? '#0d6efd'
                          : status === 'COMPLETED' ? '#198754'
                          : '#dee2e6',
                        color: '#fff', fontWeight: 600, fontSize: 12,
                      }}>
                      {stg.sequenceNumber ?? '?'}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-semibold small">{stg.stageName}</span>
                        {isActive && (
                          <span className="badge rounded-pill text-bg-info" style={{ fontSize: 10 }}>
                            <i className="bi bi-circle-fill me-1" style={{ fontSize: 6 }} />CURRENT
                          </span>
                        )}
                        <SlaBadge status={status} />
                      </div>
                      <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                        SLA: <strong>{stg.slaDays}</strong>d
                        {sla?.startDate && <> &middot; started {formatDate(sla.startDate)}</>}
                        {deadline && (
                          <> &middot; deadline <strong style={{ color: isBreached ? '#dc3545' : 'inherit' }}>
                            {deadline.toLocaleDateString()}
                          </strong></>
                        )}
                      </div>
                      {isBreached && (
                        <div className="text-danger small mt-1 fw-semibold">
                          <i className="bi bi-exclamation-triangle-fill me-1" />
                          BREACHED — this stage missed its deadline.
                        </div>
                      )}
                    </div>
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

/* ─── Hook: enrich a list of caseIds with workflow + doc data ────────── */
export function useCaseEnrichment(caseIds) {
  const [data, setData] = useState({})  // { [caseId]: { stages, slaRecords, docs, caseInfo } }
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!caseIds || caseIds.length === 0) {
      setData({}); setLoading(false); return
    }
    let cancelled = false
    setLoading(true)
    Promise.all(caseIds.map(async caseId => {
      const [c, st, sla, docList] = await Promise.allSettled([
        cases.get(caseId),
        workflow.stages(caseId),
        workflow.sla(caseId),
        cases.docs(caseId),
      ])
      return [caseId, {
        caseInfo:   c.status === 'fulfilled' ? c.value : null,
        stages:     st.status === 'fulfilled' ? (st.value || []) : [],
        slaRecords: sla.status === 'fulfilled' ? (sla.value || []) : [],
        docs:       docList.status === 'fulfilled' ? (docList.value || []) : [],
      }]
    })).then(entries => {
      if (cancelled) return
      const map = {}
      entries.forEach(([id, payload]) => { map[id] = payload })
      setData(map)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(caseIds)])

  return { data, loading }
}

/* ────────────────────────────────────────────────────────────────────── */
export default function ComplianceRunDetail() {
  const { runId }  = useParams()
  const { state }  = useLocation()
  const navigate   = useNavigate()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setErr('')
      try {
        const recs = await compliance.runRecords(runId) || []
        if (active) {
          setRecords(recs)
          if (recs.length === 0) setErr('No records found for this compliance run.')
        }
      } catch (e) {
        if (active) setErr(e.message || 'Failed to load compliance run.')
      } finally {
        if (active) setLoading(false)
      }
    }
    if (state?.run?.recs?.length) {
      setRecords(state.run.recs)
      setLoading(false)
    } else {
      load()
    }
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const summary = useMemo(() => {
    const cases = new Set(records.map(r => r.caseId)).size
    const date = records.map(r => r.date).filter(Boolean).sort().reverse()[0] || null
    const runDate = records.map(r => r.runDate).filter(Boolean).sort().reverse()[0] || null
    return { cases, total: records.length, date, runDate }
  }, [records])

  const caseIds = useMemo(
    () => Array.from(new Set(records.map(r => r.caseId))).sort((a, b) => a - b),
    [records]
  )

  const { data: enriched, loading: enriching } = useCaseEnrichment(caseIds)

  if (loading) return <div className="text-center text-muted py-5">Loading…</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <button className="btn btn-link p-0 small text-muted mb-2" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1" />Back
          </button>
          <h1 className="page-title h3 mb-0">Compliance Check Detail</h1>
          <p className="text-muted small mb-0 mt-1">
            Live SLA stage status and document counts for each case checked in this run.
          </p>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2">{err}</div>}

      {/* Run metadata */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header border-bottom" style={{ background: '#f8f9fc' }}>
          <h2 className="h6 mb-0 fw-semibold">
            <i className="bi bi-info-circle me-1 text-primary" />Run Metadata
          </h2>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Run On</div>
              <div className="fw-semibold mt-1">
                <i className="bi bi-calendar3 me-1 text-muted" />
                {summary.runDate ? formatDateTime(summary.runDate) : formatDate(summary.date)}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Cases Checked</div>
              <div className="fw-semibold mt-1">{summary.cases}</div>
            </div>
            <div className="col-md-4">
              <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Total Checks</div>
              <div className="fw-semibold mt-1">{summary.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-case SLA + doc summary */}
      <h2 className="h6 fw-semibold mb-3 text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>
        Cases in this run
        {enriching && <span className="ms-2 small text-muted fw-normal">(loading SLA…)</span>}
      </h2>

      {caseIds.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center text-muted py-4">No cases in this run.</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {caseIds.map(caseId => {
            const e = enriched[caseId] || { stages: [], slaRecords: [], docs: [], caseInfo: null }
            return (
              <CaseSlaSummary
                key={caseId}
                caseId={caseId}
                stages={e.stages}
                slaRecords={e.slaRecords}
                docs={e.docs}
                caseInfo={e.caseInfo}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
