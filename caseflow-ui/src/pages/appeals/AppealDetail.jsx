import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { appeals } from '../../api/services'
import { REVIEW_OUTCOME, statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function AppealDetail() {
  const { appealId } = useParams()
  const { user } = useAuth()
  const [a, setA] = useState(null)
  const [review, setReview] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [judgeId, setJudgeId] = useState('')
  const [decision, setDecision] = useState({ outcome: 'UPHELD', remarks: '' })
  const [newOutcome, setNewOutcome] = useState('')

  const load = async () => {
    setErr('')
    try {
      const appeal = await appeals.get(appealId)
      setA(appeal)
      try { setReview(await appeals.getReview(appealId)) } catch { setReview(null) }
    } catch (e) { setErr(e.message) }
  }

  useEffect(() => { load() }, [appealId])

  const openReview = async () => {
    setErr(''); setMsg('')
    try { await appeals.openReview(appealId, Number(judgeId)); setMsg('Review opened'); load() } catch (e) { setErr(e.message) }
  }

  const decide = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      await appeals.decide(appealId, Number(judgeId), decision)
      setMsg('Decision issued'); load()
    } catch (e) { setErr(e.message) }
  }

  const updateOutcome = async () => {
    if (!review || !newOutcome) return
    try { await appeals.updateOutcome(review.reviewId, { outcome: newOutcome }); setMsg('Outcome updated'); load() } catch (e) { setErr(e.message) }
  }

  if (!a) return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Appeal</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      <div className="card shadow-sm"><div className="card-body">Loading...</div></div>
    </div>
  )

  const isJudge = user?.role === 'JUDGE' || user?.role === 'ADMIN'

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Appeal #{a.appealId}</h1></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h3 className="h5 mb-3">Appeal Info</h3>
          <div className="row g-3">
            <div className="col-md-6"><strong>Case:</strong> <Link to={`/cases/${a.caseId}`}>#{a.caseId}</Link></div>
            <div className="col-md-6"><strong>Filed:</strong> {formatDate(a.filedDate)}</div>
            <div className="col-md-6"><strong>By user:</strong> {a.filedByUserId}</div>
            <div className="col-md-6"><strong>Status:</strong> <span className={`badge rounded-pill ${statusBadgeClass(a.status)}`}>{a.status}</span></div>
          </div>
          <div className="mt-3"><strong>Reason:</strong> {a.reason}</div>
        </div>
      </div>

      {isJudge && !review && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h3 className="h5 mb-3">Open Review</h3>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <input className="form-control form-control-sm w-auto" type="number" placeholder="Judge ID" value={judgeId} onChange={e => setJudgeId(e.target.value)} />
              <button className="btn btn-dark" onClick={openReview} disabled={!judgeId}>Open Review</button>
            </div>
          </div>
        </div>
      )}

      {review && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h3 className="h5 mb-3">Review</h3>
            <div className="row g-3">
              <div className="col-md-6"><strong>Review ID:</strong> #{review.reviewId}</div>
              <div className="col-md-6"><strong>Judge:</strong> {review.judgeId}</div>
              <div className="col-md-6"><strong>Date:</strong> {formatDate(review.reviewDate)}</div>
              <div className="col-md-6"><strong>Outcome:</strong> {review.outcome || '-'}</div>
            </div>
            {review.remarks && <div className="mt-3"><strong>Remarks:</strong> {review.remarks}</div>}

            {isJudge && (!review.outcome || review.outcome === null) && (
              <form onSubmit={decide} className="border-top pt-3 mt-3">
                <h4 className="h6 mb-3">Issue Decision</h4>
                <div className="row g-3">
                  <div className="col-md-6"><label className="form-label fw-semibold small">Judge ID</label><input className="form-control" type="number" value={judgeId} onChange={e => setJudgeId(e.target.value)} required /></div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Outcome</label>
                    <select className="form-select" value={decision.outcome} onChange={e => setDecision({ ...decision, outcome: e.target.value })}>
                      {REVIEW_OUTCOME.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-3 mb-3"><label className="form-label fw-semibold small">Remarks</label><textarea className="form-control" value={decision.remarks} onChange={e => setDecision({ ...decision, remarks: e.target.value })} /></div>
                <button className="btn btn-dark">Issue Decision</button>
              </form>
            )}

            {isJudge && review.outcome && (
              <div className="d-flex gap-2 align-items-center flex-wrap mt-3">
                <label className="form-label fw-semibold small mb-0">Update Outcome:</label>
                <select className="form-select form-select-sm w-auto" value={newOutcome} onChange={e => setNewOutcome(e.target.value)}>
                  <option value="">-- select --</option>
                  {REVIEW_OUTCOME.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <button className="btn btn-dark btn-sm" onClick={updateOutcome} disabled={!newOutcome}>Update</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
