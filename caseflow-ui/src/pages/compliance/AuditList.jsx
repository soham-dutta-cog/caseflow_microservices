import { useEffect, useState } from 'react'
import { compliance } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function AuditList() {
  const { user } = useAuth()

  const [audits, setAudits]   = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState('')
  const [msg, setMsg]         = useState('')

  // Create form state
  const [form, setForm]         = useState({ scope: '', findings: '' })
  const [creating, setCreating] = useState(false)

  // Inline findings edit state  { [auditId]: string }
  const [editFindings, setEditFindings] = useState({})
  const [savingId, setSavingId]         = useState(null)
  const [closingId, setClosingId]       = useState(null)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const p = await compliance.auditsPaginated(0, 50)
      setAudits(p?.content || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // ── Create ────────────────────────────────────────────────────────────────
  const create = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setCreating(true)
    try {
      // adminId is resolved from the JWT on the backend — no need to send it
      await compliance.createAudit({ scope: form.scope, findings: form.findings || undefined })
      setMsg('Audit created successfully.')
      setForm({ scope: '', findings: '' })
      load()
    } catch (e) { setErr(e.message) } finally { setCreating(false) }
  }

  // ── Update findings inline ────────────────────────────────────────────────
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

  // ── Close audit ───────────────────────────────────────────────────────────
  const close = async (id, scope) => {
    if (!window.confirm(`Close audit #${id} (${scope})?\n\nMake sure you have added findings before closing.`)) return
    setClosingId(id); setErr(''); setMsg('')
    try {
      // adminId is resolved from the JWT header on the backend — nothing extra needed
      await compliance.closeAudit(id)
      setMsg(`Audit #${id} closed successfully.`)
      load()
    } catch (e) { setErr(e.message) } finally { setClosingId(null) }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Audits</h1>
      </div>

      {err && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-triangle me-2" />{err}</div>}
      {msg && <div className="alert alert-success py-2"><i className="bi bi-check-circle me-2" />{msg}</div>}

      {/* ── Create Audit ─────────────────────────────────────────────────── */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header border-bottom" style={{ background: 'transparent' }}>
          <h2 className="h6 mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-plus-circle text-primary" />
            Open New Audit
          </h2>
        </div>
        <div className="card-body">
          <p className="text-muted small mb-3">
            Create an audit record to document your review. You are automatically recorded as the audit administrator.
            After creating, add your findings and then close the audit when complete.
          </p>
          <form onSubmit={create}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Scope <span className="text-danger">*</span></label>
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
                <label className="form-label fw-semibold small">Initial Findings <span className="text-muted fw-normal">(optional — can be added later)</span></label>
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

      {/* ── Audit List ───────────────────────────────────────────────────── */}
      <div className="card shadow-sm border-0">
        <div className="card-header border-bottom" style={{ background: 'transparent' }}>
          <h2 className="h6 mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-clipboard-data text-muted" />
            All Audits
          </h2>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center text-muted py-4">Loading…</div>
          ) : audits.length === 0 ? (
            <div className="text-center text-muted py-4">No audits yet. Open one above.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Administrator</th>
                    <th>Scope</th>
                    <th>Findings</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ minWidth: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map(a => {
                    const isEditing = a.auditId in editFindings
                    const isClosed  = a.status === 'CLOSED'

                    return (
                      <tr key={a.auditId}>
                        <td className="text-muted small">#{a.auditId}</td>
                        <td className="small">{a.adminId}</td>
                        <td className="small">{a.scope}</td>

                        {/* Findings — inline edit when OPEN */}
                        <td style={{ maxWidth: 260 }}>
                          {isEditing && !isClosed ? (
                            <div className="d-flex gap-1 align-items-start">
                              <textarea
                                className="form-control form-control-sm"
                                rows={2}
                                value={editFindings[a.auditId]}
                                onChange={e => setEditFindings(prev => ({ ...prev, [a.auditId]: e.target.value }))}
                              />
                              <div className="d-flex flex-column gap-1">
                                <button
                                  className="btn btn-success btn-sm"
                                  disabled={savingId === a.auditId}
                                  onClick={() => saveFindings(a.auditId)}
                                >
                                  {savingId === a.auditId ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg" />}
                                </button>
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => setEditFindings(prev => { const n = { ...prev }; delete n[a.auditId]; return n })}
                                >
                                  <i className="bi bi-x-lg" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="small text-muted">
                              {a.findings || <em className="text-danger">No findings yet</em>}
                            </span>
                          )}
                        </td>

                        <td className="small">{formatDate(a.date)}</td>
                        <td>
                          <span className={`badge rounded-pill ${statusBadgeClass(a.status)}`}>{a.status}</span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            {!isClosed && !isEditing && (
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setEditFindings(prev => ({ ...prev, [a.auditId]: a.findings || '' }))}
                              >
                                <i className="bi bi-pencil me-1" />Findings
                              </button>
                            )}
                            {!isClosed && (
                              <button
                                className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                                disabled={closingId === a.auditId}
                                onClick={() => close(a.auditId, a.scope)}
                              >
                                {closingId === a.auditId
                                  ? <span className="spinner-border spinner-border-sm" />
                                  : <i className="bi bi-lock" />}
                                Close
                              </button>
                            )}
                            {isClosed && (
                              <span className="text-muted small d-flex align-items-center gap-1">
                                <i className="bi bi-lock-fill" /> Closed
                              </span>
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
