import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { appeals, cases } from '../../api/services'
import { formatDateTime } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { PageHeader } from './appealsUi'
import './Appeals.css'

const FILING_DEADLINE_DAYS = 90

export default function FileAppeal() {
  const { user } = useAuth()
  const [sp] = useSearchParams()
  const nav = useNavigate()

  const [form, setForm] = useState({
    caseId: sp.get('caseId') || '',
    reason: '',
  })
  const [caseInfo, setCaseInfo] = useState(null)
  const [caseErr, setCaseErr] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCaseErr(''); setCaseInfo(null)
    if (!form.caseId || isNaN(Number(form.caseId))) return
    setLookingUp(true)
    const id = Number(form.caseId)
    const t = setTimeout(async () => {
      try {
        const c = await cases.get(id)
        if (!cancelled) setCaseInfo(c)
      } catch (e) {
        if (!cancelled) setCaseErr(e.message)
      } finally {
        if (!cancelled) setLookingUp(false)
      }
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [form.caseId])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await appeals.file({
        caseId: Number(form.caseId),
        reason: form.reason.trim(),
      })
      nav(`/appeals/${res.appealId}`)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Pre-flight checks (advisory; backend always re-validates)
  const checks = (() => {
    if (!caseInfo) return null
    const isClosed = caseInfo.status === 'CLOSED'
    let withinDeadline = true, daysLeft = null
    if (isClosed && caseInfo.closedDate) {
      const closed = new Date(caseInfo.closedDate)
      const deadline = new Date(closed.getTime() + FILING_DEADLINE_DAYS * 86400000)
      withinDeadline = new Date() <= deadline
      daysLeft = Math.ceil((deadline - new Date()) / 86400000)
    }
    let ownership = true
    if (user?.role === 'LITIGANT') {
      ownership = caseInfo.litigantId === user.userId || caseInfo.litigantId === user.email
    } else if (user?.role === 'LAWYER') {
      ownership = caseInfo.lawyerId &&
        (caseInfo.lawyerId === user.userId || caseInfo.lawyerId === user.email)
    } else if (user?.role === 'ADMIN') {
      ownership = true
    }
    return { isClosed, withinDeadline, daysLeft, ownership }
  })()
  const allClear = checks && checks.isClosed && checks.withinDeadline && checks.ownership

  return (
    <div className="appeal-fade-in">
      <PageHeader
        title="File a New Appeal"
        subtitle={`Appeals can only be filed on CLOSED cases within ${FILING_DEADLINE_DAYS} days of being closed.`}
        actions={
          <Link to="/appeals" className="btn btn-outline-light btn-sm">
            <i className="bi bi-arrow-left me-1" /> Back to Appeals
          </Link>
        }
      />

      <div className="appeal-card" style={{ maxWidth: 760 }}>
        <div className="appeal-card__body">
          {err && <div className="alert alert-danger py-2">{err}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Case ID *</label>
              <div className="position-relative">
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={form.caseId}
                  onChange={e => setForm({ ...form, caseId: e.target.value })}
                  placeholder="e.g. 42"
                  required
                />
                {lookingUp && (
                  <span className="position-absolute" style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <span className="spinner-border spinner-border-sm text-secondary" />
                  </span>
                )}
              </div>
              {caseErr && <div className="form-text text-danger"><i className="bi bi-exclamation-triangle me-1" />{caseErr}</div>}
            </div>

            {caseInfo && checks && (
              <div className="appeal-preflight">
                <div className="appeal-preflight__title">
                  <i className="bi bi-shield-check me-1" />
                  Case #{caseInfo.caseId}: {caseInfo.title}
                </div>
                <div className="row g-2 mb-2 small text-muted">
                  <div className="col-6 col-md-3"><span className="d-block opacity-75">Status</span><strong>{caseInfo.status}</strong></div>
                  <div className="col-6 col-md-3"><span className="d-block opacity-75">Closed</span><strong>{formatDateTime(caseInfo.closedDate)}</strong></div>
                  <div className="col-6 col-md-3"><span className="d-block opacity-75">Litigant</span><strong>{caseInfo.litigantId}</strong></div>
                  <div className="col-6 col-md-3"><span className="d-block opacity-75">Lawyer</span><strong>{caseInfo.lawyerId || '—'}</strong></div>
                </div>
                <div className={`appeal-preflight__check ${checks.isClosed ? 'appeal-preflight__check--ok' : 'appeal-preflight__check--bad'}`}>
                  <i className={`bi ${checks.isClosed ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
                  Case is closed and eligible for appeal
                </div>
                {checks.isClosed && (
                  <div className={`appeal-preflight__check ${
                    checks.withinDeadline ? 'appeal-preflight__check--ok' : 'appeal-preflight__check--bad'
                  }`}>
                    <i className={`bi ${checks.withinDeadline ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
                    Within {FILING_DEADLINE_DAYS}-day filing window
                    {checks.daysLeft != null && checks.withinDeadline && (
                      <span className="text-muted ms-2">
                        ({checks.daysLeft} day{checks.daysLeft === 1 ? '' : 's'} remaining)
                      </span>
                    )}
                  </div>
                )}
                <div className={`appeal-preflight__check ${checks.ownership ? 'appeal-preflight__check--ok' : 'appeal-preflight__check--bad'}`}>
                  <i className={`bi ${checks.ownership ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
                  You are authorised to file an appeal for this case
                </div>
                {!allClear && (
                  <div className="mt-2 p-2 small rounded" style={{ background: 'rgba(240,112,104,0.08)', color: '#a02922' }}>
                    <i className="bi bi-info-circle me-1" />
                    Your submission will be rejected by the server. Resolve the issues above first.
                  </div>
                )}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold small">Reason for Appeal *</label>
              <textarea
                className="form-control"
                rows={6}
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder="Explain in detail why you are appealing this decision — points of law, factual errors, new evidence, etc."
                minLength={10}
                required
              />
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Be specific. This becomes part of the official record.</span>
                <span className={form.reason.length < 10 ? 'text-danger' : 'text-muted'}>
                  {form.reason.length} character{form.reason.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-dark"
                disabled={loading || !form.caseId || !form.reason.trim() || form.reason.length < 10}
              >
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Filing...</> :
                  <><i className="bi bi-check-circle me-1" /> File Appeal</>}
              </button>
              <Link to="/appeals" className="btn btn-outline-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
