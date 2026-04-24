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
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Reports</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Generate Report</h3>
          <form onSubmit={generate}>
            <div className="row g-3">
              <div className="col-md-4"><label className="form-label fw-semibold small">Requested By (user id)</label><input className="form-control" type="number" value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} required /></div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Scope</label>
                <select className="form-select" value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}>
                  {REPORT_SCOPE.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-4"><label className="form-label fw-semibold small">Scope Value (id or value for scope)</label><input className="form-control" value={form.scopeValue} onChange={e => setForm({ ...form, scopeValue: e.target.value })} required /></div>
            </div>
            <button className="btn btn-dark mt-3">Generate</button>
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">All Reports</h3>
          {loading ? <div className="text-center text-muted py-4">Loading...</div> : list.length === 0 ? <div className="text-center text-muted py-4">No reports</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Scope</th><th>Value</th><th>Requested By</th><th>Date</th><th></th></tr></thead>
                <tbody>
                  {list.map(r => (
                    <tr key={r.reportId}>
                      <td>#{r.reportId}</td>
                      <td>{r.scope}</td>
                      <td>{r.scopeValue}</td>
                      <td>{r.requestedBy}</td>
                      <td>{formatDate(r.generatedDate)}</td>
                      <td><button className="btn btn-outline-secondary btn-sm" onClick={() => setSelected(r)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="card shadow-sm">
          <div className="card-body">
            <h3 className="h5 mb-3">Report #{selected.reportId} Metrics</h3>
            <pre className="bg-light p-3 rounded small" style={{ overflow: 'auto' }}>
              {(() => {
                try { return JSON.stringify(JSON.parse(selected.metrics), null, 2) } catch { return selected.metrics }
              })()}
            </pre>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
