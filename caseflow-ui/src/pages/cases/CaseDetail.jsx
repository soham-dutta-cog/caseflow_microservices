import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cases, hearings, appeals, compliance, workflow } from '../../api/services'
import { CASE_STATUS, DOC_TYPES, DOC_VERIFICATION, statusBadgeClass, formatDate, formatDateTime } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

export default function CaseDetail() {
  const { caseId } = useParams()
  const { user } = useAuth()
  const [c, setCase] = useState(null)
  const [docs, setDocs] = useState([])
  const [hrgs, setHrgs] = useState([])
  const [apps, setApps] = useState([])
  const [compl, setCompl] = useState([])
  const [stages, setStages] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'PETITION', uri: '', file: null })
  const [statusUpdate, setStatusUpdate] = useState('')

  const load = async () => {
    setErr('')
    try {
      const [cs, ds, hs, as, cm, st] = await Promise.allSettled([
        cases.get(caseId),
        cases.docs(caseId),
        hearings.byCase(caseId),
        appeals.byCase(caseId),
        compliance.byCase(caseId),
        workflow.stages(caseId),
      ])
      if (cs.status === 'fulfilled') setCase(cs.value)
      if (ds.status === 'fulfilled') setDocs(ds.value || [])
      if (hs.status === 'fulfilled') setHrgs(hs.value || [])
      if (as.status === 'fulfilled') setApps(as.value || [])
      if (cm.status === 'fulfilled') setCompl(cm.value || [])
      if (st.status === 'fulfilled') setStages(st.value || [])
      if (cs.status === 'rejected') setErr(cs.reason.message)
    } catch (e) { setErr(e.message) }
  }

  useEffect(() => { load() }, [caseId])

  const uploadDoc = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      const fd = new FormData()
      fd.append('caseId', caseId)
      fd.append('title', uploadForm.title)
      fd.append('type', uploadForm.type)
      fd.append('uploadedBy', user.email)
      if (uploadForm.uri) fd.append('uri', uploadForm.uri)
      if (uploadForm.file) fd.append('file', uploadForm.file)
      await cases.uploadDoc(fd)
      setMsg('Document uploaded')
      setUploadForm({ title: '', type: 'PETITION', uri: '', file: null })
      load()
    } catch (e) { setErr(e.message) }
  }

  const updateStatus = async () => {
    if (!statusUpdate) return
    try {
      await cases.updateStatus(caseId, statusUpdate, user.email)
      setMsg('Status updated'); load()
    } catch (e) { setErr(e.message) }
  }

  const verifyDoc = async (doc, status) => {
    let rejectionReason = ''
    if (status === 'REJECTED') {
      rejectionReason = prompt('Reason for rejection?') || ''
      if (!rejectionReason) return
    }
    try {
      await cases.verifyDoc(doc.documentId, { status, rejectionReason, clerkId: user.email })
      setMsg(`Document ${status.toLowerCase()}`)
      load()
    } catch (e) { setErr(e.message) }
  }

  const downloadDoc = async (docId) => {
    try {
      const res = await cases.downloadDoc(docId, user.role)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `document_${docId}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { setErr(e.message) }
  }

  if (!c) return <div><div className="page-header"><h1 className="page-title">Case</h1></div>{err && <div className="alert alert-error">{err}</div>}<div className="card">Loading...</div></div>

  const canUpload = ['LITIGANT', 'LAWYER', 'CLERK', 'ADMIN'].includes(user?.role)
  const canVerify = ['CLERK', 'ADMIN'].includes(user?.role)
  const canUpdateStatus = ['CLERK', 'JUDGE', 'ADMIN'].includes(user?.role)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Case #{c.caseId}: {c.title}</h1>
        <div className="row-actions">
          <Link to={`/workflow/${c.caseId}`} className="btn btn-ghost btn-sm">Workflow</Link>
          <Link to={`/appeals/file?caseId=${c.caseId}`} className="btn btn-ghost btn-sm">File Appeal</Link>
        </div>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <h3>Case Info</h3>
        <div className="form-grid">
          <div><strong>Status:</strong> <span className={`badge-pill ${statusBadgeClass(c.status)}`}>{c.status}</span></div>
          <div><strong>Filed:</strong> {formatDateTime(c.filedDate)}</div>
          <div><strong>Litigant:</strong> {c.litigantId}</div>
          <div><strong>Lawyer:</strong> {c.lawyerId || '-'}</div>
        </div>
        {canUpdateStatus && (
          <div className="flex-row" style={{ marginTop: 14 }}>
            <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}>
              <option value="">-- Change Status --</option>
              {CASE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={updateStatus} disabled={!statusUpdate}>Update</button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Documents ({docs.length})</h3>
        {docs.length === 0 ? <div className="empty">No documents</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Status</th><th>Uploaded</th><th>By</th><th>Actions</th></tr></thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.documentId}>
                  <td>#{d.documentId}</td>
                  <td>{d.title}</td>
                  <td>{d.type}</td>
                  <td>
                    <span className={`badge-pill ${statusBadgeClass(d.verificationStatus)}`}>{d.verificationStatus}</span>
                    {d.rejectionReason && <div className="muted" style={{ marginTop: 4 }}>{d.rejectionReason}</div>}
                  </td>
                  <td>{formatDate(d.uploadedDate)}</td>
                  <td>{d.uploadedBy}</td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => downloadDoc(d.documentId)}>Download</button>
                    {canVerify && d.verificationStatus === 'PENDING' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => verifyDoc(d, 'VERIFIED')}>Verify</button>
                        <button className="btn btn-danger btn-sm" onClick={() => verifyDoc(d, 'REJECTED')}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {canUpload && (
          <form onSubmit={uploadDoc} style={{ marginTop: 18, borderTop: '1px solid #e9ecef', paddingTop: 16 }}>
            <h4 style={{ marginTop: 0 }}>Upload Document</h4>
            <div className="form-grid">
              <div className="form-row">
                <label>Title</label>
                <input value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} minLength={2} maxLength={255} required />
              </div>
              <div className="form-row">
                <label>Type</label>
                <select value={uploadForm.type} onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>External URI (optional)</label>
                <input value={uploadForm.uri} onChange={e => setUploadForm({ ...uploadForm, uri: e.target.value })} />
              </div>
              <div className="form-row">
                <label>File (optional)</label>
                <input type="file" onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })} />
              </div>
            </div>
            <button className="btn btn-primary">Upload</button>
          </form>
        )}
      </div>

      <div className="card">
        <h3>Hearings</h3>
        {hrgs.length === 0 ? <div className="empty">No hearings scheduled</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Judge</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {hrgs.map(h => (
                <tr key={h.hearingId}>
                  <td>#{h.hearingId}</td>
                  <td>{formatDate(h.hearingDate)}</td>
                  <td>{h.hearingTime}</td>
                  <td>{h.judgeId}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(h.status)}`}>{h.status}</span></td>
                  <td><Link to={`/hearings/${h.hearingId}`} className="btn btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Workflow Stages</h3>
        {stages.length === 0 ? (
          <div className="empty">No workflow initialized. <Link to={`/workflow/${c.caseId}`}>Initialize</Link></div>
        ) : (
          <table className="table">
            <thead><tr><th>Seq</th><th>Stage</th><th>Role</th><th>SLA (days)</th><th>Active</th><th>Skipped</th></tr></thead>
            <tbody>
              {stages.map(s => (
                <tr key={s.stageId}>
                  <td>{s.sequenceNumber}</td>
                  <td>{s.stageName}</td>
                  <td>{s.roleResponsible}</td>
                  <td>{s.slaDays}</td>
                  <td>{s.active ? '✓' : '-'}</td>
                  <td>{s.skipped ? '✓' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Appeals</h3>
        {apps.length === 0 ? <div className="empty">No appeals</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Filed</th><th>By</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.appealId}>
                  <td>#{a.appealId}</td>
                  <td>{formatDate(a.filedDate)}</td>
                  <td>{a.filedByUserId}</td>
                  <td>{a.reason}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(a.status)}`}>{a.status}</span></td>
                  <td><Link to={`/appeals/${a.appealId}`} className="btn btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Compliance Records</h3>
        {compl.length === 0 ? <div className="empty">No compliance records</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Type</th><th>Result</th><th>Date</th><th>Notes</th></tr></thead>
            <tbody>
              {compl.map(r => (
                <tr key={r.complianceId}>
                  <td>#{r.complianceId}</td>
                  <td>{r.type}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(r.result)}`}>{r.result}</span></td>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
