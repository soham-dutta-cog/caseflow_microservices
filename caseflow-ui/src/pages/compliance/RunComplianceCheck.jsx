import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { compliance, cases } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { CaseSlaSummary, useCaseEnrichment } from './ComplianceRunDetail'

/* ─── Renders one CaseSlaSummary card per case checked in this run ───── */
function RunCasesView({ caseIds }) {
  const { data, loading } = useCaseEnrichment(caseIds)
  if (loading) {
    return (
      <div className="text-center text-muted py-3">
        <span className="spinner-border spinner-border-sm me-2" />
        Loading SLA stages and documents…
      </div>
    )
  }
  return (
    <div className="d-flex flex-column gap-3">
      {caseIds.map(caseId => {
        const e = data[caseId] || { stages: [], slaRecords: [], docs: [], caseInfo: null }
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
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Run Compliance Check — Module 4.6
   Accessible to: ADMIN, CLERK
   Steps: 1. Enter case IDs (or leave blank for all)  2. Run  3. View results
          4. Optionally open an Audit record to document findings
───────────────────────────────────────────────────────────────────────────── */
export default function RunComplianceCheck() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // ── Form ──────────────────────────────────────────────────────────────────
  const [caseIdsInput, setCaseIdsInput] = useState('')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [running, setRunning]           = useState(false)
  const [checkErr, setCheckErr]         = useState('')

  // ── Results ───────────────────────────────────────────────────────────────
  const [results, setResults]   = useState(null)   // null = not run yet
  const [checkedIds, setCheckedIds] = useState([]) // case IDs that were checked

  // ── Create Audit from results ─────────────────────────────────────────────
  const [auditScope, setAuditScope]       = useState('')
  const [auditFindings, setAuditFindings] = useState('')
  const [creatingAudit, setCreatingAudit] = useState(false)
  const [auditMsg, setAuditMsg]           = useState('')
  const [auditErr, setAuditErr]           = useState('')

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = results
    ? {
        total:    results.length,
        pass:     results.filter(r => r.result === 'PASS').length,
        fail:     results.filter(r => r.result === 'FAIL').length,
        docFail:  results.filter(r => r.result === 'FAIL' && r.type === 'DOCUMENT').length,
        procFail: results.filter(r => r.result === 'FAIL' && r.type === 'PROCESS').length,
        cases:    [...new Set(results.map(r => r.caseId))].length,
      }
    : null

  const failedCaseIds = results
    ? [...new Set(results.filter(r => r.result === 'FAIL').map(r => r.caseId))]
    : []

  // ── Run check ─────────────────────────────────────────────────────────────
  const handleRun = async (e) => {
    e.preventDefault()
    setRunning(true)
    setCheckErr('')
    setResults(null)
    setAuditMsg('')
    setAuditErr('')

    const raw = caseIdsInput.trim()
    let caseIds = raw
      ? raw.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n) && n > 0)
      : []

    // Validate date range if both provided
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      setCheckErr('Date From must be on or before Date To.')
      setRunning(false)
      return
    }

    let dateFilterApplied = false
    let dateFilteredCount = 0

    try {
      // If user typed Case IDs they take priority. Otherwise, if a date range
      // is provided, fetch all cases and filter to those filed within the range.
      if (caseIds.length === 0 && (dateFrom || dateTo)) {
        const all = await cases.list() || []
        const fromMs = dateFrom ? new Date(dateFrom).getTime() : -Infinity
        // Date To is inclusive of the whole day
        const toMs   = dateTo   ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity
        const filtered = all.filter(c => {
          if (!c.filedDate) return false
          const t = new Date(c.filedDate).getTime()
          return t >= fromMs && t <= toMs
        })
        caseIds = filtered.map(c => c.caseId).filter(Boolean)
        dateFilterApplied = true
        dateFilteredCount = caseIds.length

        if (caseIds.length === 0) {
          setCheckErr('No cases were filed in the selected date range. Try widening the range or clearing the dates.')
          setRunning(false)
          return
        }
      }

      setCheckedIds(caseIds)

      const data = await compliance.runCheck({ caseIds })
      setResults(data || [])

      // Pre-fill audit scope with a sensible default
      const scopeLabel = raw
        ? `Cases: ${caseIds.join(', ')}`
        : dateFilterApplied
          ? `Cases filed ${dateFrom || '...'} → ${dateTo || '...'} (${dateFilteredCount} case${dateFilteredCount !== 1 ? 's' : ''})`
          : `All cases — ${new Date().toLocaleDateString()}`
      setAuditScope(scopeLabel)
    } catch (e) {
      setCheckErr(
        e.message ||
        'Compliance check failed. Make sure case-service and workflow-service are running.'
      )
    } finally {
      setRunning(false)
    }
  }

  // ── Create Audit ──────────────────────────────────────────────────────────
  const handleCreateAudit = async (e) => {
    e.preventDefault()
    if (!auditScope.trim()) { setAuditErr('Scope is required.'); return }
    setCreatingAudit(true)
    setAuditErr('')
    setAuditMsg('')
    try {
      await compliance.createAudit({
        scope: auditScope.trim(),
        findings: auditFindings.trim() || undefined,
      })
      setAuditMsg('Audit opened successfully. Go to Audits to add findings and close it.')
    } catch (e) {
      setAuditErr(e.message)
    } finally {
      setCreatingAudit(false)
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div>
          <h1 className="page-title h3 mb-0">Run Compliance Check</h1>
          <p className="text-muted small mb-0 mt-1">
            Module 4.6 — Check document verification and SLA compliance per case.
            Failures automatically notify the administrator.
          </p>
        </div>
      </div>

      {/* ── Step 1 — Configure & Run ─────────────────────────────────────── */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
          <span className="badge rounded-circle text-bg-primary" style={{ width: 24, height: 24, lineHeight: '24px', textAlign: 'center', padding: 0 }}>1</span>
          <span className="fw-semibold">Select Cases</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleRun}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">
                Case IDs&nbsp;
                <span className="text-muted fw-normal">(comma-separated — leave blank to check ALL cases or use the date range below)</span>
              </label>
              <input
                className="form-control"
                placeholder="e.g.  1, 3, 7   — or leave blank to use the date range / check all"
                value={caseIdsInput}
                onChange={e => setCaseIdsInput(e.target.value)}
                disabled={running}
              />
            </div>

            {/* Date range — only used when Case IDs is blank */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  Date From <span className="text-muted fw-normal">(filed on/after)</span>
                </label>
                <input
                  className="form-control"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  disabled={running || caseIdsInput.trim().length > 0}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  Date To <span className="text-muted fw-normal">(filed on/before)</span>
                </label>
                <input
                  className="form-control"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  disabled={running || caseIdsInput.trim().length > 0}
                />
              </div>
              {caseIdsInput.trim().length === 0 && (dateFrom || dateTo) && (
                <div className="col-12">
                  <div className="alert alert-info py-2 mb-0 small d-flex align-items-center gap-2">
                    <i className="bi bi-funnel-fill" />
                    Compliance check will run for cases filed
                    {dateFrom && <> on/after <strong>{dateFrom}</strong></>}
                    {dateFrom && dateTo && ' '}
                    {dateTo && <> on/before <strong>{dateTo}</strong></>}.
                  </div>
                </div>
              )}
              {caseIdsInput.trim().length > 0 && (dateFrom || dateTo) && (
                <div className="col-12">
                  <div className="alert alert-warning py-2 mb-0 small d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-circle" />
                    Date range is ignored because specific Case IDs were entered above.
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <button
                className="btn btn-primary d-flex align-items-center gap-2 px-4"
                type="submit"
                disabled={running}
              >
                {running ? (
                  <><span className="spinner-border spinner-border-sm" /> Running check…</>
                ) : (
                  <><i className="bi bi-play-circle-fill" /> Run Compliance Check</>
                )}
              </button>
              {results !== null && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setResults(null); setCaseIdsInput(''); setCheckedIds([])
                    setDateFrom(''); setDateTo('')
                    setAuditMsg(''); setAuditErr('')
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1" />Clear
                </button>
              )}
            </div>

            {checkErr && (
              <div className="alert alert-danger mt-3 mb-0 py-2 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill" />
                {checkErr}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ── Step 2 — Results: per-case SLA + doc summary (no PASS/FAIL) ── */}
      {results !== null && results.length === 0 && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-circle-fill" />
          No cases were found to check. Make sure cases exist in the system.
        </div>
      )}

      {results !== null && results.length > 0 && (() => {
        const runId = results.find(r => r.runId)?.runId
        const caseIds = Array.from(new Set(results.map(r => r.caseId))).sort((a, b) => a - b)
        return (
          <div className="mb-4">
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
                style={{ background: 'transparent' }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge rounded-circle text-bg-primary" style={{ width: 24, height: 24, lineHeight: '24px', textAlign: 'center', padding: 0 }}>2</span>
                  <span className="fw-semibold">Detailed Results</span>
                  <span className="text-muted small ms-2">{stats.cases} case{stats.cases !== 1 ? 's' : ''} checked</span>
                </div>
                {runId && (
                  <Link
                    to={`/compliance/runs/${encodeURIComponent(runId)}`}
                    state={{ run: { runId, recs: results } }}
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="bi bi-box-arrow-up-right me-1" />Open in Compliance History
                  </Link>
                )}
              </div>
              <div className="card-body">
                <RunCasesView caseIds={caseIds} />
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Step 3 — Open an Audit to document findings ─────────────────── */}
      {results !== null && results.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
            <span className="badge rounded-circle text-bg-secondary" style={{ width: 24, height: 24, lineHeight: '24px', textAlign: 'center', padding: 0 }}>3</span>
            <span className="fw-semibold">Open an Audit Record</span>
            <span className="text-muted small ms-1">(optional — document and track this compliance review)</span>
          </div>
          <div className="card-body">
            {auditMsg && (
              <div className="alert alert-success py-2 d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill" />{auditMsg}
                <Link to="/audits" className="ms-auto btn btn-sm btn-outline-success">Go to Audits</Link>
              </div>
            )}
            {auditErr && (
              <div className="alert alert-danger py-2">{auditErr}</div>
            )}
            {!auditMsg && (
              <form onSubmit={handleCreateAudit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Audit Scope <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      value={auditScope}
                      onChange={e => setAuditScope(e.target.value)}
                      required
                      disabled={creatingAudit}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">
                      Initial Findings&nbsp;
                      <span className="text-muted fw-normal">(optional — you can add/update them later)</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder={`Compliance check covered ${stats.cases} case(s). See run detail for SLA stages and document counts per case.`}
                      value={auditFindings}
                      onChange={e => setAuditFindings(e.target.value)}
                      disabled={creatingAudit}
                    />
                  </div>
                </div>
                <div className="mt-3 d-flex gap-2">
                  <button
                    className="btn btn-dark d-flex align-items-center gap-2"
                    type="submit"
                    disabled={creatingAudit}
                  >
                    {creatingAudit
                      ? <><span className="spinner-border spinner-border-sm" />Opening audit…</>
                      : <><i className="bi bi-clipboard-plus" />Open Audit Record</>}
                  </button>
                  <Link to="/audits" className="btn btn-outline-secondary">
                    <i className="bi bi-clipboard-data me-1" />View All Audits
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state (before first run) ───────────────────────────────── */}
      {results === null && !running && !checkErr && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-shield-check display-4 d-block mb-3 opacity-25" />
          <p className="mb-1 fw-semibold">No compliance check has been run yet.</p>
          <p className="small">Enter case IDs above (or leave blank for all cases) and click <strong>Run Compliance Check</strong>.</p>
          <Link to="/compliance" className="btn btn-outline-secondary btn-sm mt-2">
            <i className="bi bi-clock-history me-1" />View Compliance History
          </Link>
        </div>
      )}
    </div>
  )
}
