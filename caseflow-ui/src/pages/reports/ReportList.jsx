import { Component, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { reports, users } from '../../api/services'
import { REPORT_SCOPE, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

/* ─── Local error boundary so a render exception doesn't blank the page ─── */
class SafeBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ReportView] render error:', error, info?.componentStack)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="alert alert-danger my-3">
          <div className="fw-semibold">
            <i className="bi bi-exclamation-octagon me-2" />
            We hit an error rendering this report.
          </div>
          <div className="small mt-1">
            <code>{String(this.state.error?.message || this.state.error)}</code>
          </div>
          <div className="small text-muted mt-1">
            Open the browser console for the full stack trace, or try generating a fresh report.
          </div>
          <button
            className="btn btn-outline-secondary btn-sm mt-2"
            onClick={() => this.setState({ error: null })}
          >
            <i className="bi bi-arrow-clockwise me-1" />Reset
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Scopes shown in the dropdowns. CASE and COMPLIANCE are removed from
// generation/filter UI but kept in SCOPE_CONFIG so old reports still render.
const VISIBLE_SCOPES = REPORT_SCOPE.filter(s => s !== 'CASE' && s !== 'COMPLIANCE')

/* ─── Scope configuration ───────────────────────────────────────────────── */
const SCOPE_CONFIG = {
  COURT: {
    color: '#0d6efd', bg: '#eff6ff', border: '#bfdbfe',
    icon: 'bi-building', label: 'System-wide Court Report',
    description: 'Aggregates all cases, hearings, SLA, appeals and compliance across the entire court system.',
    valueLabel: 'Scope Value', fixedValue: 'ALL',
    valueHint: 'Leave as "ALL" — this scope covers the entire court.',
    showDate: true,
    // which metric sections to render (order matters)
    sections: ['summary', 'hearings', 'sla', 'documents', 'appeals', 'compliance'],
    sectionTitles: {},
  },
  JUDGE: {
    color: '#6f42c1', bg: '#f5f0ff', border: '#d8b4fe',
    icon: 'bi-person-badge', label: 'Judge Performance Report',
    description: 'Tracks hearings assigned to this judge and appeals routed to them — how many were completed, how many are still in progress.',
    valueLabel: 'Select Judge', roleDropdown: 'JUDGE',
    valueHint: 'Select the judge from the dropdown — scope value will be their User ID.',
    showDate: true,
    sections: ['hearings', 'appeals', 'summary'],
    sectionTitles: {
      hearings: 'Hearings Assigned to Judge',
      appeals:  'Appeals Assigned to Judge',
      summary:  'Cases Assigned',
    },
  },
  PERIOD: {
    color: '#0891b2', bg: '#f0fdff', border: '#a5f3fc',
    icon: 'bi-calendar-range', label: 'Period / Date Range Report',
    description: 'Aggregates metrics within a specific time window. Set Date From and Date To below.',
    valueLabel: 'Period Label', valuePlaceholder: 'e.g. Q1 2026',
    valueHint: 'Enter a descriptive label (e.g. "Q1 2026"). Set the actual range using the date fields below.',
    showDate: true, dateRequired: true,
    sections: ['summary', 'hearings', 'sla', 'documents', 'appeals', 'compliance'],
    sectionTitles: {},
  },
  CLERK: {
    color: '#198754', bg: '#f0fdf4', border: '#bbf7d0',
    icon: 'bi-person-gear', label: 'Clerk Activity Report',
    description: 'Tracks documents verified, hearings scheduled, SLA stage management, and compliance checks run by a specific clerk. Clerks do not file cases or decide appeals.',
    valueLabel: 'Select Clerk', roleDropdown: 'CLERK',
    valueHint: 'Select the clerk from the dropdown — scope value will be their User ID.',
    showDate: true,
    sections: ['hearings', 'appeals', 'documents', 'sla', 'compliance'],
    sectionTitles: {
      hearings:   'Hearings Scheduled by Clerk',
      appeals:    'Appeals Routed by Clerk (Judge Assigned)',
      documents:  'Documents Verified by Clerk',
      sla:        'SLA Stages (system-wide)',
      compliance: 'Compliance Checks (system-wide)',
    },
    perClerkNote: 'Hearings, Appeals and Documents are filtered to this clerk\'s actions — hearings they scheduled, appeals they routed (assigned a judge to), and documents they verified or rejected. SLA stages and compliance checks are not attributed per-clerk in the database, so those sections show system-wide totals.',
  },
  LAWYER: {
    color: '#fd7e14', bg: '#fff7ed', border: '#fed7aa',
    icon: 'bi-briefcase', label: 'Lawyer Case Report',
    description: 'Tracks cases this lawyer represents and appeals they have filed on behalf of clients. Lawyers do not preside over hearings or verify documents.',
    valueLabel: 'Select Lawyer', roleDropdown: 'LAWYER',
    valueHint: 'Select the lawyer from the dropdown — scope value will be their User ID.',
    showDate: true,
    sections: ['summary', 'appeals'],
    sectionTitles: { summary: 'Cases Represented', appeals: 'Appeals Filed & Outcomes' },
  },
  CASE: {
    color: '#e11d48', bg: '#fff1f2', border: '#fecdd3',
    icon: 'bi-folder2-open', label: 'Single Case Drill-down',
    description: 'Complete drill-down for one specific case — all hearings, documents, SLA, and compliance.',
    valueLabel: 'Case ID', valuePlaceholder: 'e.g. 42',
    valueHint: 'Enter the numeric Case ID. Find it in the Cases list.',
    showDate: false,
    sections: ['summary', 'documents', 'hearings', 'sla', 'appeals', 'compliance'],
    sectionTitles: {},
  },
  COMPLIANCE: {
    color: '#6610f2', bg: '#faf5ff', border: '#e9d5ff',
    icon: 'bi-shield-check', label: 'Compliance & Audit Report',
    description: 'Focused on compliance pass/fail rates, document failures, process issues, and audit trail.',
    valueLabel: 'Scope Value', fixedValue: 'ALL',
    valueHint: 'Use "ALL" for system-wide compliance metrics.',
    showDate: true,
    sections: ['compliance', 'documents', 'summary'],
    sectionTitles: { compliance: 'Compliance Overview' },
  },
}

/* ─── SVG donut chart ───────────────────────────────────────────────────── */
function DonutChart({ value, max = 100, size = 72, strokeWidth = 10, tone = 'primary' }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const offset = circ - (pct / 100) * circ
  const colors = { success: '#198754', danger: '#dc3545', warning: '#f59e0b', info: '#0dcaf0', primary: '#0d6efd', purple: '#6f42c1' }
  const c = colors[tone] || '#0d6efd'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9ecef" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.22} fontWeight="700" fill={c}>{Math.round(pct)}%</text>
    </svg>
  )
}

