import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cases, users, auth as authApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function FileCase() {
  const { user, setUser } = useAuth()
  const nav = useNavigate()
  const isLitigant = user?.role === 'LITIGANT'

  const [resolvedId, setResolvedId] = useState(user?.userId && !user.userId.includes('@') ? user.userId : '')
  const [idLoading, setIdLoading] = useState(false)
  const [idErr, setIdErr] = useState('')

  const [form, setForm] = useState({
    title: '',
    litigantId: '',
    lawyerId: '',
  })
  const [docs, setDocs] = useState([])
  const [lawyers, setLawyers] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Resolve the real userId from /api/auth/me if not in session or if session has email as userId
  useEffect(() => {
    let active = true
    async function resolveUserId() {
      if (user?.userId && !user.userId.includes('@')) {
        setResolvedId(user.userId)
        setForm(f => ({ ...f, litigantId: isLitigant ? user.userId : f.litigantId }))
        return
      }
      setIdLoading(true)
      try {
        const me = await authApi.me()
        if (!active) return
        const uid = me.userId
        setResolvedId(uid)
        if (isLitigant) setForm(f => ({ ...f, litigantId: uid }))
        if (user && setUser) setUser({ ...user, userId: uid })
      } catch (e) {
        if (active) setIdErr('Could not resolve your user ID: ' + (e?.message || 'Unknown error'))
      } finally {
        if (active) setIdLoading(false)
      }
    }
    resolveUserId()
    return () => { active = false }
  }, [])

  // Fetch lawyers for datalist suggestions
  useEffect(() => {
    let active = true
    users.byRole('LAWYER').then(data => { if (active) setLawyers(data || []) }).catch(() => {})
    return () => { active = false }
  }, [])

  const withLawyer = !!form.lawyerId

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await cases.file({
        title: form.title,
        litigantId: form.litigantId,
        lawyerId: form.lawyerId || null,
      })
      const caseId = res.caseId
      if (!withLawyer && docs.length > 0) {
        for (const file of docs) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('caseId', caseId)
          fd.append('uploadedBy', form.litigantId)
          await cases.uploadDoc(fd)
        }
      }
      nav(`/cases/${caseId}`)
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">File New Case</h1>
      </div>
      <div className="card shadow-sm" style={{ maxWidth: 640 }}>
        <div className="card-body">
          {err && <div className="alert alert-danger py-2">{err}</div>}
          <form onSubmit={submit}>

            {/* Case Title */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Case Title</label>
              <input
                className="form-control"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                minLength={3}
                maxLength={255}
                required
              />
            </div>

            {/* Litigant ID — auto-filled and read-only for LITIGANT role */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Litigant ID</label>
              {isLitigant ? (
                <>
                  <div className="input-group">
                    <input
                      className="form-control"
                      value={idLoading ? '' : (form.litigantId || '')}
                      readOnly
                      style={{ background: '#f4f6fa', cursor: 'not-allowed' }}
                      placeholder={idLoading ? 'Resolving your user ID…' : 'Your user ID'}
                      required
                    />
                    {idLoading && (
                      <span className="input-group-text">
                        <span className="spinner-border spinner-border-sm" />
                      </span>
                    )}
                  </div>
                  {!idLoading && form.litigantId && (
                    <div className="form-text text-success">
                      <i className="bi bi-check-circle me-1" />Your user ID <strong>{form.litigantId}</strong> has been filled in automatically.
                    </div>
                  )}
                  {!idLoading && idErr && (
                    <div className="form-text text-danger">
                      <i className="bi bi-exclamation-circle me-1" />{idErr} — Please log out and log back in.
                    </div>
                  )}
                </>
              ) : (
                <input
                  className="form-control"
                  value={form.litigantId}
                  onChange={e => setForm({ ...form, litigantId: e.target.value })}
                  placeholder="Enter litigant user ID"
                  required
                />
              )}
            </div>

            {/* Lawyer ID — text input with suggestions, optional */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">
                Lawyer ID <span className="text-muted fw-normal">(optional)</span>
              </label>
              <input
                className="form-control"
                value={form.lawyerId}
                onChange={e => setForm({ ...form, lawyerId: e.target.value.trim() })}
                placeholder="Enter lawyer's user ID (e.g. LAW_LAWYER_1)"
                list="lawyer-suggestions"
                autoComplete="off"
              />
              <datalist id="lawyer-suggestions">
                {lawyers.map(l => (
                  <option key={l.userId} value={l.userId}>{l.name} — {l.userId}</option>
                ))}
              </datalist>
              <div className="form-text text-muted">Leave blank to file without a lawyer.</div>
            </div>

            {/* Info banner */}
            {withLawyer ? (
              <div className="alert alert-info py-2 small mb-3">
                <i className="bi bi-info-circle me-1" />
                Your assigned lawyer will handle document uploads. Both you and your lawyer will receive notifications when the case status changes.
              </div>
            ) : (
              <div className="alert alert-secondary py-2 small mb-3">
                <i className="bi bi-person-check me-1" />
                You are filing without a lawyer. You will manage document uploads and receive all case notifications.
              </div>
            )}

            {/* Document upload — only when no lawyer */}
            {!withLawyer && (
              <div className="mb-3">
                <label className="form-label fw-semibold small">
                  Upload Documents <span className="text-muted fw-normal">(optional)</span>
                </label>
                <input
                  className="form-control"
                  type="file"
                  multiple
                  onChange={e => setDocs(Array.from(e.target.files))}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <div className="form-text text-muted">Accepted: PDF, Word, images. You can also upload more documents from the case page.</div>
              </div>
            )}

            <button className="btn btn-dark" disabled={loading || idLoading}>
              {loading ? 'Filing…' : 'File Case'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
