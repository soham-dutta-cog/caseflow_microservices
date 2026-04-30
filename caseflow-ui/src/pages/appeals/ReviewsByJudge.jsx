import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { appeals } from '../../api/services'
import { formatDateTime } from '../../utils/constants'
import {
  PageHeader, OutcomeChip, EmptyState, StatCard, SkeletonList,
} from './appealsUi'
import './Appeals.css'

export default function ReviewsByJudge() {
  const [judgeId, setJudgeId] = useState('')
  const [list,    setList]    = useState(null)
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const search = async (e) => {
    e?.preventDefault()
    if (!judgeId.trim()) return
    setLoading(true); setErr(''); setList(null)
    try {
      const data = await appeals.reviewsByJudge(judgeId.trim())
      setList(Array.isArray(data) ? data : [])
    } catch (e) { setErr(e.message) }
    finally   { setLoading(false) }
  }

  const pending = useMemo(() => (list || []).filter(r => !r.outcome), [list])
  const decided = useMemo(() => (list || []).filter(r =>  r.outcome), [list])

  return (
    <div className="appeal-fade-in">
      <PageHeader
        title="Lookup Judge"
        subtitle="View every appeal review assigned to a judge — for capacity planning and recusal checks."
        actions={
          <Link to="/appeals" className="btn btn-outline-light btn-sm">
            <i className="bi bi-arrow-left me-1" /> Back to Appeals
          </Link>
        }
      />

      <div className="appeal-card mb-3">
        <div className="appeal-card__body">
          <form onSubmit={search} className="row g-3 align-items-end">
            <div className="col-md-9">
              <label className="form-label fw-semibold small">Judge ID</label>
              <input
                className="form-control"
                value={judgeId}
                onChange={e => setJudgeId(e.target.value)}
                placeholder="IAM judge id (e.g. JOH_JUDGE_1)"
                autoFocus
              />
            </div>
            <div className="col-md-3">
              <button className="btn btn-dark w-100" disabled={loading || !judgeId.trim()}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Searching...</> :
                  <><i className="bi bi-search me-1" />Search</>}
              </button>
            </div>
          </form>
          {err && <div className="alert alert-danger py-2 mt-3 mb-0">
            <i className="bi bi-exclamation-triangle me-1" />{err}
          </div>}
        </div>
      </div>

      {list !== null && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-md-4">
              <StatCard status="SUBMITTED" count={pending.length} icon="bi-hourglass-split" hint="Pending decisions" />
            </div>
            <div className="col-6 col-md-4">
              <StatCard status="DECIDED" count={decided.length} icon="bi-check2-circle" hint="Decided" />
            </div>
            <div className="col-12 col-md-4">
              <StatCard status="REVIEWED" count={list.length} icon="bi-collection" hint="Total assigned" />
            </div>
          </div>

          <div className="appeal-card">
            <div className="appeal-card__body">
              {loading ? <SkeletonList rows={4} /> : list.length === 0 ? (
                <EmptyState
                  icon="bi-clipboard-x"
                  title="No reviews found"
                  hint={<>Judge <strong>{judgeId}</strong> has no recorded reviews.</>}
                />
              ) : (
                <>
                  {/* Desktop */}
                  <div className="table-responsive appeal-table-desktop">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Review</th>
                          <th>Appeal</th>
                          <th>Case</th>
                          <th>Assigned</th>
                          <th>Outcome</th>
                          <th>Remarks</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map(r => (
                          <tr key={r.reviewId}>
                            <td>#{r.reviewId}</td>
                            <td><Link to={`/appeals/${r.appealId}`}>#{r.appealId}</Link></td>
                            <td><Link to={`/cases/${r.caseId}`}>#{r.caseId}</Link></td>
                            <td>{formatDateTime(r.reviewDate)}</td>
                            <td><OutcomeChip outcome={r.outcome} /></td>
                            <td className="small text-muted" style={{ maxWidth: 280 }}>
                              <div className="text-truncate" title={r.remarks}>{r.remarks || '—'}</div>
                            </td>
                            <td className="text-end">
                              <Link to={`/appeals/${r.appealId}`} className="btn btn-outline-secondary btn-sm">
                                <i className="bi bi-eye me-1" />Open
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="appeal-mobile-card">
                    {list.map(r => (
                      <div className="appeal-row-card" key={r.reviewId}>
                        <div className="appeal-row-card__head">
                          <div className="appeal-row-card__id">Review #{r.reviewId}</div>
                          <OutcomeChip outcome={r.outcome} />
                        </div>
                        <div className="appeal-row-card__row">
                          <strong>Appeal</strong>
                          <Link to={`/appeals/${r.appealId}`}>#{r.appealId}</Link>
                        </div>
                        <div className="appeal-row-card__row">
                          <strong>Case</strong>
                          <Link to={`/cases/${r.caseId}`}>#{r.caseId}</Link>
                        </div>
                        <div className="appeal-row-card__row">
                          <strong>Assigned</strong>
                          <span>{formatDateTime(r.reviewDate)}</span>
                        </div>
                        {r.remarks && (
                          <div className="appeal-row-card__row" style={{ alignItems: 'flex-start' }}>
                            <strong>Remarks</strong>
                            <span className="text-end" style={{ maxWidth: '70%' }}>{r.remarks}</span>
                          </div>
                        )}
                        <div className="appeal-row-card__actions">
                          <Link to={`/appeals/${r.appealId}`} className="btn btn-outline-secondary btn-sm">
                            <i className="bi bi-eye me-1" />Open
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
