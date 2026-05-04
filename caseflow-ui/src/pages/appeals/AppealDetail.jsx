import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { appeals, users } from '../../api/services'
import {
  REVIEW_OUTCOME, REVIEW_OUTCOME_LABELS,
  APPEAL_DOC_TYPES, APPEAL_AUDIT_ACTIONS,
  statusBadgeClass, formatDateTime,
  UPLOAD_ALLOWED_EXTENSIONS, UPLOAD_ACCEPT_ATTR, validateUpload, formatBytes,
} from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import {
  AppealStepper, OutcomeChip, EmptyState, SectionHead, DocIcon,
  PageHeader, SkeletonList,
} from './appealsUi'
import './Appeals.css'

const AUDIT_ICON = {
  FILED:                 { i: 'bi-file-earmark-text-fill', tone: 'filed' },
  CANCELLED:             { i: 'bi-x-octagon-fill',         tone: 'cancelled' },
  OPENED_FOR_REVIEW:     { i: 'bi-search',                 tone: 'review' },
  OUTCOME_DRAFT_UPDATED: { i: 'bi-pencil-fill',            tone: 'draft' },
  DECIDED:               { i: 'bi-stamp-fill',             tone: 'decided' },
  DOCUMENT_UPLOADED:     { i: 'bi-paperclip',              tone: 'doc' },
  DOCUMENT_DELETED:      { i: 'bi-trash3',                 tone: 'cancelled' },
}

