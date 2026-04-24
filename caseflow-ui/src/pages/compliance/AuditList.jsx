import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { compliance } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function AuditList() {
  const { user } = useAuth()
  const [audits, setAudits] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ adminId: '', scope: '', findings: '' })
  const [loading, setLoading] = useState(true)

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
    setErr(''); setMsg('')
    try {
      await compliance.createAudit({
        adminId: Number(form.adminId),
        scope: form.scope,
        findings: form.findings,
      })
      setMsg('Audit created'); setForm({ adminId: '', scope: '', findings: '' }); load()
    } catch (e) { setErr(e.message) }
  }

  const close = async (id) => {
    const adminId = prompt('Your admin ID?')
    if (!adminId) return
    try { await compliance.closeAudit(id, adminId); setMsg('Audit closed'); load() } catch (e) { setErr(e.message) }
  }

  const updateFindings = async (id) => {
    const findings = prompt('New findings:')
    if (!findings) return
    try { await compliance.updateFindings(id, findings); setMsg('Findings updated'); load() } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Audits</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Create Audit</h3>
          <form onSubmit={create}>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold small">Admin ID</label><input className="form-control" type="number" value={form.adminId} onChange={e => setForm({ ...form, adminId: e.target.value })} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Scope</label><input className="form-control" value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} required /></div>
            </div>
            <div className="mt-3 mb-3"><label className="form-label fw-semibold small">Findings (optional)</label><textarea className="form-control" value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} /></div>
            <button className="btn btn-dark">Create</button>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? <div className="text-center text-muted py-4">Loading...</div> : audits.length === 0 ? <div className="text-center text-muted py-4">No audits</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Admin</th><th>Scope</th><th>Findings</th><th>Date</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {audits.map(a => (
                    <tr key={a.auditId}>
                      <td>#{a.auditId}</td>
                      <td>{a.adminId}</td>
                      <td>{a.scope}</td>
                      <td>{a.findings}</td>
                      <td>{formatDate(a.date)}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(a.status)}`}>{a.status}</span></td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => updateFindings(a.auditId)}>Update Findings</button>
                          {a.status !== 'CLOSED' && <button className="btn btn-danger btn-sm" onClick={() => close(a.auditId)}>Close</button>}
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
