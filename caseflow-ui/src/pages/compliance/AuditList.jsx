import { useEffect, useState } from 'react'
import { compliance } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function AuditList() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [audits, setAudits]   = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState('')
  const [msg, setMsg]         = useState('')

  const [form, setForm]         = useState({ scope: '', findings: '' })
  const [creating, setCreating] = useState(false)

  const [editFindings, setEditFindings] = useState({})
  const [savingId, setSavingId]         = useState(null)
  const [closingId, setClosingId]       = useState(null)
  const [deletingId, setDeletingId]     = useState(null)
  const [selected, setSelected]         = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const toggleSelected = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const toggleAllSelected = () => {
    if (selected.size === audits.length) setSelected(new Set())
    else setSelected(new Set(audits.map(a => a.auditId)))
  }
  const clearSelection = () => setSelected(new Set())

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} selected audit${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkDeleting(true); setErr(''); setMsg('')
    try {
      const ids = Array.from(selected)
      const res = await compliance.bulkDeleteAudits(ids)
      const n = res?.deleted ?? ids.length
      setMsg(`${n} audit${n !== 1 ? 's' : ''} deleted.`)
      clearSelection()
      load()
    } catch (e) {
      setErr(e.message || 'Bulk delete failed')
    } finally {
      setBulkDeleting(false)
    }
  }

  const deleteAudit = async (id) => {
    if (!window.confirm(`Delete audit #${id}? This cannot be undone.`)) return
    setDeletingId(id); setErr(''); setMsg('')
    try {
      await compliance.deleteAudit(id)
      setMsg(`Audit #${id} deleted.`)
      setAudits(prev => prev.filter(a => a.auditId !== id))
    } catch (e) { setErr(e.message) } finally { setDeletingId(null) }
  }

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const p = await compliance.auditsPaginated(0, 50)
      setAudits(p?.content || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setCreating(true)
    try {
      await compliance.createAudit({ scope: form.scope, findings: form.findings || undefined })
      setMsg('Audit created successfully.')
      setForm({ scope: '', findings: '' })
      load()
    } catch (e) { setErr(e.message) } finally { setCreating(false) }
  }

  const saveFindings = async (id) => {
    const text = editFindings[id]
    if (!text?.trim()) { setErr('Findings cannot be blank.'); return }
    setSavingId(id); setErr(''); setMsg('')
    try {
      await compliance.updateFindings(id, text.trim())
      setMsg('Findings updated.')
      setEditFindings(prev => { const n = { ...prev }; delete n[id]; return n })
      load()
    } catch (e) { setErr(e.message) } finally { setSavingId(null) }
  }

  const close = async (id, scope) => {
    if (!window.confirm(`Close audit #${id} (${scope})?\n\nMake sure you have added findings before closing.`)) return
    setClosingId(id); setErr(''); setMsg('')
    try {
      await compliance.closeAudit(id)
      setMsg(`Audit #${id} closed successfully.`)
      load()
    } catch (e) { setErr(e.message) } finally { setClosingId(null) }
  }

  const openCount   = audits.filter(a => a.status === 'OPEN').length
  const closedCount = audits.filter(a => a.status === 'CLOSED').length

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title h3 mb-0">Audits</h1>
          <p className="text-muted small mb-0 mt-1">Document and track compliance reviews</p>
        </div>
      </div>

      {err && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-triangle me-2" />{err}</div>}
      {msg && <div className="alert alert-success py-2"><i className="bi bi-check-circle me-2" />{msg}</div>}

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      {audits.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-4">
            <div className="card border-0 shadow-sm text-center py-3">
              <div className="h4 fw-bold mb-0">{audits.length}</div>
              <div className="text-muted small mt-1">
                <i className="bi bi-clipboard-data me-1" />Total
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card border-0 shadow-sm text-center py-3" style={{ borderTop: '3px solid #0dcaf0' }}>
              <div className="h4 fw-bold mb-0 text-info">{openCount}</div>
              <div className="text-muted small mt-1">
                <i className="bi bi-unlock me-1 text-info" />In Progress
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card border-0 shadow-sm text-center py-3" style={{ borderTop: '3px solid #198754' }}>
              <div className="h4 fw-bold mb-0 text-success">{closedCount}</div>
              <div className="text-muted small mt-1">
                <i className="bi bi-lock-fill me-1 text-success" />Completed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Audit ─────────────────────────────────────────────────────── */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
          <span
            className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white flex-shrink-0"
            style={{ width: 28, height: 28 }}
          >
            <i className="bi bi-plus" style={{ fontSize: '1rem' }} />
          </span>
          <h2 className="h6 mb-0 fw-semibold">Open New Audit</h2>
        </div>
        <div className="card-body">
          <p className="text-muted small mb-3">
            Create an audit record to document your review. You are automatically recorded as the audit administrator.
            After creating, add your findings and then close the audit when complete.
          </p>
          <form onSubmit={create}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  Scope <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="e.g. Case #12 document review, Q1 SLA audit…"
                  value={form.scope}
                  onChange={e => setForm({ ...form, scope: e.target.value })}
                  required
                  disabled={creating}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">
                  Initial Findings{' '}
                  <span className="text-muted fw-normal">(optional — can be added later)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Preliminary observations…"
                  value={form.findings}
                  onChange={e => setForm({ ...form, findings: e.target.value })}
                  disabled={creating}
                />
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-primary d-flex align-items-center gap-2" disabled={creating}>
                {creating
                  ? <><span className="spinner-border spinner-border-sm" /> Creating…</>
                  : <><i className="bi bi-clipboard-plus" /> Open Audit</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Audit Timeline List ───────────────────────────────────────────────── */}
      <div className="card shadow-sm border-0">
        <div
          className="card-header border-bottom d-flex align-items-center justify-content-between"
          style={{ background: 'transparent' }}
        >
          <h2 className="h6 mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-clipboard-data text-muted" />All Audits
          </h2>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {isAdmin && audits.length > 0 && (
              <>
                <div className="form-check m-0">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="audit-select-all"
                    checked={selected.size === audits.length && audits.length > 0}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < audits.length }}
                    onChange={toggleAllSelected}
                  />
                  <label htmlFor="audit-select-all" className="form-check-label small text-muted">
                    Select all
                  </label>
                </div>
                {selected.size > 0 && (
                  <>
                    <span className="badge text-bg-primary">{selected.size} selected</span>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={clearSelection}
                    >
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
                <span className="vr" />
              </>
            )}
            {audits.length > 0 && (
              <>
                <span className="badge text-bg-info">{openCount} Open</span>
                <span className="badge text-bg-success">{closedCount} Closed</span>
              </>
            )}
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center text-muted py-5">Loading…</div>
          ) : audits.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-clipboard display-4 d-block mb-3 opacity-25" />
              <p className="text-muted mb-1">No audits yet.</p>
              <p className="text-muted small">Open one using the form above.</p>
            </div>
          ) : (
            <div>
              {audits.map((a, idx) => {
                const isEditing = a.auditId in editFindings
                const isClosed  = a.status === 'CLOSED'
                const isLast    = idx === audits.length - 1

                const isSelected = selected.has(a.auditId)
                return (
                  <div
                    key={a.auditId}
                    className={`px-4 py-3 ${!isLast ? 'border-bottom' : ''}`}
                    style={isSelected ? { background: '#eff6ff' } : {}}
                  >
                    <div className="d-flex align-items-start gap-3">
                      {/* Selection checkbox (admin only) */}
                      {isAdmin && (
                        <div className="pt-2 flex-shrink-0">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isSelected}
                            onChange={() => toggleSelected(a.auditId)}
                          />
                        </div>
                      )}
                      {/* Timeline dot */}
                      <div className="d-flex flex-column align-items-center pt-1 flex-shrink-0">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center ${isClosed ? 'bg-success' : 'bg-info'}`}
                          style={{ width: 34, height: 34 }}
                        >
                          <i
                            className={`bi ${isClosed ? 'bi-lock-fill' : 'bi-unlock'} text-white`}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                        {!isLast && (
                          <div style={{ width: 2, height: 24, background: '#dee2e6', marginTop: 4 }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span className="fw-bold">#{a.auditId}</span>
                          <span className={`badge rounded-pill ${statusBadgeClass(a.status)}`}>
                            {a.status}
                          </span>
                          <span className="text-muted small">
                            by {a.adminId} &middot; {formatDate(a.date)}
                          </span>
                        </div>

                        <div className="fw-semibold text-dark mb-2">{a.scope}</div>

                        {/* Findings — inline edit when OPEN */}
                        {isEditing && !isClosed ? (
                          <div className="d-flex gap-2 align-items-start mb-2">
                            <textarea
                              className="form-control form-control-sm"
                              rows={2}
                              value={editFindings[a.auditId]}
                              onChange={e =>
                                setEditFindings(prev => ({ ...prev, [a.auditId]: e.target.value }))
                              }
                            />
                            <div className="d-flex flex-column gap-1">
                              <button
                                className="btn btn-success btn-sm"
                                disabled={savingId === a.auditId}
                                onClick={() => saveFindings(a.auditId)}
                              >
                                {savingId === a.auditId
                                  ? <span className="spinner-border spinner-border-sm" />
                                  : <i className="bi bi-check-lg" />}
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() =>
                                  setEditFindings(prev => {
                                    const n = { ...prev }; delete n[a.auditId]; return n
                                  })
                                }
                              >
                                <i className="bi bi-x-lg" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="small text-muted rounded-2 p-2 mb-2"
                            style={{ background: '#f8f9fa', maxWidth: 580 }}
                          >
                            {a.findings
                              ? a.findings
                              : <em>No findings added yet.</em>}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="d-flex gap-2 flex-wrap mt-1">
                          {!isClosed && !isEditing && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() =>
                                setEditFindings(prev => ({ ...prev, [a.auditId]: a.findings || '' }))
                              }
                            >
                              <i className="bi bi-pencil me-1" />Edit Findings
                            </button>
                          )}
                          {!isClosed && (
                            <button
                              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                              disabled={closingId === a.auditId}
                              onClick={() => close(a.auditId, a.scope)}
                            >
                              {closingId === a.auditId
                                ? <span className="spinner-border spinner-border-sm" />
                                : <i className="bi bi-lock" />}
                              Close Audit
                            </button>
                          )}
                          {isClosed && (
                            <span className="text-success small d-flex align-items-center gap-1">
                              <i className="bi bi-check-circle-fill" /> Audit closed and locked
                            </span>
                          )}
                          {isAdmin && (
                            <button
                              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                              title="Delete this audit (admin only)"
                              disabled={deletingId === a.auditId}
                              onClick={() => deleteAudit(a.auditId)}
                            >
                              {deletingId === a.auditId
                                ? <span className="spinner-border spinner-border-sm" />
                                : <i className="bi bi-trash3" />}
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
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