export default function AppealDetail() {
  const { appealId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()

  const [a, setA]            = useState(null)
  const [review, setReview]  = useState(null)
  const [docs, setDocs]      = useState([])
  const [audit, setAudit]    = useState([])
  const [showAudit, setShowAudit] = useState(false)
  const [err, setErr]        = useState('')
  const [msg, setMsg]        = useState('')
  const [busy, setBusy]      = useState(false)

  const [judgeId, setJudgeId] = useState('')
  const [judges, setJudges]   = useState([])
  const [judgesLoading, setJudgesLoading] = useState(false)
  const [decision, setDecision] = useState({ outcome: 'APPEAL_UPHELD', remarks: '' })
  const [draftOutcome, setDraftOutcome] = useState('')
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'PETITION', file: null })
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // ── Loaders ────────────────────────────────────────────────────────────
  const load = async () => {
    setErr('')
    try {
      const appeal = await appeals.get(appealId)
      setA(appeal)
      const [r, d] = await Promise.allSettled([
        appeals.getReview(appealId),
        appeals.listDocs(appealId),
      ])
      setReview(r.status === 'fulfilled' ? r.value : null)
      setDocs(d.status === 'fulfilled' ? (d.value || []) : [])
    } catch (e) { setErr(e.message) }
  }
  const loadAudit = async () => {
    try {
      const rows = await appeals.audit(appealId)
      setAudit(rows || [])
    } catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [appealId])
  useEffect(() => { if (showAudit) loadAudit() }, [showAudit, appealId])

  // Load list of judges for the assignment dropdown
  useEffect(() => {
    setJudgesLoading(true)
    users.byRole('JUDGE')
      .then(data => setJudges(Array.isArray(data) ? data : []))
      .catch(() => setJudges([]))
      .finally(() => setJudgesLoading(false))
  }, [])

  // ── Action wrappers ────────────────────────────────────────────────────
  const wrap = async (label, fn) => {
    setErr(''); setMsg(''); setBusy(true)
    try { await fn(); setMsg(label); load() }
    catch (e) { setErr(e.message) }
    finally   { setBusy(false) }
  }

  const openReview    = () => wrap('Review opened', () => appeals.openReview(appealId, judgeId.trim()))
  const cancelAppeal  = () => {
    if (!confirm(`Cancel appeal #${appealId}? This cannot be undone.`)) return
    return wrap('Appeal cancelled', () => appeals.cancel(appealId))
  }
  const issueDecision = (e) => { e.preventDefault(); return wrap('Decision issued', () => appeals.decide(appealId, decision)) }
  const updateDraft   = () => wrap('Draft outcome updated',
    () => appeals.updateOutcome(review.reviewId, { outcome: draftOutcome }))

  const onPickFile = (file) => {
    if (!file) return
    const v = validateUpload(file)
    if (v) {
      window.alert(v)
      setErr(v)
      return
    }
    setErr('')
    setUploadForm(f => ({
      ...f,
      file,
      // Auto-fill title from filename if user hasn't entered one
      title: f.title || file.name.replace(/\.[^.]+$/, ''),
    }))
  }
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    onPickFile(e.dataTransfer.files?.[0])
  }
  const uploadDoc = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (!uploadForm.file) {
      const m = 'Please select a file to upload.'
      setErr(m); window.alert(m); return
    }
    const v = validateUpload(uploadForm.file)
    if (v) { setErr(v); window.alert(v); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('title', uploadForm.title.trim())
      fd.append('type',  uploadForm.type)
      fd.append('file',  uploadForm.file)
      await appeals.uploadDoc(appealId, fd)
      setMsg('Document uploaded')
      setUploadForm({ title: '', type: 'PETITION', file: null })
      load()
    } catch (e) {
      const m = e?.message || 'Upload failed.'
      setErr(m); window.alert(m)
    } finally   { setBusy(false) }
  }
  const deleteDoc = async (docId) => {
    if (!confirm(`Delete document #${docId}?`)) return
    return wrap('Document deleted', () => appeals.deleteDoc(docId))
  }
  const downloadDoc = async (docId, filename) => {
    try {
      const res = await appeals.downloadDoc(docId)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `appeal-document-${docId}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) { setErr(e.message) }
  }

  // ── Permissions ───────────────────────────────────────────────────────
  const isAdmin = user?.role === 'ADMIN'
  const isClerk = user?.role === 'CLERK'
  const isJudge = user?.role === 'JUDGE'
  const isFiler = a && (a.filedByUserId === user?.userId || a.filedByUserId === user?.email)
  const isAssignedJudge = review && (review.judgeId === user?.userId || review.judgeId === user?.email)

  const canCancel    = a && (
    (isFiler && a.status === 'SUBMITTED') ||
    (isAdmin && (a.status === 'SUBMITTED' || a.status === 'REVIEWED'))
  )
  const canOpenReview = a && a.status === 'SUBMITTED' && (isAdmin || isClerk || isJudge)
  const canDecide     = a && a.status === 'REVIEWED' && (isAdmin || isAssignedJudge)
  const canEditDraft  = a && a.status === 'REVIEWED' && (isAdmin || isAssignedJudge)
  const canUploadDoc  = a && (isAdmin || (isFiler && a.status === 'SUBMITTED'))
  const canDeleteDoc  = (a && isAdmin) || (a && isFiler && a.status === 'SUBMITTED')
  const canViewAudit  = a && (isFiler || isAdmin || isClerk || isJudge)

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (!a) return (
    <div className="appeal-fade-in">
      <PageHeader title="Appeal" subtitle="Loading details..." />
      {err && <div className="alert alert-danger py-2">{err}</div>}
      <div className="appeal-card">
        <div className="appeal-card__body">
          <div className="appeal-skeleton appeal-skeleton--row" style={{ width: '40%' }} />
          <div className="appeal-skeleton appeal-skeleton--row" />
          <div className="appeal-skeleton appeal-skeleton--row" />
          <div className="appeal-skeleton appeal-skeleton--row" style={{ width: '60%' }} />
          <SkeletonList rows={2} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="appeal-fade-in">
      {/* Header strip */}
      <PageHeader
        title={<>Appeal #{a.appealId} <span className={`badge rounded-pill ms-2 align-middle ${statusBadgeClass(a.status)}`}>{a.status}</span></>}
        subtitle={<>On case <Link to={`/cases/${a.caseId}`} style={{ color: 'var(--cf-gold-300)' }}>#{a.caseId}</Link> · Filed by {a.filedByUserId} · {formatDateTime(a.filedDate)}</>}
        actions={(
          <>
            <button className="btn btn-outline-light btn-sm" onClick={() => nav(-1)}>
              <i className="bi bi-arrow-left me-1" /> Back
            </button>
            {canCancel && (
              <button className="btn btn-outline-light btn-sm" style={{ borderColor: '#f07068', color: '#ffa9a3' }} onClick={cancelAppeal} disabled={busy}>
                <i className="bi bi-x-lg me-1" /> Cancel Appeal
              </button>
            )}
          </>
        )}
      />

      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      {/* Lifecycle stepper */}
      <div className="appeal-card mb-3">
        <div className="appeal-card__body">
          <AppealStepper status={a.status} />
        </div>
      </div>

      {/* Appeal info */}
      <div className="appeal-card mb-3">
        <SectionHead icon="bi-file-text" title="Appeal Details" />
        <div className="appeal-card__body">
          <div className="row g-3">
            <div className="col-md-4"><span className="text-muted small d-block">Case</span><Link to={`/cases/${a.caseId}`}>#{a.caseId}</Link></div>
            <div className="col-md-4"><span className="text-muted small d-block">Filed by</span>{a.filedByUserId}</div>
            <div className="col-md-4"><span className="text-muted small d-block">Filed on</span>{formatDateTime(a.filedDate)}</div>
            <div className="col-12">
              <span className="text-muted small d-block">Reason</span>
              <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{a.reason}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review section */}
      <div className="appeal-card mb-3">
        <SectionHead icon="bi-gavel" title="Review" />
        <div className="appeal-card__body">
          {!review && a.status === 'SUBMITTED' && !canOpenReview && (
            <EmptyState
              icon="bi-hourglass-split"
              title="Awaiting judge assignment"
              hint="A clerk or judge will pick up this appeal soon."
            />
          )}

          {!review && canOpenReview && (
            <form onSubmit={e => { e.preventDefault(); openReview() }}>
              <div className="appeal-decide-banner">
                <i className="bi bi-info-circle-fill" />
                <div>
                  Assign a judge to start the review. The judge will be validated against IAM and
                  cannot be reassigned to two active appeals on the same case.
                </div>
              </div>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label fw-semibold small">Select Judge *</label>
                  <select
                    className="form-select"
                    value={judgeId}
                    onChange={e => setJudgeId(e.target.value)}
                    disabled={judgesLoading || busy}
                    required
                  >
                    <option value="">
                      {judgesLoading ? 'Loading judges…' : '— Select a judge —'}
                    </option>
                    {judges.map(j => (
                      <option key={j.userId} value={j.userId}>
                        {j.name || j.username || j.email || '(unnamed)'} &nbsp;—&nbsp; {j.userId}
                      </option>
                    ))}
                  </select>
                  <div className="form-text small">
                    Judges are loaded from the IAM service. The selected judge's user-id will be assigned.
                  </div>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button className="btn btn-dark w-100" disabled={!judgeId.trim() || busy}>
                    {busy ? <><span className="spinner-border spinner-border-sm me-2" />Assigning...</> :
                      <><i className="bi bi-arrow-right-circle me-1" /> Open Review</>}
                  </button>
                </div>
              </div>
            </form>
          )}

          {review && (
            <>
              <div className="row g-3">
                <div className="col-md-3"><span className="text-muted small d-block">Review ID</span>#{review.reviewId}</div>
                <div className="col-md-3"><span className="text-muted small d-block">Judge</span>{review.judgeId}</div>
                <div className="col-md-3"><span className="text-muted small d-block">Assigned</span>{formatDateTime(review.reviewDate)}</div>
                <div className="col-md-3">
                  <span className="text-muted small d-block">Outcome</span>
                  <OutcomeChip outcome={review.outcome} />
                </div>
              </div>
              {review.remarks && (
                <div className="mt-3">
                  <span className="text-muted small d-block">Remarks</span>
                  <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>{review.remarks}</div>
                </div>
              )}

              {/* Issue decision */}
              {canDecide && (
                <form onSubmit={issueDecision} className="border-top pt-3 mt-3">
                  <div className="appeal-decide-banner">
                    <i className="bi bi-stamp" />
                    <div>
                      Issue the final decision. <strong>UPHELD</strong> / <strong>RETRIAL</strong> reopens the case;
                      <strong> REMANDED</strong> sends it back to the lower court; otherwise the case stays closed.
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Outcome *</label>
                      <select
                        className="form-select"
                        value={decision.outcome}
                        onChange={e => setDecision({ ...decision, outcome: e.target.value })}
                      >
                        {REVIEW_OUTCOME.map(o => (
                          <option key={o} value={o}>{REVIEW_OUTCOME_LABELS[o] || o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <OutcomeChip outcome={decision.outcome} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Remarks</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={decision.remarks}
                        onChange={e => setDecision({ ...decision, remarks: e.target.value })}
                        placeholder="Reasoning for the decision (optional but recommended)"
                      />
                    </div>
                  </div>
                  <button className="btn btn-dark mt-3" disabled={busy}>
                    {busy ? <><span className="spinner-border spinner-border-sm me-2" />Issuing...</> :
                      <><i className="bi bi-check-circle me-1" />Issue Decision</>}
                  </button>
                </form>
              )}

              {/* Update draft outcome */}
              {canEditDraft && a.status === 'REVIEWED' && (
                <div className="border-top pt-3 mt-3">
                  <h4 className="h6 mb-2"><i className="bi bi-pencil me-1" />Update Draft Outcome</h4>
                  <div className="text-muted small mb-2">
                    Change the outcome before issuing the final decision.
                    Does <strong>not</strong> transition the appeal.
                  </div>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <select
                      className="form-select form-select-sm w-auto"
                      value={draftOutcome}
                      onChange={e => setDraftOutcome(e.target.value)}
                    >
                      <option value="">— select outcome —</option>
                      {REVIEW_OUTCOME.map(o => (
                        <option key={o} value={o}>{REVIEW_OUTCOME_LABELS[o] || o}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-outline-dark btn-sm"
                      onClick={updateDraft}
                      disabled={!draftOutcome || busy}
                    >
                      Update Draft
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="appeal-card mb-3">
        <SectionHead
          icon="bi-paperclip"
          title={`Documents (${docs.length})`}
        />
        <div className="appeal-card__body">
          {docs.length === 0 && !canUploadDoc ? (
            <EmptyState
              icon="bi-file-earmark"
              title="No documents attached"
              hint="The filer hasn't uploaded supporting documents yet."
            />
          ) : (
            <>
              {docs.length > 0 && (
                <div className="row g-2 mb-3">
                  {docs.map(d => (
                    <div className="col-12 col-md-6" key={d.documentId}>
                      <div className="appeal-doc h-100">
                        <DocIcon filename={d.originalFileName} />
                        <div className="appeal-doc__body">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="appeal-doc__title">{d.title}</span>
                            <span className="appeal-doc__type-pill">{d.type.replace('_', ' ')}</span>
                          </div>
                          {d.originalFileName && (
                            <div className="text-truncate text-muted small" title={d.originalFileName}>
                              {d.originalFileName}
                            </div>
                          )}
                          <div className="appeal-doc__meta">
                            <span><i className="bi bi-clock me-1" />{formatDateTime(d.uploadedDate)}</span>
                            <span><i className="bi bi-person me-1" />{d.uploadedBy}</span>
                          </div>
                          <div className="appeal-doc__actions mt-2">
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => downloadDoc(d.documentId, d.originalFileName)}
                            >
                              <i className="bi bi-download me-1" />Download
                            </button>
                            {canDeleteDoc && (
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => deleteDoc(d.documentId)}
                                disabled={busy}
                              >
                                <i className="bi bi-trash3 me-1" />Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {canUploadDoc && (
                <form onSubmit={uploadDoc} className="border-top pt-3">
                  <h4 className="h6 mb-3"><i className="bi bi-cloud-upload me-1" />Attach New Document</h4>
                  <div className="row g-3">
                    <div className="col-md-7">
                      <label className="form-label fw-semibold small">Title *</label>
                      <input
                        className="form-control"
                        value={uploadForm.title}
                        onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                        minLength={2}
                        maxLength={255}
                        required
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold small">Type *</label>
                      <select
                        className="form-select"
                        value={uploadForm.type}
                        onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}
                      >
                        {APPEAL_DOC_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  </div>

                  <div
                    className={`appeal-dropzone mt-3 ${dragOver ? 'appeal-dropzone--active' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="bi bi-cloud-arrow-up appeal-dropzone__icon" />
                    <div className="fw-semibold mt-2">
                      {uploadForm.file ? 'Click or drop to replace' : 'Click or drop a file here'}
                    </div>
                    <div className="appeal-dropzone__hint">
                      Max <strong>10 MB</strong> · Allowed: {UPLOAD_ALLOWED_EXTENSIONS.join(', ')}
                    </div>
                    {uploadForm.file && (
                      <div className="appeal-dropzone__file">
                        <i className="bi bi-file-earmark-check" />
                        {uploadForm.file.name}
                        <span className="text-muted small">
                          ({formatBytes(uploadForm.file.size)})
                        </span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept={UPLOAD_ACCEPT_ATTR}
                      onChange={e => onPickFile(e.target.files?.[0])}
                    />
                  </div>

                  <button
                    className="btn btn-dark mt-3"
                    disabled={busy || !uploadForm.title.trim() || !uploadForm.file}
                  >
                    {busy ? <><span className="spinner-border spinner-border-sm me-2" />Uploading...</> :
                      <><i className="bi bi-upload me-1" />Upload</>}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Audit trail */}
      {canViewAudit && (
        <div className="appeal-card mb-3">
          <SectionHead
            icon="bi-clock-history"
            title="Audit Trail"
            right={(
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowAudit(s => !s)}
              >
                {showAudit
                  ? <><i className="bi bi-chevron-up me-1" />Hide</>
                  : <><i className="bi bi-chevron-down me-1" />Show</>}
              </button>
            )}
          />
          {showAudit && (
            <div className="appeal-card__body">
              {audit.length === 0 ? (
                <EmptyState icon="bi-clock-history" title="No audit entries yet" />
              ) : (
                <div className="appeal-timeline">
                  {audit.map(row => {
                    const cfg = AUDIT_ICON[row.action] || { i: 'bi-circle', tone: 'review' }
                    return (
                      <div className="appeal-timeline__item" key={row.auditId}>
                        <span className={`appeal-timeline__dot appeal-timeline__dot--${cfg.tone}`}>
                          <i className={`bi ${cfg.i}`} />
                        </span>
                        <div className="appeal-timeline__head">
                          <span className="appeal-timeline__action">
                            {APPEAL_AUDIT_ACTIONS[row.action] || row.action}
                          </span>
                          <span className="appeal-timeline__when">
                            <i className="bi bi-clock me-1" />{formatDateTime(row.timestamp)}
                          </span>
                        </div>
                        <div className="appeal-timeline__meta">
                          <span><strong>By:</strong> {row.actorUserId}{row.actorRole && ` (${row.actorRole})`}</span>
                          {(row.fromStatus || row.toStatus) && (
                            <span><strong>Status:</strong> {row.fromStatus || '—'} → {row.toStatus || '—'}</span>
                          )}
                        </div>
                        {row.metadata && (
                          <div className="appeal-timeline__details">{row.metadata}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
