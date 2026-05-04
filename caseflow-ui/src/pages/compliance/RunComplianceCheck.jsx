import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { compliance } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

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
    const caseIds = raw
      ? raw.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n) && n > 0)
      : []

    setCheckedIds(caseIds)

    try {
      const data = await compliance.runCheck({ caseIds })
      setResults(data || [])

      // Pre-fill audit scope with a sensible default
      const scopeLabel = caseIds.length
        ? `Cases: ${caseIds.join(', ')}`
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
                <span className="text-muted fw-normal">(comma-separated — leave blank to check ALL cases)</span>
              </label>
              <input
                className="form-control"
                placeholder="e.g.  1, 3, 7   — or leave blank for all"
                value={caseIdsInput}
                onChange={e => setCaseIdsInput(e.target.value)}
                disabled={running}
              />
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
                  onClick={() => { setResults(null); setCaseIdsInput(''); setCheckedIds([]); setAuditMsg(''); setAuditErr('') }}
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

      {/* ── Step 2 — Results ─────────────────────────────────────────────── */}
      {results !== null && (
        <>
          {/* Summary strip */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-center">
                <div className="col-6 col-md-3 text-center">
                  <div className="h3 fw-bold mb-0">{stats.cases}</div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-folder2 me-1" />Case{stats.cases !== 1 ? 's' : ''} Checked
                  </div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="h3 fw-bold mb-0">{stats.total}</div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-clipboard-check me-1" />Total Checks
                  </div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="h3 fw-bold mb-0 text-success">{stats.pass}</div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-check-circle me-1 text-success" />Passed
                  </div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="h3 fw-bold mb-0 text-secondary">{stats.fail}</div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-exclamation-circle me-1" />Need Review
                  </div>
                </div>
                {stats.total > 0 && (
                  <div className="col-12">
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>Pass rate</span>
                      <span>{stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0}%</span>
                    </div>
                    <div className="progress" style={{ height: 8, borderRadius: 8 }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${stats.total > 0 ? (stats.pass / stats.total) * 100 : 0}%` }}
                      />
                      <div
                        className="progress-bar"
                        style={{
                          width: `${stats.total > 0 ? (stats.fail / stats.total) * 100 : 0}%`,
                          background: '#dee2e6',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overall verdict banner */}
          {stats.total > 0 && stats.fail === 0 && (
            <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
              <i className="bi bi-check-circle-fill fs-5" />
              <div>
                <strong>All checks passed.</strong> Every case is fully compliant — all documents verified and no SLA breaches.
              </div>
            </div>
          )}
          {stats.fail > 0 && (
            <div className="alert alert-warning d-flex align-items-start gap-2 mb-4">
              <i className="bi bi-exclamation-circle-fill fs-5 mt-1" />
              <div>
                <strong>{stats.fail} check{stats.fail !== 1 ? 's' : ''} need review</strong> across {failedCaseIds.length} case{failedCaseIds.length !== 1 ? 's' : ''}.
                {stats.docFail > 0 && <span className="ms-1">Document issues: <strong>{stats.docFail}</strong>.</span>}
                {stats.procFail > 0 && <span className="ms-1">SLA/Process issues: <strong>{stats.procFail}</strong>.</span>}
                <span className="ms-1 d-block d-sm-inline">The court administrator has been notified.</span>
              </div>
            </div>
          )}
          {results.length === 0 && (
            <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
              <i className="bi bi-exclamation-circle-fill" />
              No cases were found to check. Make sure cases exist in the system.
            </div>
          )}

          {/* Detailed results table */}
          {results.length > 0 && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
                <span className="badge rounded-circle text-bg-primary" style={{ width: 24, height: 24, lineHeight: '24px', textAlign: 'center', padding: 0 }}>2</span>
                <span className="fw-semibold">Detailed Results</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Case</th>
                        <th>Check Type</th>
                        <th>Result</th>
                        <th>Notes</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.complianceId ?? i}>
                          <td>
                            <Link to={`/cases/${r.caseId}`} className="fw-semibold">
                              #{r.caseId}
                            </Link>
                          </td>
                          <td>
                            <span className={`badge rounded-pill ${r.type === 'DOCUMENT' ? 'text-bg-info' : 'text-bg-secondary'}`}>
                              <i className={`bi me-1 ${r.type === 'DOCUMENT' ? 'bi-file-earmark-check' : 'bi-diagram-3'}`} />
                              {r.type}
                            </span>
                          </td>
                          <td>
                            <span className={`badge rounded-pill ${statusBadgeClass(r.result)}`}>
                              <i className={`bi me-1 ${r.result === 'PASS' ? 'bi-check-circle' : 'bi-x-circle'}`} />
                              {r.result}
                            </span>
                          </td>
                          <td className="small text-muted" style={{ maxWidth: 320 }}>{r.notes}</td>
                          <td className="small text-nowrap">{formatDate(r.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Open an Audit to document findings */}
          {results.length > 0 && (
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
                          placeholder={
                            stats.fail > 0
                              ? `${stats.fail} compliance failure(s) detected. Cases: ${failedCaseIds.join(', ')}. See compliance records for details.`
                              : 'All checks passed. No issues found.'
                          }
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
        </>
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
