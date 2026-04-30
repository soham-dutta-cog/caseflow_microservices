import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { appeals } from '../../api/services'
import { formatDateTime } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import {
  PageHeader, OutcomeChip, EmptyState, StatCard, SkeletonList, SkeletonStats,
} from './appealsUi'
import './Appeals.css'

const TAB = { PENDING: 'PENDING', DECIDED: 'DECIDED', ALL: 'ALL' }

export default function MyReviews() {
  const { user } = useAuth()
  const [list, setList]       = useState([])
  const [tab, setTab]         = useState(TAB.PENDING)
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const data = await appeals.myReviews()
      setList(Array.isArray(data) ? data : [])
    } catch (e) { setErr(e.message) }
    finally   { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const pending = useMemo(() => list.filter(r => !r.outcome), [list])
  const decided = useMemo(() => list.filter(r =>  r.outcome), [list])
  const visible = tab === TAB.PENDING ? pending
                : tab === TAB.DECIDED ? decided
                : list

  return (
    <div className="appeal-fade-in">
      <PageHeader
        title="My Reviews"
        subtitle={user?.name
          ? `Appeals assigned to you, ${user.name}.`
          : 'Appeals assigned to you for review.'}
        actions={(
          <>
            <Link to="/appeals" className="btn btn-outline-light btn-sm">
              <i className="bi bi-arrow-left me-1" /> All Appeals
            </Link>
            <button className="btn btn-outline-light btn-sm" onClick={load}>
              <i className="bi bi-arrow-clockwise me-1" /> Refresh
            </button>
          </>
        )}
      />

      {/* Stats strip */}
      {loading ? <SkeletonStats /> : (
        <div className="row g-3 mb-3">
          <div className="col-6 col-md-4">
            <StatCard
              status="SUBMITTED"
              count={pending.length}
              icon="bi-hourglass-split"
              hint="Awaiting your decision"
              active={tab === TAB.PENDING}
              onClick={() => setTab(TAB.PENDING)}
            />
          </div>
          <div className="col-6 col-md-4">
            <StatCard
              status="DECIDED"
              count={decided.length}
              icon="bi-check2-circle"
              hint="Your past decisions"
              active={tab === TAB.DECIDED}
              onClick={() => setTab(TAB.DECIDED)}
            />
          </div>
          <div className="col-12 col-md-4">
            <StatCard
              status="REVIEWED"
              count={list.length}
              icon="bi-collection"
              hint="Total assigned to you"
              active={tab === TAB.ALL}
              onClick={() => setTab(TAB.ALL)}
            />
          </div>
        </div>
      )}

      <div className="appeal-card">
        <div className="appeal-card__body">
          {err && <div className="alert alert-danger py-2">{err}</div>}

          {loading ? <SkeletonList rows={4} /> : visible.length === 0 ? (
            <EmptyState
              icon="bi-clipboard-check"
              title={tab === TAB.PENDING ? 'No pending reviews' :
                     tab === TAB.DECIDED ? 'No reviews decided yet' :
                     'No reviews assigned to you'}
              hint={tab === TAB.PENDING ? 'You are all caught up — great work.' : null}
            />
          ) : (
            <>
              {/* Desktop table */}
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
                    {visible.map(r => (
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
                            {r.outcome ? 'View' : <><i className="bi bi-stamp me-1" />Decide</>}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="appeal-mobile-card">
                {visible.map(r => (
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
                        {r.outcome ? <><i className="bi bi-eye me-1" />View</> : <><i className="bi bi-stamp me-1" />Decide</>}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
