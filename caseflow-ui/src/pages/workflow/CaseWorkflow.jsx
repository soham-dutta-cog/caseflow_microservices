import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { workflow } from '../../api/services'
import { CASE_TYPES, LIFECYCLE_MODES, statusBadgeClass, formatDate } from '../../utils/constants'

export default function CaseWorkflow() {
  const { caseId } = useParams()
  const [stages, setStages] = useState([])
  const [current, setCurrent] = useState(null)
  const [slaRecords, setSlaRecords] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const [initForm, setInitForm] = useState({ caseType: 'civil', mode: 'auto' })
  const [manualStages, setManualStages] = useState([{ sequenceNumber: 1, stageName: '', roleResponsible: '', slaDays: 7 }])
  const [skipForm, setSkipForm] = useState('')
  const [extForm, setExtForm] = useState({ additionalDays: 1, reason: '' })
  const [reassignForm, setReassignForm] = useState({ stageId: '', newRole: '' })

  const load = async () => {
    setErr('')
    try {
      const [s, c, r] = await Promise.allSettled([
        workflow.stages(caseId),
        workflow.current(caseId),
        workflow.sla(caseId),
      ])
      if (s.status === 'fulfilled') setStages(s.value || [])
      if (c.status === 'fulfilled') setCurrent(c.value)
      else setCurrent(null)
      if (r.status === 'fulfilled') setSlaRecords(r.value || [])
    } catch (e) { setErr(e.message) }
  }

  useEffect(() => { load() }, [caseId])

  const initialize = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      const body = { caseType: initForm.caseType, mode: initForm.mode }
      if (initForm.mode === 'manual') body.stages = manualStages.map(s => ({ ...s, slaDays: Number(s.slaDays), sequenceNumber: Number(s.sequenceNumber) }))
      const res = await workflow.init(caseId, body)
      setMsg(res?.message || 'Workflow initialized')
      load()
    } catch (e) { setErr(e.message) }
  }

  const advance = async () => {
    try {
      const r = await workflow.advance(caseId)
      setMsg(r?.message || 'Advanced'); load()
    } catch (e) { setErr(e.message) }
  }
  const rollback = async () => {
    try { await workflow.rollback(caseId); setMsg('Rolled back'); load() } catch (e) { setErr(e.message) }
  }
  const skip = async (e) => {
    e.preventDefault()
    try { await workflow.skip(caseId, { reason: skipForm }); setMsg('Stage skipped'); setSkipForm(''); load() } catch (e) { setErr(e.message) }
  }
  const extend = async (e) => {
    e.preventDefault()
    try { await workflow.extendSla(caseId, { additionalDays: Number(extForm.additionalDays), reason: extForm.reason }); setMsg('SLA extended'); setExtForm({ additionalDays: 1, reason: '' }); load() } catch (e) { setErr(e.message) }
  }
  const reassign = async (e) => {
    e.preventDefault()
    try { await workflow.reassign(caseId, { stageId: Number(reassignForm.stageId), newRole: reassignForm.newRole }); setMsg('Reassigned'); load() } catch (e) { setErr(e.message) }
  }

  const addStage = () => setManualStages([...manualStages, { sequenceNumber: manualStages.length + 1, stageName: '', roleResponsible: '', slaDays: 7 }])
  const updStage = (i, k, v) => { const x = [...manualStages]; x[i] = { ...x[i], [k]: v }; setManualStages(x) }
  const rmStage = (i) => setManualStages(manualStages.filter((_, idx) => idx !== i))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Workflow — Case #{caseId}</h1>
        <Link to={`/cases/${caseId}`} className="btn btn-ghost btn-sm">Back to Case</Link>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      {stages.length === 0 ? (
        <div className="card">
          <h3>Initialize Workflow</h3>
          <form onSubmit={initialize}>
            <div className="form-grid">
              <div className="form-row">
                <label>Case Type</label>
                <select value={initForm.caseType} onChange={e => setInitForm({ ...initForm, caseType: e.target.value })}>
                  {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>Mode</label>
                <select value={initForm.mode} onChange={e => setInitForm({ ...initForm, mode: e.target.value })}>
                  {LIFECYCLE_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            {initForm.mode === 'manual' && (
              <div>
                <h4>Manual Stages</h4>
                {manualStages.map((s, i) => (
                  <div key={i} className="flex-row" style={{ marginBottom: 8 }}>
                    <input style={{ width: 70 }} type="number" value={s.sequenceNumber} onChange={e => updStage(i, 'sequenceNumber', e.target.value)} />
                    <input placeholder="Stage name" value={s.stageName} onChange={e => updStage(i, 'stageName', e.target.value)} required />
                    <input placeholder="Role" value={s.roleResponsible} onChange={e => updStage(i, 'roleResponsible', e.target.value)} required />
                    <input style={{ width: 100 }} type="number" placeholder="SLA days" value={s.slaDays} onChange={e => updStage(i, 'slaDays', e.target.value)} required />
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => rmStage(i)}>×</button>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addStage}>+ Add Stage</button>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>Initialize</button>
          </form>
        </div>
      ) : (
        <>
          <div className="card">
            <h3>Current Stage</h3>
            {current ? (
              <div className="form-grid">
                <div><strong>Stage:</strong> {current.stageName}</div>
                <div><strong>Seq:</strong> {current.sequenceNumber}</div>
                <div><strong>Role:</strong> {current.roleResponsible}</div>
                <div><strong>SLA:</strong> {current.slaDays} days</div>
                <div><strong>Started:</strong> {formatDate(current.startedAt)}</div>
              </div>
            ) : <div className="empty">No active stage</div>}
            <div className="row-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={advance}>Advance →</button>
              <button className="btn btn-ghost" onClick={rollback}>← Rollback</button>
            </div>
          </div>

          <div className="card">
            <h3>All Stages</h3>
            <table className="table">
              <thead><tr><th>Seq</th><th>Stage</th><th>Role</th><th>SLA</th><th>Started</th><th>Completed</th><th>Active</th><th>Skipped</th></tr></thead>
              <tbody>
                {stages.map(s => (
                  <tr key={s.stageId}>
                    <td>{s.sequenceNumber}</td>
                    <td>{s.stageName}</td>
                    <td>{s.roleResponsible}</td>
                    <td>{s.slaDays}</td>
                    <td>{formatDate(s.startedAt)}</td>
                    <td>{formatDate(s.completedAt)}</td>
                    <td>{s.active ? '✓' : '-'}</td>
                    <td>{s.skipped ? '✓' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>SLA Records</h3>
            {slaRecords.length === 0 ? <div className="empty">No SLA records</div> : (
              <table className="table">
                <thead><tr><th>ID</th><th>Stage</th><th>Start</th><th>End</th><th>Elapsed</th><th>Remaining</th><th>%</th><th>Status</th></tr></thead>
                <tbody>
                  {slaRecords.map(r => (
                    <tr key={r.slaRecordId}>
                      <td>#{r.slaRecordId}</td>
                      <td>{r.stageId}</td>
                      <td>{formatDate(r.startDate)}</td>
                      <td>{formatDate(r.endDate)}</td>
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

          <div className="card">
            <h3>Skip Current Stage</h3>
            <form onSubmit={skip}>
              <div className="form-row">
                <label>Reason (5-1000 chars)</label>
                <textarea minLength={5} maxLength={1000} value={skipForm} onChange={e => setSkipForm(e.target.value)} required />
              </div>
              <button className="btn btn-primary">Skip Stage</button>
            </form>
          </div>

          <div className="card">
            <h3>Extend SLA</h3>
            <form onSubmit={extend}>
              <div className="form-grid">
                <div className="form-row"><label>Additional Days</label><input type="number" min={1} value={extForm.additionalDays} onChange={e => setExtForm({ ...extForm, additionalDays: e.target.value })} required /></div>
                <div className="form-row"><label>Reason</label><input value={extForm.reason} onChange={e => setExtForm({ ...extForm, reason: e.target.value })} required /></div>
              </div>
              <button className="btn btn-primary">Extend</button>
            </form>
          </div>

          <div className="card">
            <h3>Reassign Role</h3>
            <form onSubmit={reassign}>
              <div className="form-grid">
                <div className="form-row"><label>Stage ID</label><input type="number" value={reassignForm.stageId} onChange={e => setReassignForm({ ...reassignForm, stageId: e.target.value })} required /></div>
                <div className="form-row"><label>New Role</label><input value={reassignForm.newRole} onChange={e => setReassignForm({ ...reassignForm, newRole: e.target.value })} required /></div>
              </div>
              <button className="btn btn-primary">Reassign</button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