/* ─── Segmented distribution bar ────────────────────────────────────────── */
function DistBar({ segments }) {
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0)
  if (!total) return <div className="text-muted small">No data</div>
  return (
    <div>
      <div className="progress mb-1" style={{ height: 8, borderRadius: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} className="progress-bar"
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
            title={`${seg.label}: ${seg.value}`} />
        ))}
      </div>
      <div className="d-flex flex-wrap gap-2">
        {segments.map((seg, i) => (
          <span key={i} className="small d-flex align-items-center gap-1">
            <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, display: 'inline-block', flexShrink: 0 }} />
            <span className="text-muted">{seg.label}:</span>
            <span className="fw-semibold">{seg.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── KPI card with optional donut ──────────────────────────────────────── */
function KpiCard({ label, mainValue, pct, max = 100, sub, tone = 'primary', icon }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3 py-3">
        {pct !== undefined
          ? <DonutChart value={pct} max={max} size={70} strokeWidth={9} tone={tone} />
          : icon && <i className={`bi ${icon} text-muted opacity-25`} style={{ fontSize: '2.5rem' }} />
        }
        <div className="min-w-0">
          <div className="text-muted fw-semibold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </div>
          <div className="h4 fw-bold mb-0 mt-1">{mainValue}</div>
          {sub && <div className="text-muted small mt-1">{sub}</div>}
        </div>
      </div>
    </div>
  )
}

/* ─── Section card ───────────────────────────────────────────────────────── */
function SectionCard({ title, icon, accentColor, children }) {
  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
        {icon && <i className={`bi ${icon}`} style={{ color: accentColor || '#0d6efd' }} />}
        <h3 className="h6 mb-0 fw-semibold">{title}</h3>
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}

/* ─── MetricRow ──────────────────────────────────────────────────────────── */
function MetricRow({ label, value, total, tone = 'primary' }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0
  const bg = tone === 'success' ? 'bg-success' : tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : tone === 'info' ? 'bg-info' : 'bg-primary'
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small">
        <span className="text-muted">{label}</span>
        <span className="fw-semibold">
          {value}{total != null ? <span className="text-muted"> / {total}</span> : null}
        </span>
      </div>
      {total != null && (
        <div className="progress" style={{ height: 5 }}>
          <div className={`progress-bar ${bg}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

/* ─── Parse metrics safely ───────────────────────────────────────────────── */
function parseMetrics(s) {
  try { return typeof s === 'string' ? JSON.parse(s) : s } catch { return null }
}

/* ─── Any non-zero value in obj ──────────────────────────────────────────── */
function hasData(obj) {
  if (!obj) return false
  return Object.values(obj).some(v => {
    if (typeof v === 'object' && v !== null) return hasData(v)
    return typeof v === 'number' ? v > 0 : false
  })
}

/* ─── Role-specific KPI definitions ─────────────────────────────────────── */
function getRoleKpis(scope, metrics) {
  // Defensive: callers may pass null / partially-populated metrics. Coerce to a
  // safe shape so any property access below is null-safe.
  const m = metrics || {}
  const clearanceRate   = m.summary?.caseClearanceRate     ?? 0
  const slaAdherence    = m.sla?.slaAdherenceRate          ?? 0
  const compliancePass  = m.compliance?.compliancePassRate ?? 0
  const hearingComplete = m.hearings?.hearingCompletionRate ?? 0
  const verifyRate      = m.documents?.documentVerificationRate ?? 0

  if (scope === 'JUDGE') {
    const aTotal     = m.appeals?.totalAppeals       ?? 0
    const aInProcess = m.appeals?.appealsUnderReview ?? 0
    const aDone      = m.appeals?.appealsDecided     ?? 0
    const reviewRate = aTotal > 0 ? Math.round((aDone * 100) / aTotal) : 0
    return [
      { label: 'Cases Assigned',     mainValue: m.summary?.totalCasesFiled ?? 0,    sub: `${m.summary?.casesActive ?? 0} active · ${m.summary?.casesClosed ?? 0} closed`, icon: 'bi-folder2-open' },
      { label: 'Hearings Completed', mainValue: m.hearings?.hearingsCompleted ?? 0, sub: `of ${m.hearings?.totalHearings ?? 0} hearings · ${m.hearings?.hearingsRescheduled ?? 0} delayed`, icon: 'bi-calendar-check' },
      { label: 'Appeals Assigned',   mainValue: aTotal,                              sub: `${aInProcess} in process · ${aDone} done`, icon: 'bi-arrow-repeat' },
      { label: 'Reviews Completed',  mainValue: aDone,                               pct: reviewRate, tone: 'success', sub: `${reviewRate}% of assigned` },
    ]
  }

  if (scope === 'CLERK') {
    const aTotal = m.appeals?.totalAppeals       ?? 0
    const aWait  = m.appeals?.appealsUnderReview ?? 0
    const aDone  = m.appeals?.appealsDecided     ?? 0
    const docTotal    = m.documents?.totalDocuments     ?? 0
    const docVerified = m.documents?.verifiedDocuments  ?? 0
    const docRejected = m.documents?.rejectedDocuments  ?? 0
    return [
      { label: 'Hearings Scheduled',   mainValue: m.hearings?.totalHearings ?? 0, sub: `${m.hearings?.hearingsCompleted ?? 0} completed · ${m.hearings?.hearingsRescheduled ?? 0} delayed`, icon: 'bi-calendar-plus' },
      { label: 'Appeals Routed',       mainValue: aTotal,                         sub: `${aWait} awaiting decision · ${aDone} done`, icon: 'bi-arrow-repeat' },
      { label: 'Docs Acted On',        mainValue: docTotal,                        sub: `${docVerified} verified · ${docRejected} rejected`, icon: 'bi-file-earmark-check' },
      { label: 'SLA Adherence (sys)',  mainValue: `${slaAdherence}%`,             pct: slaAdherence, tone: (m.sla?.slaBreaches ?? 0) > 0 ? 'danger' : 'success', sub: `${m.sla?.slaBreaches ?? 0} breach${(m.sla?.slaBreaches ?? 0) !== 1 ? 'es' : ''}` },
    ]
  }

  if (scope === 'LAWYER') {
    const aTotal = m.appeals?.totalAppeals       ?? 0
    const aWait  = m.appeals?.appealsUnderReview ?? 0
    const aDone  = m.appeals?.appealsDecided     ?? 0
    return [
      { label: 'Cases Represented',  mainValue: m.summary?.totalCasesFiled ?? 0,    sub: `${m.summary?.casesActive ?? 0} still active`,           icon: 'bi-briefcase' },
      { label: 'Active Cases',       mainValue: m.summary?.casesActive ?? 0,        sub: `${m.summary?.casesClosed ?? 0} closed`,                 icon: 'bi-folder' },
      { label: 'Appeals Filed',      mainValue: aTotal,                              sub: `${aWait} under review · ${aDone} decided`,             icon: 'bi-arrow-repeat' },
      { label: 'Cases Closed',       mainValue: m.summary?.casesClosed ?? 0,        sub: `${m.summary?.casesAdjourned ?? 0} adjourned`,           icon: 'bi-check2-circle', tone: 'success' },
    ]
  }

  // COURT, PERIOD, CASE, COMPLIANCE — show all-round KPIs
  return [
    hasData(m.summary)    && { label: 'Cases Filed',     mainValue: m.summary?.totalCasesFiled ?? 0,   pct: clearanceRate,  max: 100, tone: clearanceRate >= 70 ? 'success' : 'warning', sub: `${m.summary?.casesActive ?? 0} active · ${m.summary?.casesClosed ?? 0} closed` },
    hasData(m.summary)    && { label: 'Clearance Rate',  mainValue: `${clearanceRate}%`,               pct: clearanceRate,  max: 100, tone: clearanceRate >= 70 ? 'success' : 'warning', sub: 'Closed ÷ Total filed' },
    hasData(m.sla)        && { label: 'SLA Adherence',   mainValue: `${slaAdherence}%`,               pct: slaAdherence,   max: 100, tone: (m.sla?.slaBreaches ?? 0) > 0 ? 'danger' : 'success', sub: `${m.sla?.slaBreaches ?? 0} breaches` },
    hasData(m.compliance) && { label: 'Compliance Pass', mainValue: `${compliancePass}%`,             pct: compliancePass, max: 100, tone: (m.compliance?.complianceFailures ?? 0) > 0 ? 'warning' : 'success', sub: `${m.compliance?.complianceFailures ?? 0} failures` },
  ].filter(Boolean)
}

/* ─── CSV export ─────────────────────────────────────────────────────────── */
function exportCsv(report) {
  const m = parseMetrics(report.metrics) || {}
  const rows = [['Section', 'Metric', 'Value']]
  const flatten = (section, obj) => {
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v != null && typeof v === 'object') flatten(`${section}.${k}`, v)
      else rows.push([section, k, v == null ? '' : String(v)])
    })
  }
  flatten('summary', m.summary); flatten('documents', m.documents)
  flatten('hearings', m.hearings); flatten('sla', m.sla)
  flatten('appeals', m.appeals); flatten('compliance', m.compliance)
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `report-${report.reportId}-${report.scope}-${report.scopeValue}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ═════════════════════════════════════════════════════════════════════════ */

export default function ReportList() {
  const { user } = useAuth()

  const [list, setList]                       = useState([])
  const [loading, setLoading]                 = useState(true)
  const [err, setErr]                         = useState('')
  const [msg, setMsg]                         = useState('')
  const [generating, setGenerating]           = useState(false)
  const [selected, setSelected]               = useState(null)
  const [filterScope, setFilterScope]         = useState('')
  const [deletingReportId, setDeletingReportId] = useState(null)

  const deleteReport = async (id) => {
    if (!window.confirm(`Delete report #${id}? This cannot be undone.`)) return
    setDeletingReportId(id); setErr(''); setMsg('')
    try {
      await reports.del(id)
      setMsg(`Report #${id} deleted.`)
      setList(prev => prev.filter(r => r.reportId !== id))
      if (selected?.reportId === id) setSelected(null)
    } catch (e) { setErr(e.message) } finally { setDeletingReportId(null) }
  }

  // role-user dropdown state
  const [roleUsers, setRoleUsers]       = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [form, setForm] = useState({ scope: 'COURT', scopeValue: 'ALL', dateFrom: '', dateTo: '' })

  const cfg = SCOPE_CONFIG[form.scope]

  /* ── load reports ────────────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true); setErr('')
    try {
      const p = await reports.paginated(0, 50)
      setList(p?.content || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  /* ── when scope changes: reset scopeValue & fetch role users ─────────── */
  useEffect(() => {
    const c = SCOPE_CONFIG[form.scope]
    setForm(f => ({ ...f, scopeValue: c?.fixedValue || '' }))
    setRoleUsers([])

    if (c?.roleDropdown) {
      setLoadingUsers(true)
      users.byRole(c.roleDropdown)
        .then(data => setRoleUsers(Array.isArray(data) ? data : []))
        .catch(() => setRoleUsers([]))
        .finally(() => setLoadingUsers(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.scope])

  /* ── generate ────────────────────────────────────────────────────────── */
  const generate = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setGenerating(true)
    try {
      const res = await reports.generate({
        scope:      form.scope,
        scopeValue: form.scopeValue?.trim() || 'ALL',
        dateFrom:   form.dateFrom || null,
        dateTo:     form.dateTo   || null,
      })
      setMsg(`Report #${res.reportId} generated successfully.`)
      setSelected(res)
      load()
    } catch (e) { setErr(e.message) } finally { setGenerating(false) }
  }

  const filteredList = useMemo(() => {
    if (!filterScope) return list
    return list.filter(r => r.scope === filterScope)
  }, [list, filterScope])

  const kpis = useMemo(() => {
    const byScope = {}
    list.forEach(r => { byScope[r.scope] = (byScope[r.scope] || 0) + 1 })
    return { total: list.length, byScope, latest: list[0]?.generatedDate }
  }, [list])

  const metrics = useMemo(() => selected ? parseMetrics(selected.metrics) : null, [selected])

  const scopeBadgeStyle = scope => {
    const c = SCOPE_CONFIG[scope]
    return c ? { background: c.bg, color: c.color, border: `1px solid ${c.border}` } : {}
  }

  /* ── helper: render one metric section ──────────────────────────────── */
  const renderSection = (key, m, reportCfg) => {
    const title = reportCfg?.sectionTitles?.[key] || {
      summary: 'Cases', hearings: 'Hearings', documents: 'Documents',
      sla: 'SLA', appeals: 'Appeals', compliance: 'Compliance',
    }[key] || key

    const accentColor = reportCfg?.color

    // Sections that are explicitly listed in this scope's config should render
    // even when the data is empty — so the user can see the report ran for the
    // selected role and the absence of activity is meaningful (not a bug).
    const inScope = Array.isArray(reportCfg?.sections) && reportCfg.sections.includes(key)

    if (key === 'summary' && (inScope || hasData(m.summary))) return (
      <div className="col-md-6" key="summary">
        <SectionCard title={title} icon="bi-folder2-open" accentColor={accentColor}>
          <DistBar segments={[
            { label: 'Active',    value: m.summary?.casesActive    ?? 0, color: '#0d6efd' },
            { label: 'Closed',    value: m.summary?.casesClosed    ?? 0, color: '#198754' },
            { label: 'Adjourned', value: m.summary?.casesAdjourned ?? 0, color: '#f59e0b' },
            { label: 'Appealed',  value: m.summary?.casesAppealed  ?? 0, color: '#0dcaf0' },
          ]} />
          <div className="mt-3">
            <MetricRow label="Active"    value={m.summary?.casesActive    ?? 0} total={m.summary?.totalCasesFiled ?? 0} tone="primary" />
            <MetricRow label="Closed"    value={m.summary?.casesClosed    ?? 0} total={m.summary?.totalCasesFiled ?? 0} tone="success" />
            <MetricRow label="Adjourned" value={m.summary?.casesAdjourned ?? 0} total={m.summary?.totalCasesFiled ?? 0} tone="warning" />
            <MetricRow label="Appealed"  value={m.summary?.casesAppealed  ?? 0} total={m.summary?.totalCasesFiled ?? 0} tone="info" />
          </div>
        </SectionCard>
      </div>
    )

    if (key === 'hearings' && (inScope || hasData(m.hearings))) {
      const hearingComplete = m.hearings?.hearingCompletionRate ?? 0
      const reportScope = reportCfg && Object.keys(SCOPE_CONFIG).find(k => SCOPE_CONFIG[k] === reportCfg)
      // Scope-specific labels for the distribution segments
      const segLabels =
        reportScope === 'JUDGE'
          ? { completed: 'Completed by Judge', scheduled: 'Scheduled to Judge', rescheduled: 'Delayed', cancelled: 'Cancelled' }
        : reportScope === 'CLERK'
          ? { completed: 'Completed', scheduled: 'Currently Scheduled', rescheduled: 'Rescheduled', cancelled: 'Cancelled' }
        : { completed: 'Completed', scheduled: 'Scheduled', rescheduled: 'Rescheduled', cancelled: 'Cancelled' }
      return (
        <div className="col-md-6" key="hearings">
          <SectionCard title={title} icon="bi-calendar-event" accentColor={accentColor}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <DonutChart value={hearingComplete} max={100} size={60} strokeWidth={8}
                tone={hearingComplete >= 70 ? 'success' : 'warning'} />
              <div>
                <div className="fw-semibold">{hearingComplete}% completion rate</div>
                <div className="text-muted small">
                  {m.hearings?.totalHearings ?? 0} total
                  {reportScope === 'JUDGE' ? ' assigned to judge' : reportScope === 'CLERK' ? ' scheduled by clerk' : ' hearings'}
                </div>
              </div>
            </div>
            <DistBar segments={[
              { label: segLabels.completed,   value: m.hearings?.hearingsCompleted   ?? 0, color: '#198754' },
              { label: segLabels.scheduled,   value: m.hearings?.hearingsScheduled   ?? 0, color: '#0d6efd' },
              { label: segLabels.rescheduled, value: m.hearings?.hearingsRescheduled ?? 0, color: '#f59e0b' },
              { label: segLabels.cancelled,   value: m.hearings?.hearingsCancelled   ?? 0, color: '#dee2e6' },
            ]} />
          </SectionCard>
        </div>
      )
    }

    if (key === 'documents' && (inScope || hasData(m.documents))) return (
      <div className="col-md-6" key="documents">
        <SectionCard title={title} icon="bi-file-earmark-text" accentColor={accentColor}>
          <DistBar segments={[
            { label: 'Verified', value: m.documents?.verifiedDocuments ?? 0, color: '#198754' },
            { label: 'Pending',  value: m.documents?.pendingDocuments  ?? 0, color: '#f59e0b' },
            { label: 'Rejected', value: m.documents?.rejectedDocuments ?? 0, color: '#dc3545' },
          ]} />
          <div className="mt-3">
            <MetricRow label="Verified" value={m.documents?.verifiedDocuments ?? 0} total={m.documents?.totalDocuments ?? 0} tone="success" />
            <MetricRow label="Pending"  value={m.documents?.pendingDocuments  ?? 0} total={m.documents?.totalDocuments ?? 0} tone="warning" />
            <MetricRow label="Rejected" value={m.documents?.rejectedDocuments ?? 0} total={m.documents?.totalDocuments ?? 0} tone="danger" />
          </div>
          <div className="text-muted small mt-2">
            Verification rate: <strong>{m.documents?.documentVerificationRate ?? 0}%</strong>
            {' · '}Rejection rate: <strong>{m.documents?.documentRejectionRate ?? 0}%</strong>
          </div>
        </SectionCard>
      </div>
    )

    if (key === 'sla' && (inScope || hasData(m.sla))) {
      const slaAdherence = m.sla?.slaAdherenceRate ?? 0
      return (
        <div className="col-md-6" key="sla">
          <SectionCard title={title} icon="bi-stopwatch" accentColor={accentColor}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <DonutChart value={slaAdherence} max={100} size={60} strokeWidth={8}
                tone={(m.sla?.slaBreaches ?? 0) > 0 ? 'danger' : 'success'} />
              <div>
                <div className="fw-semibold">{slaAdherence}% adherence</div>
                <div className="text-muted small">{m.sla?.slaBreaches ?? 0} breach{(m.sla?.slaBreaches ?? 0) !== 1 ? 'es' : ''}</div>
              </div>
            </div>
            <DistBar segments={[
              { label: 'Active',   value: m.sla?.slaActive   ?? 0, color: '#0d6efd' },
              { label: 'Warning',  value: m.sla?.slaWarnings ?? 0, color: '#f59e0b' },
              { label: 'Breached', value: m.sla?.slaBreaches ?? 0, color: '#dc3545' },
              { label: 'Closed',   value: m.sla?.slaClosed   ?? 0, color: '#198754' },
            ]} />
          </SectionCard>
        </div>
      )
    }

    if (key === 'appeals') {
      const a = m.appeals || {}
      // "Cases Appealed" should mean *total appeals filed* in the scope, not
      // just appeals currently sitting in the SUBMITTED status. Use totalAppeals
      // (which JUDGE/CLERK overrides also set to the routed-review count) so
      // every scope shows a meaningful, non-zero number.
      const filed     = a.totalAppeals       ?? a.appealsFiled ?? 0
      const assigned  = a.appealsUnderReview ?? 0
      const completed = a.appealsDecided     ?? 0
      // Scope-specific labels for the 3-stat strip
      const reportScope = reportCfg && Object.keys(SCOPE_CONFIG).find(k => SCOPE_CONFIG[k] === reportCfg)
      const labels =
        reportScope === 'JUDGE'
          ? { a: 'Appeals Assigned to Judge', b: 'In Process',         c: 'Reviews Completed' }
        : reportScope === 'CLERK'
          ? { a: 'Appeals I Routed',       b: 'Awaiting Decision',  c: 'Review Completed' }
        : { a: 'Cases Appealed',         b: 'Assigned to Judge',  c: 'Review Completed' }
      return (
        <div className="col-md-6" key="appeals">
          <SectionCard title={title} icon="bi-arrow-repeat" accentColor={accentColor}>
            {/* Always shown 3-stat strip */}
            <div className="row text-center g-2 mb-3">
              <div className="col-4">
                <div className="p-2 rounded-3" style={{ background: '#eff6ff' }}>
                  <div className="h4 fw-bold mb-0 text-primary">{filed}</div>
                  <div className="text-muted small mt-1">{labels.a}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3" style={{ background: '#fff7ed' }}>
                  <div className="h4 fw-bold mb-0 text-warning">{assigned}</div>
                  <div className="text-muted small mt-1">{labels.b}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3" style={{ background: '#f0fdf4' }}>
                  <div className="h4 fw-bold mb-0 text-success">{completed}</div>
                  <div className="text-muted small mt-1">{labels.c}</div>
                </div>
              </div>
            </div>

            {/* Distribution bar (only when there is data) */}
            {(filed + assigned + completed) > 0 && (
              <DistBar segments={[
                { label: 'Filed',           value: filed,     color: '#0d6efd' },
                { label: 'Assigned',        value: assigned,  color: '#f59e0b' },
                { label: 'Review Complete', value: completed, color: '#198754' },
              ]} />
            )}

            <div className="mt-3 text-muted small">
              <div>
                <strong>{a.appealRate ?? 0}%</strong> of cases appealed
                <span className="ms-1">({a.casesWithAppeals ?? 0} of {m.summary?.totalCasesFiled ?? 0})</span>
              </div>
              {(a.appealsPerCase ?? 0) > 0 && (
                <div className="mt-1">Avg <strong>{a.appealsPerCase}</strong> appeals per case</div>
              )}
            </div>

            {a.outcomes && hasData(a.outcomes) && (
              <div className="d-flex gap-1 flex-wrap mt-2">
                {a.outcomes.upheld    > 0 && <span className="badge text-bg-success">Upheld {a.outcomes.upheld}</span>}
                {a.outcomes.reversed  > 0 && <span className="badge text-bg-danger">Reversed {a.outcomes.reversed}</span>}
                {a.outcomes.modified  > 0 && <span className="badge text-bg-info">Modified {a.outcomes.modified}</span>}
                {a.outcomes.sentBack  > 0 && <span className="badge text-bg-warning">Sent Back {a.outcomes.sentBack}</span>}
                {a.outcomes.dismissed > 0 && <span className="badge text-bg-secondary">Dismissed {a.outcomes.dismissed}</span>}
              </div>
            )}
          </SectionCard>
        </div>
      )
    }

    if (key === 'compliance' && (inScope || hasData(m.compliance))) {
      // No PASS/FAIL display. Show compliance activity stats: total checks performed,
      // breakdown of where issues showed up (documents vs SLA process), and a deep
      // link to the full Compliance History page for the per-run drill-down.
      const total      = m.compliance?.totalComplianceChecks   ?? 0
      const docIssues  = m.compliance?.complianceDocumentFailures ?? 0
      const procIssues = m.compliance?.complianceProcessFailures ?? 0
      const issues     = docIssues + procIssues
      const clean      = Math.max(0, total - issues)
      return (
        <div className="col-md-6" key="compliance">
          <SectionCard title="Compliance Activity" icon="bi-clipboard-check" accentColor={accentColor}>
            <div className="row text-center g-2 mb-3">
              <div className="col-4">
                <div className="p-2 rounded-3 border">
                  <div className="h4 mb-0 fw-bold">{total}</div>
                  <div className="text-muted small">Checks Run</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3" style={{ background: '#f0fdf4' }}>
                  <div className="h4 mb-0 fw-bold text-success">{clean}</div>
                  <div className="text-muted small">In Good Standing</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3" style={{ background: issues > 0 ? '#fff7ed' : '#f8f9fa' }}>
                  <div className={`h4 mb-0 fw-bold ${issues > 0 ? 'text-warning' : 'text-muted'}`}>{issues}</div>
                  <div className="text-muted small">Items Flagged</div>
                </div>
              </div>
            </div>

            {issues > 0 && (
              <div>
                <div className="text-muted small mb-2">Where issues were flagged</div>
                <DistBar segments={[
                  { label: 'Document issues',  value: docIssues,  color: '#f59e0b' },
                  { label: 'SLA / process',    value: procIssues, color: '#0d6efd' },
                ]} />
              </div>
            )}

            <div className="mt-3 small">
              <Link to="/compliance" className="text-decoration-none">
                <i className="bi bi-clock-history me-1" />Open full Compliance History &rarr;
              </Link>
            </div>
          </SectionCard>
        </div>
      )
    }

    return null
  }

  /* ══════════════════════ RENDER ══════════════════════════════════════════ */
  return (
    <div>
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="page-title h3 mb-0">Reports &amp; Analytics</h1>
          <p className="text-muted small mb-0 mt-1">
            Role-specific metrics from live case, hearing, SLA, appeal &amp; compliance data.
          </p>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-triangle me-2" />{err}</div>}
      {msg && <div className="alert alert-success py-2"><i className="bi bi-check-circle me-2" />{msg}</div>}

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      {list.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <KpiCard label="Total Reports" mainValue={kpis.total} icon="bi-files" />
          </div>
          <div className="col-6 col-md-3">
            <KpiCard label="Most Recent" mainValue={kpis.latest ? formatDate(kpis.latest) : '—'} icon="bi-clock-history" tone="info" />
          </div>
          <div className="col-6 col-md-3">
            <KpiCard label="Distinct Scopes" mainValue={Object.keys(kpis.byScope).length}
              sub={Object.keys(kpis.byScope).join(', ') || '—'} icon="bi-diagram-3" />
          </div>
          <div className="col-6 col-md-3">
            <KpiCard label="My Role" mainValue={user?.role || '—'} sub="Your permission level" tone="success" icon="bi-person-badge" />
          </div>
        </div>
      )}

      {/* ── Generate form ───────────────────────────────────────────────── */}
      <div className="card shadow-sm mb-4 border-0">
        <div
          className="card-header border-bottom d-flex align-items-center gap-2"
          style={{ background: cfg?.bg || 'transparent', transition: 'background 0.3s' }}
        >
          <i className={`bi ${cfg?.icon || 'bi-bar-chart-line'}`}
            style={{ color: cfg?.color || '#0d6efd', fontSize: '1.1rem' }} />
          <h2 className="h6 mb-0 fw-semibold">Generate New Report</h2>
          {cfg && (
            <span className="badge ms-auto" style={{ background: cfg.color, color: '#fff' }}>
              {cfg.label}
            </span>
          )}
        </div>
        <div className="card-body">
          {/* Scope guidance panel */}
          {cfg && (
            <div className="rounded-3 p-3 mb-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="d-flex align-items-start gap-2">
                <i className={`bi ${cfg.icon} mt-1`} style={{ color: cfg.color, fontSize: '1.1rem', flexShrink: 0 }} />
                <div>
                  <div className="fw-semibold mb-1" style={{ color: cfg.color }}>{cfg.label}</div>
                  <p className="small text-muted mb-2">{cfg.description}</p>
                  <div className="small rounded-2 p-2" style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${cfg.border}` }}>
                    <i className="bi bi-lightbulb me-1" style={{ color: cfg.color }} />
                    <strong style={{ color: cfg.color }}>{cfg.valueLabel}:</strong>
                    <span className="text-muted ms-1">{cfg.valueHint}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={generate}>
            <div className="row g-3">
              {/* Scope selector */}
              <div className="col-md-3">
                <label className="form-label fw-semibold small">
                  Scope <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.scope}
                  onChange={e => setForm({ ...form, scope: e.target.value })}
                  disabled={generating}
                  style={{ borderColor: cfg?.border }}
                >
                  {VISIBLE_SCOPES.map(s => {
                    const c = SCOPE_CONFIG[s]
                    return <option key={s} value={s}>{s} — {c?.label || s}</option>
                  })}
                </select>
              </div>

              {/* Scope value — dropdown for JUDGE/CLERK/LAWYER, fixed for COURT/COMPLIANCE, text for others */}
              <div className="col-md-3">
                <label className="form-label fw-semibold small">{cfg?.valueLabel || 'Scope Value'}</label>

                {cfg?.fixedValue ? (
                  <input className="form-control" value={cfg.fixedValue} readOnly disabled
                    style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }} />

                ) : cfg?.roleDropdown ? (
                  <select
                    className="form-select"
                    value={form.scopeValue}
                    onChange={e => setForm({ ...form, scopeValue: e.target.value })}
                    disabled={generating || loadingUsers}
                    required
                    style={{ borderColor: cfg?.border }}
                  >
                    <option value="">
                      {loadingUsers ? 'Loading…' : `— Select a ${cfg.roleDropdown.toLowerCase()} —`}
                    </option>
                    {roleUsers.map(u => (
                      <option key={u.userId} value={String(u.userId)}>
                        #{u.userId} — {u.username || u.email || u.name || ''}
                      </option>
                    ))}
                  </select>

                ) : (
                  <input
                    className="form-control"
                    placeholder={cfg?.valuePlaceholder || 'value'}
                    value={form.scopeValue}
                    onChange={e => setForm({ ...form, scopeValue: e.target.value })}
                    disabled={generating}
                    required
                    style={{ borderColor: cfg?.border }}
                  />
                )}
              </div>

              {/* Date range */}
              {cfg?.showDate !== false && (
                <>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">
                      Date From{cfg?.dateRequired && <span className="text-danger ms-1">*</span>}
                    </label>
                    <input className="form-control" type="date" value={form.dateFrom}
                      onChange={e => setForm({ ...form, dateFrom: e.target.value })}
                      disabled={generating} required={cfg?.dateRequired} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">
                      Date To{cfg?.dateRequired && <span className="text-danger ms-1">*</span>}
                    </label>
                    <input className="form-control" type="date" value={form.dateTo}
                      onChange={e => setForm({ ...form, dateTo: e.target.value })}
                      disabled={generating} required={cfg?.dateRequired} />
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn d-flex align-items-center gap-2"
                style={{ background: cfg?.color || '#0d6efd', color: '#fff', borderColor: cfg?.color || '#0d6efd' }}
                disabled={generating || (cfg?.roleDropdown && !form.scopeValue)}
              >
                {generating
                  ? <><span className="spinner-border spinner-border-sm" /> Generating…</>
                  : <><i className="bi bi-play-circle-fill" /> Generate Report</>}
              </button>
              <span className="text-muted small">
                <i className="bi bi-info-circle me-1" />
                Pulls live data from case, hearing, SLA, appeal &amp; compliance services.
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* ── Selected report analytics ────────────────────────────────────── */}
      {selected && metrics && (
        <SafeBoundary>
          {(() => {
        const reportCfg  = SCOPE_CONFIG[selected.scope]
        const m          = metrics || {}
        const kpiCards   = getRoleKpis(selected.scope, m) || []
        const sections   = reportCfg?.sections || ['summary', 'hearings', 'sla', 'documents', 'appeals', 'compliance']

        return (
          <div className="card shadow-sm mb-4 border-0">
            <div
              className="card-header border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
              style={{ background: reportCfg?.bg || 'transparent' }}
            >
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  {reportCfg && <i className={`bi ${reportCfg.icon}`} style={{ color: reportCfg.color, fontSize: '1.1rem' }} />}
                  <h2 className="h5 mb-0 fw-semibold">
                    Report #{selected.reportId}
                    <span className="badge rounded-pill ms-2"
                      style={reportCfg ? { background: reportCfg.color, color: '#fff' } : {}}>
                      {selected.scope}
                    </span>
                    <span className="text-muted fw-normal small ms-2">({selected.scopeValue})</span>
                  </h2>
                </div>
                <div className="text-muted small">
                  Generated {formatDate(selected.generatedDate)} by {selected.requestedBy}
                  {selected.dateFrom && <> &middot; {formatDate(selected.dateFrom)} → {formatDate(selected.dateTo) || 'today'}</>}
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
              {/* Per-clerk attribution note (only shown for CLERK reports) */}
              {reportCfg?.perClerkNote && (
                <div className="alert alert-info py-2 small mb-3 d-flex align-items-start gap-2">
                  <i className="bi bi-info-circle-fill mt-1" style={{ flexShrink: 0 }} />
                  <div>{reportCfg.perClerkNote}</div>
                </div>
              )}

              {/* Role-specific KPI strip */}
              <div className="row g-3 mb-4">
                {kpiCards.map((kpi, i) => (
                  <div className="col-6 col-md-3" key={i}>
                    <KpiCard {...kpi} />
                  </div>
                ))}
              </div>

              {/* Role-specific sections */}
              <div className="row g-3">
                {sections.map(key => renderSection(key, m, reportCfg))}
              </div>

              {/* Raw JSON */}
              <details className="mt-4">
                <summary className="text-muted small" style={{ cursor: 'pointer' }}>View raw JSON metrics</summary>
                <pre className="bg-light p-3 rounded small mt-2" style={{ overflow: 'auto', maxHeight: 400 }}>
                  {JSON.stringify(metrics, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )
      })()}
        </SafeBoundary>
      )}

      {/* ── Report history ───────────────────────────────────────────────── */}
      <div className="card shadow-sm border-0">
        <div
          className="card-header border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{ background: 'transparent' }}
        >
          <h2 className="h6 mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-muted" />Report History
          </h2>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <label className="form-label small fw-semibold mb-0">Scope:</label>
            <select className="form-select form-select-sm" style={{ width: 160 }}
              value={filterScope} onChange={e => setFilterScope(e.target.value)}>
              <option value="">All scopes</option>
              {VISIBLE_SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
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
                    <th>ID</th><th>Scope</th><th>Value</th>
                    <th>Date Range</th><th>Generated</th><th>By</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map(r => (
                    <tr key={r.reportId} className={selected?.reportId === r.reportId ? 'table-active' : ''}>
                      <td className="text-muted small">#{r.reportId}</td>
                      <td>
                        <span className="badge rounded-pill small" style={scopeBadgeStyle(r.scope)}>
                          {SCOPE_CONFIG[r.scope]?.icon && <i className={`bi ${SCOPE_CONFIG[r.scope].icon} me-1`} />}
                          {r.scope}
                        </span>
                      </td>
                      <td className="small">{r.scopeValue}</td>
                      <td className="small text-nowrap">
                        {r.dateFrom
                          ? <>{formatDate(r.dateFrom)} → {formatDate(r.dateTo) || 'today'}</>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="small text-nowrap">{formatDate(r.generatedDate)}</td>
                      <td className="small text-muted">{r.requestedBy}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-primary btn-sm" onClick={() => setSelected(r)}>
                            <i className="bi bi-eye me-1" />View
                          </button>
                          <button className="btn btn-outline-success btn-sm" onClick={() => exportCsv(r)} title="Download CSV">
                            <i className="bi bi-file-earmark-spreadsheet" />
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title="Delete this report"
                              disabled={deletingReportId === r.reportId}
                              onClick={() => deleteReport(r.reportId)}
                            >
                              {deletingReportId === r.reportId
                                ? <span className="spinner-border spinner-border-sm" />
                                : <i className="bi bi-trash3" />}
                            </button>
                          )}
                        </div>
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
