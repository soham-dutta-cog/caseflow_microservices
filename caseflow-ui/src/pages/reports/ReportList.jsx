import { useEffect, useMemo, useState } from 'react'
import { reports } from '../../api/services'
import { REPORT_SCOPE, REPORT_SCOPE_HELP, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

/* ─── small visual helpers ─────────────────────────────────────────────── */

function StatCard({ label, value, sub, tone = 'neutral', icon }) {
  const toneClass =
    tone === 'success' ? 'text-success' :
    tone === 'danger'  ? 'text-danger'  :
    tone === 'warning' ? 'text-warning' :
    tone === 'info'    ? 'text-info'    : 'text-dark'
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body py-3">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px' }}>{label}</div>
            <div className={`h3 fw-bold mb-0 mt-1 ${toneClass}`}>{value}</div>
            {sub && <div className="text-muted small mt-1">{sub}</div>}
          </div>
          {icon && <i className={`bi ${icon} display-6 text-muted opacity-25`} />}
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value, max = 100, tone = 'primary' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const bg =
    tone === 'success' ? 'bg-success' :
    tone === 'danger'  ? 'bg-danger'  :
    tone === 'warning' ? 'bg-warning' :
    tone === 'info'    ? 'bg-info'    : 'bg-primary'
  return (
    <div className="progress" style={{ height: 6 }}>
      <div className={`progress-bar ${bg}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function MetricRow({ label, value, total, tone = 'primary' }) {
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small">
        <span className="text-muted">{label}</span>
        <span className="fw-semibold">{value}{total ? <span className="text-muted"> / {total}</span> : null}</span>
      </div>
      {total != null && <ProgressBar value={value} max={total} tone={tone} />}
    </div>
  )
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
        {icon && <i className={`bi ${icon} text-primary`} />}
        <h3 className="h6 mb-0 fw-semibold">{title}</h3>
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}

/* ─── parse report.metrics safely ──────────────────────────────────────── */
function parseMetrics(metricsStr) {
  try { return typeof metricsStr === 'string' ? JSON.parse(metricsStr) : metricsStr } catch { return null }
}

/* ─── CSV export ───────────────────────────────────────────────────────── */
function exportCsv(report) {
  const m = parseMetrics(report.metrics) || {}
  const rows = [['Section', 'Metric', 'Value']]
  const flatten = (section, obj) => {
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v != null && typeof v === 'object') flatten(`${section}.${k}`, v)
      else rows.push([section, k, v == null ? '' : String(v)])
    })
  }
  flatten('summary',    m.summary)
  flatten('documents',  m.documents)
  flatten('hearings',   m.hearings)
  flatten('sla',        m.sla)
  flatten('appeals',    m.appeals)
  flatten('compliance', m.compliance)
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report-${report.reportId}-${report.scope}-${report.scopeValue}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ═════════════════════════════════════════════════════════════════════════ */

export default function ReportList() {
  const { user } = useAuth()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'CLERK'

  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [err, setErr]           = useState('')
  const [msg, setMsg]           = useState('')
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState(null)

  // Filter bar
  const [filterScope, setFilterScope] = useState('')

  // Generate form
  const [form, setForm] = useState({
    scope: 'COURT',
    scopeValue: 'ALL',
    dateFrom: '',
    dateTo: '',
  })

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const p = await reports.paginated(0, 50)
      setList(p?.content || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // When scope changes, prefill scopeValue with the placeholder default
  useEffect(() => {
    const help = REPORT_SCOPE_HELP[form.scope]
    if (help && (form.scopeValue === '' || form.scopeValue === 'ALL')) {
      setForm(f => ({ ...f, scopeValue: help.placeholder.startsWith('ALL') ? 'ALL' : f.scopeValue }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.scope])

  const generate = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setGenerating(true)
    try {
      const payload = {
        scope:      form.scope,
        scopeValue: form.scopeValue?.trim() || 'ALL',
        dateFrom:   form.dateFrom || null,
        dateTo:     form.dateTo   || null,
      }
      const res = await reports.generate(payload)
      setMsg(`Report #${res.reportId} generated successfully.`)
      setSelected(res)
      load()
    } catch (e) { setErr(e.message) } finally { setGenerating(false) }
  }

  // Filtered list
  const filteredList = useMemo(() => {
    if (!filterScope) return list
    return list.filter(r => r.scope === filterScope)
  }, [list, filterScope])

  // KPI summary across loaded reports
  const kpis = useMemo(() => {
    const byScope = {}
    list.forEach(r => { byScope[r.scope] = (byScope[r.scope] || 0) + 1 })
    return {
      total: list.length,
      byScope,
      latest: list[0]?.generatedDate,
    }
  }, [list])

  // Parsed metrics for the selected report
  const metrics = useMemo(() => selected ? parseMetrics(selected.metrics) : null, [selected])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="page-title h3 mb-0">Reports & Analytics</h1>
          <p className="text-muted small mb-0 mt-1">
            Aggregated metrics across cases, hearings, SLA, appeals & compliance — generated from live data.
          </p>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-triangle me-2" />{err}</div>}
      {msg && <div className="alert alert-success py-2"><i className="bi bi-check-circle me-2" />{msg}</div>}

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      {list.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <StatCard label="Total Reports" value={kpis.total} icon="bi-files" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard
              label="Most Recent"
              value={kpis.latest ? formatDate(kpis.latest) : '—'}
              icon="bi-clock-history"
              tone="info"
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard
              label="Distinct Scopes"
              value={Object.keys(kpis.byScope).length}
              sub={Object.keys(kpis.byScope).join(', ') || '—'}
              icon="bi-diagram-3"
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard
              label="My Role"
              value={user?.role || '—'}
              sub="Allowed scopes filtered by role"
              icon="bi-person-badge"
              tone="success"
            />
          </div>
        </div>
      )}

      {/* ── Generate form ────────────────────────────────────────────────── */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
          <i className="bi bi-bar-chart-line text-primary" />
          <h2 className="h6 mb-0 fw-semibold">Generate New Report</h2>
        </div>
        <div className="card-body">
          <form onSubmit={generate}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Scope <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={form.scope}
                  onChange={e => setForm({ ...form, scope: e.target.value })}
                  disabled={generating}
                >
                  {REPORT_SCOPE.map(s => (
                    <option key={s} value={s}>{s} — {REPORT_SCOPE_HELP[s]?.label || s}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">
                  Scope Value
                </label>
                <input
                  className="form-control"
                  placeholder={REPORT_SCOPE_HELP[form.scope]?.placeholder || 'value'}
                  value={form.scopeValue}
                  onChange={e => setForm({ ...form, scopeValue: e.target.value })}
                  disabled={generating}
                />
                <div className="form-text small">{REPORT_SCOPE_HELP[form.scope]?.hint}</div>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Date From</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.dateFrom}
                  onChange={e => setForm({ ...form, dateFrom: e.target.value })}
                  disabled={generating}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Date To</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.dateTo}
                  onChange={e => setForm({ ...form, dateTo: e.target.value })}
                  disabled={generating}
                />
              </div>
            </div>
            <div className="mt-3 d-flex align-items-center gap-2">
              <button className="btn btn-primary d-flex align-items-center gap-2" disabled={generating}>
                {generating
                  ? <><span className="spinner-border spinner-border-sm" /> Generating…</>
                  : <><i className="bi bi-play-circle-fill" /> Generate Report</>}
              </button>
              <span className="text-muted small">
                <i className="bi bi-info-circle me-1" />
                Pulls live data from case, hearing, SLA, appeal & compliance services.
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* ── Selected report — analytics view ─────────────────────────────── */}
      {selected && metrics && (
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-header border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ background: 'transparent' }}>
            <div>
              <h2 className="h5 mb-0 fw-semibold">
                Report #{selected.reportId} — {selected.scope}
                <span className="text-muted small ms-2">({selected.scopeValue})</span>
              </h2>
              <div className="text-muted small mt-1">
                Generated {formatDate(selected.generatedDate)} by {selected.requestedBy}
                {selected.dateFrom && <> · Range: {formatDate(selected.dateFrom)} → {formatDate(selected.dateTo) || 'today'}</>}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-success btn-sm" onClick={() => exportCsv(selected)}>
                <i className="bi bi-file-earmark-spreadsheet me-1" />Export CSV
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelected(null)}>
                <i className="bi bi-x-lg me-1" />Close
              </button>
            </div>
          </div>
          <div className="card-body">
            {/* Top-line KPIs */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3">
                <StatCard
                  label="Cases Filed"
                  value={metrics.summary?.totalCasesFiled ?? 0}
                  sub={`${metrics.summary?.casesActive ?? 0} active · ${metrics.summary?.casesClosed ?? 0} closed`}
                  icon="bi-folder2-open"
                />
              </div>
              <div className="col-6 col-md-3">
                <StatCard
                  label="Clearance Rate"
                  value={`${metrics.summary?.caseClearanceRate ?? 0}%`}
                  sub="Closed ÷ Total filed"
                  tone="success"
                  icon="bi-check2-circle"
                />
              </div>
              <div className="col-6 col-md-3">
                <StatCard
                  label="SLA Adherence"
                  value={`${metrics.sla?.slaAdherenceRate ?? 0}%`}
                  sub={`${metrics.sla?.slaBreaches ?? 0} breaches`}
                  tone={(metrics.sla?.slaBreaches ?? 0) > 0 ? 'danger' : 'success'}
                  icon="bi-shield-check"
                />
              </div>
              <div className="col-6 col-md-3">
                <StatCard
                  label="Compliance Pass"
                  value={`${metrics.compliance?.compliancePassRate ?? 0}%`}
                  sub={`${metrics.compliance?.complianceFailures ?? 0} failures`}
                  tone={(metrics.compliance?.complianceFailures ?? 0) > 0 ? 'warning' : 'success'}
                  icon="bi-clipboard-check"
                />
              </div>
            </div>

            {/* Sectional breakdown */}
            <div className="row g-3">
              <div className="col-md-6">
                <SectionCard title="Cases" icon="bi-folder2-open">
                  <MetricRow label="Active"    value={metrics.summary?.casesActive ?? 0}    total={metrics.summary?.totalCasesFiled ?? 0} tone="primary" />
                  <MetricRow label="Closed"    value={metrics.summary?.casesClosed ?? 0}    total={metrics.summary?.totalCasesFiled ?? 0} tone="success" />
                  <MetricRow label="Adjourned" value={metrics.summary?.casesAdjourned ?? 0} total={metrics.summary?.totalCasesFiled ?? 0} tone="warning" />
                  <MetricRow label="Appealed"  value={metrics.summary?.casesAppealed ?? 0}  total={metrics.summary?.totalCasesFiled ?? 0} tone="info" />
                </SectionCard>
              </div>
              <div className="col-md-6">
                <SectionCard title="Documents" icon="bi-file-earmark-text">
                  <MetricRow label="Verified" value={metrics.documents?.verifiedDocuments ?? 0} total={metrics.documents?.totalDocuments ?? 0} tone="success" />
                  <MetricRow label="Rejected" value={metrics.documents?.rejectedDocuments ?? 0} total={metrics.documents?.totalDocuments ?? 0} tone="danger" />
                  <MetricRow label="Pending"  value={metrics.documents?.pendingDocuments  ?? 0} total={metrics.documents?.totalDocuments ?? 0} tone="warning" />
                  <div className="text-muted small mt-2">
                    Verification rate: <strong>{metrics.documents?.documentVerificationRate ?? 0}%</strong> ·
                    rejection rate: <strong>{metrics.documents?.documentRejectionRate ?? 0}%</strong>
                  </div>
                </SectionCard>
              </div>
              <div className="col-md-6">
                <SectionCard title="Hearings" icon="bi-calendar-event">
                  <MetricRow label="Completed"   value={metrics.hearings?.hearingsCompleted ?? 0}   total={metrics.hearings?.totalHearings ?? 0} tone="success" />
                  <MetricRow label="Scheduled"   value={metrics.hearings?.hearingsScheduled ?? 0}   total={metrics.hearings?.totalHearings ?? 0} tone="primary" />
                  <MetricRow label="Rescheduled" value={metrics.hearings?.hearingsRescheduled ?? 0} total={metrics.hearings?.totalHearings ?? 0} tone="warning" />
                  <MetricRow label="Cancelled"   value={metrics.hearings?.hearingsCancelled ?? 0}   total={metrics.hearings?.totalHearings ?? 0} tone="danger" />
                  <div className="text-muted small mt-2">
                    Completion rate: <strong>{metrics.hearings?.hearingCompletionRate ?? 0}%</strong>
                  </div>
                </SectionCard>
              </div>
              <div className="col-md-6">
                <SectionCard title="SLA" icon="bi-stopwatch">
                  <MetricRow label="Active"   value={metrics.sla?.slaActive ?? 0}   total={metrics.sla?.totalSlaRecords ?? 0} tone="primary" />
                  <MetricRow label="Warning"  value={metrics.sla?.slaWarnings ?? 0} total={metrics.sla?.totalSlaRecords ?? 0} tone="warning" />
                  <MetricRow label="Breached" value={metrics.sla?.slaBreaches ?? 0} total={metrics.sla?.totalSlaRecords ?? 0} tone="danger" />
                  <MetricRow label="Closed"   value={metrics.sla?.slaClosed ?? 0}   total={metrics.sla?.totalSlaRecords ?? 0} tone="success" />
                </SectionCard>
              </div>
              <div className="col-md-6">
                <SectionCard title="Appeals" icon="bi-arrow-repeat">
                  <MetricRow label="Filed"        value={metrics.appeals?.appealsFiled ?? 0}       total={metrics.appeals?.totalAppeals ?? 0} tone="primary" />
                  <MetricRow label="Under Review" value={metrics.appeals?.appealsUnderReview ?? 0} total={metrics.appeals?.totalAppeals ?? 0} tone="warning" />
                  <MetricRow label="Decided"      value={metrics.appeals?.appealsDecided ?? 0}     total={metrics.appeals?.totalAppeals ?? 0} tone="success" />
                  <div className="text-muted small mt-2">
                    <div>
                      <strong>{metrics.appeals?.appealRate ?? 0}%</strong> of cases have been appealed
                      <span className="text-muted"> ({metrics.appeals?.casesWithAppeals ?? 0} of {metrics.summary?.totalCasesFiled ?? 0})</span>
                    </div>
                    <div>
                      Avg <strong>{metrics.appeals?.appealsPerCase ?? 0}</strong> appeals per case
                      <span className="text-muted"> ({metrics.appeals?.totalAppeals ?? 0} total)</span>
                    </div>
                  </div>
                  {metrics.appeals?.outcomes && (
                    <div className="d-flex gap-2 flex-wrap mt-2">
                      <span className="badge text-bg-success">Upheld {metrics.appeals.outcomes.upheld ?? 0}</span>
                      <span className="badge text-bg-danger">Reversed {metrics.appeals.outcomes.reversed ?? 0}</span>
                      <span className="badge text-bg-info">Modified {metrics.appeals.outcomes.modified ?? 0}</span>
                      <span className="badge text-bg-warning">Sent Back {metrics.appeals.outcomes.sentBack ?? 0}</span>
                      <span className="badge text-bg-secondary">Dismissed {metrics.appeals.outcomes.dismissed ?? 0}</span>
                    </div>
                  )}
                </SectionCard>
              </div>
              <div className="col-md-6">
                <SectionCard title="Compliance" icon="bi-clipboard-check">
                  <MetricRow label="Passes"   value={metrics.compliance?.compliancePasses ?? 0}    total={metrics.compliance?.totalComplianceChecks ?? 0} tone="success" />
                  <MetricRow label="Failures" value={metrics.compliance?.complianceFailures ?? 0}  total={metrics.compliance?.totalComplianceChecks ?? 0} tone="danger" />
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    <span className="badge text-bg-warning">Doc fails {metrics.compliance?.complianceDocumentFailures ?? 0}</span>
                    <span className="badge text-bg-warning">Process fails {metrics.compliance?.complianceProcessFailures ?? 0}</span>
                  </div>
                  <div className="text-muted small mt-2">
                    Pass rate: <strong>{metrics.compliance?.compliancePassRate ?? 0}%</strong>
                  </div>
                </SectionCard>
              </div>
            </div>

            {/* Raw JSON (collapsible for power users) */}
            <details className="mt-4">
              <summary className="text-muted small">View raw JSON</summary>
              <pre className="bg-light p-3 rounded small mt-2" style={{ overflow: 'auto', maxHeight: 400 }}>
                {JSON.stringify(metrics, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* ── List of past reports ─────────────────────────────────────────── */}
      <div className="card shadow-sm border-0">
        <div className="card-header border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ background: 'transparent' }}>
          <h2 className="h6 mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-muted" />Report History
          </h2>
          <div className="d-flex gap-2 align-items-center">
            <label className="form-label small fw-semibold mb-0">Scope:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 160 }}
              value={filterScope}
              onChange={e => setFilterScope(e.target.value)}
            >
              <option value="">All scopes</option>
              {REPORT_SCOPE.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>
              <i className="bi bi-arrow-clockwise me-1" />Refresh
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center text-muted py-5">Loading…</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-bar-chart display-4 d-block mb-3 opacity-25" />
              <p className="mb-0">No reports{filterScope ? ` for scope ${filterScope}` : ''} yet.</p>
              <p className="small">Generate one above to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Scope</th>
                    <th>Value</th>
                    <th>Date Range</th>
                    <th>Generated</th>
                    <th>By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map(r => (
                    <tr key={r.reportId} className={selected?.reportId === r.reportId ? 'table-active' : ''}>
                      <td className="text-muted small">#{r.reportId}</td>
                      <td>
                        <span className="badge rounded-pill text-bg-info">{r.scope}</span>
                      </td>
                      <td className="small">{r.scopeValue}</td>
                      <td className="small text-nowrap">
                        {r.dateFrom
                          ? <>{formatDate(r.dateFrom)} → {formatDate(r.dateTo) || 'today'}</>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="small text-nowrap">{formatDate(r.generatedDate)}</td>
                      <td className="small text-muted">{r.requestedBy}</td>
                      <td className="d-flex gap-1">
                        <button className="btn btn-outline-primary btn-sm" onClick={() => setSelected(r)}>
                          <i className="bi bi-eye me-1" />View
                        </button>
                        <button className="btn btn-outline-success btn-sm" onClick={() => exportCsv(r)} title="Download CSV">
                          <i className="bi bi-file-earmark-spreadsheet" />
                        </button>
                      </td>
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
