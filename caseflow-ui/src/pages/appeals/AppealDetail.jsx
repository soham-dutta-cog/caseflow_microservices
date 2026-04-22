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

  if (!a) return <div><div className="page-header"><h1 className="page-title">Appeal</h1></div>{err && <div className="alert alert-error">{err}</div>}<div className="card">Loading...</div></div>

  const isJudge = user?.role === 'JUDGE' || user?.role === 'ADMIN'

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Appeal #{a.appealId}</h1></div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <h3>Appeal Info</h3>
        <div className="form-grid">
          <div><strong>Case:</strong> <Link to={`/cases/${a.caseId}`}>#{a.caseId}</Link></div>
          <div><strong>Filed:</strong> {formatDate(a.filedDate)}</div>
          <div><strong>By user:</strong> {a.filedByUserId}</div>
          <div><strong>Status:</strong> <span className={`badge-pill ${statusBadgeClass(a.status)}`}>{a.status}</span></div>
        </div>
        <div style={{ marginTop: 10 }}><strong>Reason:</strong> {a.reason}</div>
      </div>

      {isJudge && !review && (
        <div className="card">
          <h3>Open Review</h3>
          <div className="flex-row">
            <input type="number" placeholder="Judge ID" value={judgeId} onChange={e => setJudgeId(e.target.value)} />
            <button className="btn btn-primary" onClick={openReview} disabled={!judgeId}>Open Review</button>
          </div>
        </div>
      )}

      {review && (
        <div className="card">
          <h3>Review</h3>
          <div className="form-grid">
            <div><strong>Review ID:</strong> #{review.reviewId}</div>
            <div><strong>Judge:</strong> {review.judgeId}</div>
            <div><strong>Date:</strong> {formatDate(review.reviewDate)}</div>
            <div><strong>Outcome:</strong> {review.outcome || '-'}</div>
          </div>
          {review.remarks && <div style={{ marginTop: 10 }}><strong>Remarks:</strong> {review.remarks}</div>}

          {isJudge && (!review.outcome || review.outcome === null) && (
            <form onSubmit={decide} style={{ marginTop: 18, borderTop: '1px solid #e9ecef', paddingTop: 16 }}>
              <h4>Issue Decision</h4>
              <div className="form-grid">
                <div className="form-row"><label>Judge ID</label><input type="number" value={judgeId} onChange={e => setJudgeId(e.target.value)} required /></div>
                <div className="form-row">
                  <label>Outcome</label>
                  <select value={decision.outcome} onChange={e => setDecision({ ...decision, outcome: e.target.value })}>
                    {REVIEW_OUTCOME.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row"><label>Remarks</label><textarea value={decision.remarks} onChange={e => setDecision({ ...decision, remarks: e.target.value })} /></div>
              <button className="btn btn-primary">Issue Decision</button>
            </form>
          )}

          {isJudge && review.outcome && (
            <div className="flex-row" style={{ marginTop: 14 }}>
              <label>Update Outcome:</label>
              <select value={newOutcome} onChange={e => setNewOutcome(e.target.value)}>
                <option value="">-- select --</option>
                {REVIEW_OUTCOME.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={updateOutcome} disabled={!newOutcome}>Update</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
