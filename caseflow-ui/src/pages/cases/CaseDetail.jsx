import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cases, hearings, appeals, compliance, workflow } from '../../api/services'
import {
  CASE_STATUS, DOC_TYPES, DOC_VERIFICATION, REVIEW_OUTCOME_LABELS,
  statusBadgeClass, formatDate, formatDateTime,
  UPLOAD_ALLOWED_EXTENSIONS, UPLOAD_ACCEPT_ATTR, validateUpload, formatBytes,
} from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

export default function CaseDetail() {
  const { caseId } = useParams()
  const { user } = useAuth()
  const [c, setCase] = useState(null)
  const [docs, setDocs] = useState([])
  const [hrgs, setHrgs] = useState([])
  const [apps, setApps] = useState([])
  const [appealReviews, setAppealReviews] = useState([])
  const [compl, setCompl] = useState([])
  const [stages, setStages] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'PETITION', uri: '', file: null })
  const [statusUpdate, setStatusUpdate] = useState('')

  const load = async () => {
    setErr('')
    try {
      const canLoadReviews = ['ADMIN', 'CLERK', 'JUDGE'].includes(user?.role)
      const [cs, ds, hs, as, cm, st, rv] = await Promise.allSettled([
        cases.get(caseId),
        cases.docs(caseId),
        hearings.byCase(caseId),
        appeals.byCase(caseId),
        compliance.byCase(caseId),
        workflow.stages(caseId),
        canLoadReviews ? appeals.reviewsByCase(caseId) : Promise.resolve([]),
      ])
      if (cs.status === 'fulfilled') setCase(cs.value)
      if (ds.status === 'fulfilled') setDocs(ds.value || [])
      if (hs.status === 'fulfilled') setHrgs(hs.value || [])
      if (as.status === 'fulfilled') setApps(as.value || [])
      if (cm.status === 'fulfilled') setCompl(cm.value || [])
      if (st.status === 'fulfilled') setStages(st.value || [])
      if (rv.status === 'fulfilled') setAppealReviews(rv.value || [])
      if (cs.status === 'rejected') setErr(cs.reason.message)
    } catch (e) { setErr(e.message) }
  }

  useEffect(() => { load() }, [caseId])

  const uploadDoc = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')

    // Client-side validation: a file OR a URI must be provided.
    if (!uploadForm.file && !uploadForm.uri) {
      const m = 'Please attach a file or provide an external URI.'
      setErr(m); window.alert(m); return
    }
    if (uploadForm.file) {
      const v = validateUpload(uploadForm.file)
      if (v) { setErr(v); window.alert(v); return }
    }

    try {
      const fd = new FormData()
      fd.append('caseId', caseId)
      fd.append('title', uploadForm.title)
      fd.append('type', uploadForm.type)
      fd.append('uploadedBy', user.email)
      if (uploadForm.uri)  fd.append('uri',  uploadForm.uri)
      if (uploadForm.file) fd.append('file', uploadForm.file)
      await cases.uploadDoc(fd)
      setMsg('Document uploaded')
      setUploadForm({ title: '', type: 'PETITION', uri: '', file: null })
      // reset the native <input type="file"> too
      const fi = document.getElementById('case-doc-file')
      if (fi) fi.value = ''
      load()
    } catch (e) {
      // Surface backend errors clearly (e.g., file too large / bad type if frontend pre-check missed it)
      const msg = e?.message || 'Upload failed.'
      setErr(msg); window.alert(msg)
    }
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
      await cases.verifyDoc(doc.documentId, { status, rejectionReason, clerkId: user.userId || user.email })
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

  if (!c) return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Case</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      <div className="card shadow-sm"><div className="card-body">Loading...</div></div>
    </div>
  )

  const canUpload = (
    user?.role === 'ADMIN' ||
    (user?.role === 'LAWYER' && c.lawyerId && (c.lawyerId === user?.userId || c.lawyerId === user?.email)) ||
    (user?.role === 'LITIGANT' && !c.lawyerId)
  )
  const canVerify = ['CLERK', 'ADMIN'].includes(user?.role)
  const canUpdateStatus = ['CLERK', 'JUDGE', 'ADMIN'].includes(user?.role)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Case #{c.caseId}: {c.title}</h1>
        <div className="d-flex gap-2 flex-wrap">
          {['ADMIN','CLERK'].includes(user?.role) && <Link to={`/workflow/${c.caseId}`} className="btn btn-outline-secondary btn-sm">Workflow</Link>}
          {['LITIGANT','LAWYER','ADMIN'].includes(user?.role) && c.status === 'CLOSED' && (
            <Link to={`/appeals/file?caseId=${c.caseId}`} className="btn btn-outline-secondary btn-sm">File Appeal</Link>
          )}
        </div>
      </div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Case Info</h3>
          <div className="row g-3">
            <div className="col-md-6"><strong>Status:</strong> <span className={`badge rounded-pill ${statusBadgeClass(c.status)}`}>{c.status}</span></div>
            <div className="col-md-6"><strong>Filed:</strong> {formatDateTime(c.filedDate)}</div>
            <div className="col-md-6"><strong>Litigant:</strong> {c.litigantId}</div>
            <div className="col-md-6"><strong>Lawyer:</strong> {c.lawyerId || '-'}</div>
          </div>
          {canUpdateStatus && (
            <div className="d-flex gap-2 align-items-center flex-wrap mt-3">
              <select className="form-select form-select-sm w-auto" value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}>
                <option value="">-- Change Status --</option>
                {CASE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn btn-dark btn-sm" onClick={updateStatus} disabled={!statusUpdate}>Update</button>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Documents ({docs.length})</h3>
          {docs.length === 0 ? <div className="text-center text-muted py-4">No documents</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Title</th><th>Type</th><th>Status</th><th>Uploaded</th><th>By</th><th>Actions</th></tr></thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d.documentId}>
                      <td>#{d.documentId}</td>
                      <td>{d.title}</td>
                      <td>{d.type}</td>
                      <td>
                        <span className={`badge rounded-pill ${statusBadgeClass(d.verificationStatus)}`}>{d.verificationStatus}</span>
                        {d.rejectionReason && <div className="text-muted small mt-1">{d.rejectionReason}</div>}
                      </td>
                      <td>{formatDate(d.uploadedDate)}</td>
                      <td>{d.uploadedBy}</td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => downloadDoc(d.documentId)}>Download</button>
                          {canVerify && d.verificationStatus === 'PENDING' && (
                            <>
                              <button className="btn btn-dark btn-sm" onClick={() => verifyDoc(d, 'VERIFIED')}>Verify</button>
                              <button className="btn btn-danger btn-sm" onClick={() => verifyDoc(d, 'REJECTED')}>Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canUpload && (
            <form onSubmit={uploadDoc} className="border-top pt-3 mt-3">
              <h4 className="h6 mb-3">Upload Document</h4>

              {/* Constraint banner — always visible at the top of the form */}
              <div className="alert alert-info py-2 small d-flex align-items-start gap-2 mb-3">
                <i className="bi bi-info-circle-fill mt-1" style={{ flexShrink: 0 }} />
                <div>
                  <div><strong>Upload limits</strong></div>
                  <div>Max file size: <strong>10 MB</strong></div>
                  <div>Allowed types: <strong>{UPLOAD_ALLOWED_EXTENSIONS.join(', ')}</strong></div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Title</label>
                  <input className="form-control" value={uploadForm.title}
                    onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                    minLength={2} maxLength={255} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Type</label>
                  <select className="form-select" value={uploadForm.type}
                    onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">External URI (optional)</label>
                  <input className="form-control" value={uploadForm.uri}
                    onChange={e => setUploadForm({ ...uploadForm, uri: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">File (optional)</label>
                  <input
                    id="case-doc-file"
                    className="form-control"
                    type="file"
                    accept={UPLOAD_ACCEPT_ATTR}
                    onChange={e => {
                      const f = e.target.files[0] || null
                      if (f) {
                        const v = validateUpload(f)
                        if (v) {
                          window.alert(v)
                          setErr(v)
                          e.target.value = ''
                          setUploadForm({ ...uploadForm, file: null })
                          return
                        }
                      }
                      setErr('')
                      setUploadForm({ ...uploadForm, file: f })
                    }}
                  />
                  <div className="form-text small">
                    Max 10 MB. Allowed: {UPLOAD_ALLOWED_EXTENSIONS.join(', ')}
                  </div>
                  {uploadForm.file && (
                    <div className="text-success small mt-1">
                      <i className="bi bi-check-circle me-1" />
                      Selected: <strong>{uploadForm.file.name}</strong>{' '}
                      <span className="text-muted">({formatBytes(uploadForm.file.size)})</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn btn-dark mt-3">
                <i className="bi bi-upload me-1" />Upload
              </button>
            </form>
          )}

          {/* Litigant has a lawyer — explain that they don't upload directly. */}
          {!canUpload && user?.role === 'LITIGANT' && c.lawyerId && (
            <div className="border-top pt-3 mt-3">
              <div className="alert alert-info py-3 mb-0 d-flex align-items-start gap-3"
                style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <i className="bi bi-person-check-fill" style={{ fontSize: '1.4rem', color: '#0d6efd', flexShrink: 0 }} />
                <div>
                  <div className="fw-semibold mb-1">Your lawyer handles document uploads</div>
                  <div className="small text-muted">
                    Lawyer <strong>{c.lawyerId}</strong> is assigned to your case and will upload the required
                    documents on your behalf. You'll receive a notification each time a document is uploaded,
                    verified, or rejected.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Hearings</h3>
          {hrgs.length === 0 ? <div className="text-center text-muted py-4">No hearings scheduled</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Date</th><th>Time</th><th>Judge</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {hrgs.map(h => (
                    <tr key={h.hearingId}>
                      <td>#{h.hearingId}</td>
                      <td>{formatDate(h.hearingDate)}</td>
                      <td>{h.hearingTime}</td>
                      <td>{h.judgeId}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(h.status)}`}>{h.status}</span></td>
                      <td><Link to={`/hearings/${h.hearingId}`} className="btn btn-outline-secondary btn-sm">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Workflow Stages</h3>
          {stages.length === 0 ? (
            <div className="wf-init-empty">
              <div className="wf-init-empty-icon">⚙️</div>
              <p>No workflow has been initialized for this case yet.</p>
              {['ADMIN','CLERK'].includes(user?.role) && <Link to={`/workflow/${c.caseId}`} className="wf-init-link">Initialize Workflow</Link>}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>Seq</th><th>Stage</th><th>Role</th><th>SLA (days)</th><th>Active</th><th>Skipped</th></tr></thead>
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
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Appeals</h3>
          {apps.length === 0 ? <div className="text-center text-muted py-4">No appeals</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Filed</th><th>By</th><th>Reason</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {apps.map(a => (
                    <tr key={a.appealId}>
                      <td>#{a.appealId}</td>
                      <td>{formatDate(a.filedDate)}</td>
                      <td>{a.filedByUserId}</td>
                      <td>{a.reason}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(a.status)}`}>{a.status}</span></td>
                      <td><Link to={`/appeals/${a.appealId}`} className="btn btn-outline-secondary btn-sm">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {['ADMIN', 'CLERK', 'JUDGE'].includes(user?.role) && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h3 className="h5 mb-3">Appeal Reviews</h3>
            {appealReviews.length === 0 ? (
              <div className="text-center text-muted py-4">No reviews recorded for this case</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Review</th><th>Appeal</th><th>Judge</th>
                      <th>Assigned</th><th>Outcome</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {appealReviews.map(r => (
                      <tr key={r.reviewId}>
                        <td>#{r.reviewId}</td>
                        <td><Link to={`/appeals/${r.appealId}`}>#{r.appealId}</Link></td>
                        <td>{r.judgeId}</td>
                        <td>{formatDateTime(r.reviewDate)}</td>
                        <td>
                          {r.outcome ? (
                            <span className={`badge rounded-pill ${statusBadgeClass(r.outcome)}`}>
                              {REVIEW_OUTCOME_LABELS[r.outcome] || r.outcome}
                            </span>
                          ) : (
                            <span className="badge rounded-pill text-bg-warning">Pending</span>
                          )}
                        </td>
                        <td><Link to={`/appeals/${r.appealId}`} className="btn btn-outline-secondary btn-sm">Open</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Compliance Records</h3>
          {compl.length === 0 ? <div className="text-center text-muted py-4">No compliance records</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>Type</th><th>Result</th><th>Date</th><th>Notes</th></tr></thead>
                <tbody>
                  {compl.map(r => (
                    <tr key={r.complianceId}>
                      <td>#{r.complianceId}</td>
                      <td>{r.type}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(r.result)}`}>{r.result}</span></td>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.notes}</td>
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
