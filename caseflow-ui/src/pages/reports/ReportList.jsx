import { useEffect, useState } from 'react'
import { reports } from '../../api/services'
import { REPORT_SCOPE, formatDate } from '../../utils/constants'

export default function ReportList() {
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ requestedBy: '', scope: 'SYSTEM', scopeValue: '' })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const p = await reports.paginated(0, 50)
      setList(p?.content || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const generate = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      const res = await reports.generate({
        requestedBy: Number(form.requestedBy),
        scope: form.scope,
        scopeValue: form.scopeValue,
      })
      setMsg(`Report #${res.reportId} generated`); setSelected(res); load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Reports</h1></div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <h3>Generate Report</h3>
        <form onSubmit={generate}>
          <div className="form-grid">
            <div className="form-row"><label>Requested By (user id)</label><input type="number" value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} required /></div>
            <div className="form-row">
              <label>Scope</label>
              <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}>
                {REPORT_SCOPE.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-row"><label>Scope Value (id or value for scope)</label><input value={form.scopeValue} onChange={e => setForm({ ...form, scopeValue: e.target.value })} required /></div>
          </div>
          <button className="btn btn-primary">Generate</button>
        </form>
      </div>

      <div className="card">
        <h3>All Reports</h3>
        {loading ? <div className="empty">Loading...</div> : list.length === 0 ? <div className="empty">No reports</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Scope</th><th>Value</th><th>Requested By</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {list.map(r => (
                <tr key={r.reportId}>
                  <td>#{r.reportId}</td>
                  <td>{r.scope}</td>
                  <td>{r.scopeValue}</td>
                  <td>{r.requestedBy}</td>
                  <td>{formatDate(r.generatedDate)}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setSelected(r)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="card">
          <h3>Report #{selected.reportId} Metrics</h3>
          <pre style={{ background: '#f1f3f5', padding: 12, borderRadius: 6, overflow: 'auto', fontSize: 12 }}>
            {(() => {
              try { return JSON.stringify(JSON.parse(selected.metrics), null, 2) } catch { return selected.metrics }
            })()}
          </pre>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
        </div>
      )}
    </div>
  )
}
