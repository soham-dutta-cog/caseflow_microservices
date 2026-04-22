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
      <div className="page-header"><h1 className="page-title">Audits</h1></div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <h3>Create Audit</h3>
        <form onSubmit={create}>
          <div className="form-grid">
            <div className="form-row"><label>Admin ID</label><input type="number" value={form.adminId} onChange={e => setForm({ ...form, adminId: e.target.value })} required /></div>
            <div className="form-row"><label>Scope</label><input value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} required /></div>
          </div>
          <div className="form-row"><label>Findings (optional)</label><textarea value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} /></div>
          <button className="btn btn-primary">Create</button>
        </form>
      </div>

      <div className="card">
        {loading ? <div className="empty">Loading...</div> : audits.length === 0 ? <div className="empty">No audits</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Admin</th><th>Scope</th><th>Findings</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {audits.map(a => (
                <tr key={a.auditId}>
                  <td>#{a.auditId}</td>
                  <td>{a.adminId}</td>
                  <td>{a.scope}</td>
                  <td>{a.findings}</td>
                  <td>{formatDate(a.date)}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(a.status)}`}>{a.status}</span></td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => updateFindings(a.auditId)}>Update Findings</button>
                    {a.status !== 'CLOSED' && <button className="btn btn-danger btn-sm" onClick={() => close(a.auditId)}>Close</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
