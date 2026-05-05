import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { compliance } from '../../api/services'
import { formatDate, formatDateTime } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

/* ───────────────────────────────────────────────────────────────────────
   Compliance History — one row per compliance-check run.
   Server aggregates the runs via GET /api/compliance/runs.
   The UI does NOT show pass/fail. Click a row to see SLA stages and
   document counts per case (live data) on the detail page.            */
export default function ComplianceList() {
  const { user } = useAuth()
  const { t }    = useLanguage()
  const navigate = useNavigate()
  const isAdminOrClerk = user?.role === 'ADMIN' || user?.role === 'CLERK'
  const isAdmin        = user?.role === 'ADMIN'

  const [runs, setRuns]               = useState([])
  const [loading, setLoading]         = useState(false)
  const [err, setErr]                 = useState('')
  const [deletingRunId, setDeletingRunId] = useState(null)
  const [selected, setSelected]       = useState(new Set())   // run-ids checked
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const loadRuns = async () => {
    setLoading(true); setErr('')
    try {
      const data = await compliance.runs()
      setRuns(Array.isArray(data) ? data : [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { loadRuns() }, [])

  const totals = useMemo(() => {
    return { runs: runs.length }
  }, [runs])

  const toggleSelected = (runId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(runId)) next.delete(runId); else next.add(runId)
      return next
    })
  }
  const toggleAllSelected = () => {
    if (selected.size === runs.length) setSelected(new Set())
    else setSelected(new Set(runs.map(r => r.runId)))
  }
  const clearSelection = () => setSelected(new Set())

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(
      `Delete ${selected.size} selected compliance check${selected.size !== 1 ? 's' : ''}?\n\n` +
      `All records produced by the selected runs will be permanently removed.`
    )) return
    setBulkDeleting(true); setErr('')
    try {
      // Collect every complianceId from the selected runs
      const allIds = []
      for (const run of runs) {
        if (!selected.has(run.runId)) continue
        try {
          const recs = await compliance.runRecords(run.runId)
          ;(recs || []).forEach(r => allIds.push(r.complianceId))
        } catch { /* skip a run that fails to load — others continue */ }
      }
      if (allIds.length > 0) {
        await compliance.bulkDeleteRecords(allIds)
      }
      clearSelection()
      await loadRuns()
    } catch (e) {
      setErr(e.message || 'Bulk delete failed')
      await loadRuns()
    } finally {
      setBulkDeleting(false)
    }
  }

  const goToRun = (run) => {
    navigate(`/compliance/runs/${encodeURIComponent(run.runId)}`, { state: { run } })
  }

  const deleteRun = async (run) => {
    if (!window.confirm(
      `Delete this compliance check?\n\n` +
      `It will permanently remove all ${run.checks} record(s) from ${run.cases} case(s).`
    )) return
    setDeletingRunId(run.runId); setErr('')
    try {
      const recs = await compliance.runRecords(run.runId) || []
      for (const r of recs) {
        await compliance.deleteRecord(r.complianceId)
      }
      await loadRuns()
    } catch (e) {
      setErr(e.message || 'Failed to delete run')
      await loadRuns()
    } finally {
      setDeletingRunId(null)
    }
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="page-title h3 mb-0">{t('Compliance History')}</h1>
          <p className="text-muted small mb-0 mt-1">
            Recent compliance checks. Click an entry to see SLA stages and document counts for each case.
          </p>
        </div>
        {isAdminOrClerk && (
          <Link to="/compliance/check" className="btn btn-primary d-flex align-items-center gap-2">
            <i className="bi bi-play-circle-fill" /> {t('Run Compliance Check')}
          </Link>
        )}
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      {runs.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-3">
                <div className="text-muted fw-semibold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Checks
                </div>
                <div className="h4 fw-bold mb-0 mt-1">{totals.runs}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-3">
                <div className="text-muted fw-semibold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Most Recent
                </div>
                <div className="h6 fw-bold mb-0 mt-1">
                  {runs[0]?.runDate
                    ? formatDateTime(runs[0].runDate)
                    : runs[0]?.date ? formatDate(runs[0].date) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body py-2 d-flex gap-2 align-items-center flex-wrap">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadRuns}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
          {isAdmin && selected.size > 0 && (
            <>
              <span className="vr mx-1" />
              <span className="badge text-bg-primary">
                {selected.size} selected
              </span>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearSelection}>
                <i className="bi bi-x-lg me-1" />Clear
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                disabled={bulkDeleting}
                onClick={bulkDelete}
              >
                {bulkDeleting
                  ? <><span className="spinner-border spinner-border-sm" />Deleting…</>
                  : <><i className="bi bi-trash3" />Delete Selected</>}
              </button>
            </>
          )}
          <span className="text-muted small ms-auto">
            {runs.length} entr{runs.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2">{err}</div>}

      {/* ── History table ──────────────────────────────────────────────── */}
      <div className="card shadow-sm border-0">
        <div className="card-header border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{ background: 'transparent' }}>
          <h2 className="h6 mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-muted" />Recent Compliance Checks
          </h2>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center text-muted py-5">{t('Loading...')}</div>
          ) : runs.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-shield display-4 d-block mb-3 opacity-25" />
              <p className="mb-0">No compliance checks yet.</p>
              <p className="small">Run a compliance check to see entries here.</p>
              {isAdminOrClerk && (
                <Link to="/compliance/check" className="btn btn-primary btn-sm mt-2">
                  <i className="bi bi-play-circle me-1" />Run a Compliance Check
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {isAdmin && (
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          title={selected.size === runs.length ? 'Clear all' : 'Select all'}
                          checked={runs.length > 0 && selected.size === runs.length}
                          ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < runs.length }}
                          onChange={toggleAllSelected}
                        />
                      </th>
                    )}
                    <th style={{ width: 80 }}>ID</th>
                    <th>Date &amp; Time</th>
                    <th>Cases Checked</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run, idx) => {
                    // ID = sequential number; oldest run is #1, newest run gets the
                    // highest number. Since `runs` is sorted newest-first, the row
                    // at index 0 has ID = runs.length.
                    const id = runs.length - idx
                    const dateLabel = run.runDate
                      ? formatDateTime(run.runDate)
                      : formatDate(run.date)
                    const isSelected = selected.has(run.runId)
                    return (
                      <tr key={run.runId} className={isSelected ? 'table-active' : ''}>
                        {isAdmin && (
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isSelected}
                              onChange={() => toggleSelected(run.runId)}
                            />
                          </td>
                        )}
                        <td className="fw-semibold text-primary">#{id}</td>
                        <td className="small text-nowrap">
                          <i className="bi bi-calendar3 me-1 text-muted" />
                          {dateLabel}
                        </td>
                        <td>
                          <span className="badge rounded-pill text-bg-light border text-muted">
                            <i className="bi bi-folder me-1" />{run.cases} case{run.cases !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-outline-primary btn-sm" onClick={() => goToRun(run)}>
                              <i className="bi bi-eye me-1" />View Details
                            </button>
                            {isAdmin && (
                              <button
                                className="btn btn-outline-danger btn-sm"
                                title="Delete this compliance check"
                                disabled={deletingRunId === run.runId}
                                onClick={() => deleteRun(run)}
                              >
                                {deletingRunId === run.runId
                                  ? <span className="spinner-border spinner-border-sm" />
                                  : <i className="bi bi-trash3" />}
                              </button>
                            )}
                          </div>
                        </td>
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
