import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { appeals } from '../../api/services'
import { APPEAL_STATUS, statusBadgeClass, formatDateTime } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import {
  PageHeader, StatCard, EmptyState, SkeletonList, SkeletonStats,
} from './appealsUi'
import './Appeals.css'

const SCOPE = { MY: 'MY', ALL: 'ALL' }

const STATUS_META = {
  SUBMITTED: { icon: 'bi-hourglass-split', hint: 'Awaiting judge' },
  REVIEWED:  { icon: 'bi-search',          hint: 'Under review' },
  DECIDED:   { icon: 'bi-check2-circle',   hint: 'Decision issued' },
  CANCELLED: { icon: 'bi-x-circle',        hint: 'Withdrawn' },
}

export default function AppealList() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const isPrivileged = ['ADMIN', 'CLERK', 'JUDGE'].includes(user?.role)
  const [scope, setScope] = useState(isPrivileged ? SCOPE.ALL : SCOPE.MY)
  const [statusFilter, setStatusFilter] = useState('')
  const [allRows, setAllRows] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const canFile    = ['LITIGANT', 'LAWYER', 'ADMIN'].includes(user?.role)
  const canSeeAll  = isPrivileged
  const canSeeMine = ['LITIGANT', 'LAWYER', 'ADMIN'].includes(user?.role)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      let data
      if (scope === SCOPE.MY)  data = await appeals.mine()
      else {
        const p = await appeals.paginated(0, 200)
        data = p?.content ?? p ?? []
      }
      setAllRows(Array.isArray(data) ? data : (data?.content || []))
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [scope])

  const counts = useMemo(() => {
    const out = { SUBMITTED: 0, REVIEWED: 0, DECIDED: 0, CANCELLED: 0 }
    for (const a of allRows) if (out[a.status] !== undefined) out[a.status]++
    return out
  }, [allRows])

  const visible = useMemo(
    () => statusFilter ? allRows.filter(a => a.status === statusFilter) : allRows,
    [allRows, statusFilter],
  )

  const cancelAppeal = async (id) => {
    if (!confirm(`Cancel appeal #${id}? This cannot be undone.`)) return
    setErr(''); setMsg('')
    try {
      await appeals.cancel(id)
      setMsg(`Appeal #${id} cancelled.`)
      load()
    } catch (e) { setErr(e.message) }
  }

  const isMyAppeal = (a) =>
    a.filedByUserId === user?.userId || a.filedByUserId === user?.email
  const canCancel = (a) =>
    (isMyAppeal(a) && a.status === 'SUBMITTED') ||
    (user?.role === 'ADMIN' && (a.status === 'SUBMITTED' || a.status === 'REVIEWED'))

  return (
    <div className="appeal-fade-in">
      <PageHeader
        title={t('Appeals')}
        subtitle={scope === SCOPE.MY
          ? t('Appeals you have filed.')
          : t('All appeals in the system.')}
        actions={(
          <>
            {(user?.role === 'JUDGE' || user?.role === 'ADMIN') && (
              <Link to="/appeals/reviews/my" className="btn btn-outline-light btn-sm">
                <i className="bi bi-gavel me-1" /> {t('My Reviews')}
              </Link>
            )}
            {isPrivileged && (
              <Link to="/appeals/reviews/judge" className="btn btn-outline-light btn-sm">
                <i className="bi bi-search me-1" /> {t('Lookup Judge')}
              </Link>
            )}
            {canFile && (
              <Link to="/appeals/file" className="btn btn-gold btn-sm">
                <i className="bi bi-plus-lg me-1" /> {t('File Appeal')}
              </Link>
            )}
          </>
        )}
      />

      {/* Stats strip */}
      {loading ? <SkeletonStats /> : (
        <div className="row g-3 mb-3">
          {APPEAL_STATUS.map(s => (
            <div className="col-6 col-md-3" key={s}>
              <StatCard
                status={s}
                count={counts[s] || 0}
                icon={STATUS_META[s].icon}
                hint={STATUS_META[s].hint}
                active={statusFilter === s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="appeal-card">
        {/* Toolbar */}
        <div className="appeal-card__head">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {(canSeeMine && canSeeAll) && (
              <div className="btn-group btn-group-sm" role="group" aria-label="Scope">
                <button
                  type="button"
                  className={`btn ${scope === SCOPE.MY ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => { setScope(SCOPE.MY); setStatusFilter('') }}
                >
                  <i className="bi bi-person me-1" /> {t('My Appeals')}
                </button>
                <button
                  type="button"
                  className={`btn ${scope === SCOPE.ALL ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => { setScope(SCOPE.ALL); setStatusFilter('') }}
                >
                  <i className="bi bi-list-ul me-1" /> {t('All')}
                </button>
              </div>
            )}
            {statusFilter && (
              <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                <i className="bi bi-funnel-fill" /> {statusFilter}
                <button
                  type="button"
                  className="btn-close btn-close-white btn-sm"
                  style={{ fontSize: 8 }}
                  aria-label="Clear filter"
                  onClick={() => setStatusFilter('')}
                />
              </span>
            )}
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" /> {t('Refresh')}
          </button>
        </div>

        <div className="appeal-card__body">
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {msg && <div className="alert alert-success py-2">{msg}</div>}

          {loading ? (
            <SkeletonList rows={4} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon="bi-inbox"
              title={scope === SCOPE.MY
                ? t("You haven't filed any appeals yet.")
                : t('No appeals found.')}
              hint={statusFilter
                ? `No appeals with status "${statusFilter}".`
                : (canFile ? t('Use "File Appeal" to start a new one.') : null)}
              cta={canFile && !statusFilter && (
                <Link to="/appeals/file" className="btn btn-gold btn-sm">
                  <i className="bi bi-plus-lg me-1" /> {t('File Appeal')}
                </Link>
              )}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="table-responsive appeal-table-desktop">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t('ID')}</th>
                      <th>{t('Case')}</th>
                      <th>{t('Filed By')}</th>
                      <th>{t('Filed On')}</th>
                      <th>{t('Reason')}</th>
                      <th>{t('Status')}</th>
                      <th className="text-end">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(a => (
                      <tr key={a.appealId}>
                        <td>#{a.appealId}</td>
                        <td><Link to={`/cases/${a.caseId}`}>#{a.caseId}</Link></td>
                        <td>{a.filedByUserId}</td>
                        <td>{formatDateTime(a.filedDate)}</td>
                        <td style={{ maxWidth: 320 }}>
                          <div className="text-truncate" title={a.reason}>{a.reason}</div>
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${statusBadgeClass(a.status)}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end flex-wrap">
                            <Link to={`/appeals/${a.appealId}`} className="btn btn-outline-secondary btn-sm">
                              {t('Open')}
                            </Link>
                            {canCancel(a) && (
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => cancelAppeal(a.appealId)}
                              >
                                {t('Cancel')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="appeal-mobile-card">
                {visible.map(a => (
                  <div key={a.appealId} className="appeal-row-card">
                    <div className="appeal-row-card__head">
                      <div className="appeal-row-card__id">Appeal #{a.appealId}</div>
                      <span className={`badge rounded-pill ${statusBadgeClass(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="appeal-row-card__row">
                      <strong>{t('Case')}</strong>
                      <Link to={`/cases/${a.caseId}`}>#{a.caseId}</Link>
                    </div>
                    <div className="appeal-row-card__row">
                      <strong>{t('Filed By')}</strong>
                      <span>{a.filedByUserId}</span>
                    </div>
                    <div className="appeal-row-card__row">
                      <strong>{t('Filed On')}</strong>
                      <span>{formatDateTime(a.filedDate)}</span>
                    </div>
                    <div className="appeal-row-card__row" style={{ alignItems: 'flex-start' }}>
                      <strong>{t('Reason')}</strong>
                      <span className="text-end" style={{ maxWidth: '70%' }}>{a.reason}</span>
                    </div>
                    <div className="appeal-row-card__actions">
                      <Link to={`/appeals/${a.appealId}`} className="btn btn-outline-secondary btn-sm">
                        <i className="bi bi-eye me-1" /> {t('Open')}
                      </Link>
                      {canCancel(a) && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => cancelAppeal(a.appealId)}
                        >
                          <i className="bi bi-x-lg me-1" /> {t('Cancel')}
                        </button>
                      )}
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
