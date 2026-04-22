import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { workflow } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'

export default function WorkflowDashboard() {
  const [breached, setBreached] = useState([])
  const [active, setActive] = useState([])
  const [warnings, setWarnings] = useState([])
  const [tab, setTab] = useState('breached')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const [b, a, w] = await Promise.allSettled([
        workflow.breached(),
        workflow.active(),
        workflow.warnings(),
      ])
      if (b.status === 'fulfilled') setBreached(b.value || [])
      if (a.status === 'fulfilled') setActive(a.value || [])
      if (w.status === 'fulfilled') setWarnings(w.value || [])
    } catch (e) { setErr(e.message) }
  }

  useEffect(() => { load() }, [])

  const triggerCheck = async () => {
    setErr(''); setMsg('')
    try {
      const res = await workflow.checkSla()
      setMsg(typeof res === 'string' ? res : 'SLA check triggered')
      load()
    } catch (e) { setErr(e.message) }
  }

  const records = tab === 'breached' ? breached : tab === 'warnings' ? warnings : active

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Workflow / SLA</h1>
        <button className="btn btn-primary" onClick={triggerCheck}>Trigger SLA Check</button>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="stats-grid">
        <div className="stat"><div className="stat__label">Active SLAs</div><div className="stat__value">{active.length}</div></div>
        <div className="stat"><div className="stat__label">Warnings (80%+)</div><div className="stat__value" style={{ color: '#e8a838' }}>{warnings.length}</div></div>
        <div className="stat"><div className="stat__label">Breached</div><div className="stat__value" style={{ color: '#f07068' }}>{breached.length}</div></div>
      </div>

      <div className="card">
        <div className="flex-row">
          <button className={`btn btn-sm ${tab === 'breached' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('breached')}>Breached</button>
          <button className={`btn btn-sm ${tab === 'warnings' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('warnings')}>Warnings</button>
          <button className={`btn btn-sm ${tab === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('active')}>Active</button>
        </div>
        {records.length === 0 ? <div className="empty">None</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Case</th><th>Stage</th><th>Start</th><th>End</th><th>SLA Days</th><th>Elapsed</th><th>Remaining</th><th>%</th><th>Status</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.slaRecordId}>
                  <td>#{r.slaRecordId}</td>
                  <td><Link to={`/cases/${r.caseId}`}>#{r.caseId}</Link></td>
                  <td>{r.stageId}</td>
                  <td>{formatDate(r.startDate)}</td>
                  <td>{formatDate(r.endDate)}</td>
                  <td>{r.slaDays}</td>
                  <td>{r.daysElapsed}</td>
                  <td>{r.daysRemaining}</td>
                  <td>{r.slaUsagePercent?.toFixed(0)}%</td>
                  <td><span className={`badge-pill ${statusBadgeClass(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
