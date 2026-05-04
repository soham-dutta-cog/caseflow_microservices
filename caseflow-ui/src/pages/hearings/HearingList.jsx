import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hearings } from '../../api/services'
import { HEARING_STATUS, statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function HearingList() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [filter, setFilter] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const data = filter ? await hearings.byStatus(filter) : await hearings.list()
      setList(data || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const canSchedule = ['CLERK', 'JUDGE', 'ADMIN'].includes(user?.role)

  const statusCounts = HEARING_STATUS.reduce((acc, s) => {
    acc[s] = list.filter(h => h.status === s).length
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title h3 mb-1">{t('Hearings')}</h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            {loading ? '...' : `${list.length} hearing${list.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        {canSchedule && (
          <Link
            to="/hearings/schedule"
            className="btn btn-dark d-flex align-items-center gap-2"
            style={{ borderRadius: 10, padding: '9px 18px', fontSize: 14 }}
          >
            <i className="bi bi-calendar-plus" />
            {t('Schedule Hearing')}
          </Link>
        )}
      </div>

      {err && <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: 10 }}>{err}</div>}

      {/* Status summary chips */}
      {!loading && list.length > 0 && (
        <div className="d-flex gap-2 flex-wrap mb-3">
          {HEARING_STATUS.map(s => statusCounts[s] > 0 && (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? 'btn-dark' : 'btn-outline-secondary'}`}
              style={{ borderRadius: 20, fontSize: 12, padding: '4px 14px' }}
              onClick={() => setFilter(filter === s ? '' : s)}
            >
              <span className={`badge rounded-pill me-1 ${statusBadgeClass(s)}`} style={{ fontSize: 10 }}>&nbsp;</span>
              {s} <span className="ms-1 fw-bold">{statusCounts[s]}</span>
            </button>
          ))}
          {filter && (
            <button
              className="btn btn-sm btn-link text-muted p-0 ps-1"
              style={{ fontSize: 12 }}
              onClick={() => setFilter('')}
            >
              <i className="bi bi-x-circle me-1" />Clear filter
            </button>
          )}
        </div>
      )}

      {/* Main card */}
      <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }}>
        <div className="card-body p-0">

          {/* Filter bar */}
          <div className="px-4 py-3 d-flex align-items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #f0f2f7' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-funnel text-muted" style={{ fontSize: 14 }} />
              <span className="text-muted fw-semibold" style={{ fontSize: 13 }}>{t('Filter by status:')}</span>
            </div>
            <select
              className="form-select form-select-sm w-auto"
              style={{ borderRadius: 8, fontSize: 13 }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="">{t('All Hearings')}</option>
              {HEARING_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              className="btn btn-sm btn-outline-secondary ms-auto d-flex align-items-center gap-1"
              style={{ borderRadius: 8, fontSize: 12 }}
              onClick={load}
            >
              <i className="bi bi-arrow-clockwise" />{t('Refresh')}
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm mb-2" role="status" />
              <div style={{ fontSize: 14 }}>{t('Loading hearings...')}</div>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x d-block mb-2" style={{ fontSize: 36, color: '#c9a84c', opacity: 0.6 }} />
              <div className="fw-semibold" style={{ color: '#0f1629' }}>{t('No hearings found')}</div>
              <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                {filter ? `No hearings with status "${filter}"` : 'No hearings have been scheduled yet.'}
              </div>
              {canSchedule && (
                <Link to="/hearings/schedule" className="btn btn-dark btn-sm mt-3" style={{ borderRadius: 8 }}>
                  <i className="bi bi-calendar-plus me-1" />Schedule one now
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f2f7' }}>
                    {['ID', 'CASE', 'JUDGE', 'DATE', 'TIME', 'STATUS', ''].map(h => (
                      <th key={h} className="text-muted fw-semibold px-4" style={{ fontSize: 11, letterSpacing: '0.04em', paddingTop: 12, paddingBottom: 12 }}>{t(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map(h => (
                    <tr key={h.hearingId} style={{ borderBottom: '1px solid #f8f9fc' }}>
                      <td className="px-4 fw-semibold" style={{ color: '#0f1629' }}>#{h.hearingId}</td>
                      <td className="px-4">
                        <Link to={`/cases/${h.caseId}`} style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 500 }}>
                          #{h.caseId}
                        </Link>
                      </td>
                      <td className="px-4 text-muted">{h.judgeId}</td>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-calendar3 text-muted" style={{ fontSize: 12 }} />
                          <span>{formatDate(h.hearingDate)}</span>
                        </div>
                      </td>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-clock text-muted" style={{ fontSize: 12 }} />
                          <span>{h.hearingTime}</span>
                        </div>
                      </td>
                      <td className="px-4">
                        <span className={`badge rounded-pill ${statusBadgeClass(h.status)}`} style={{ fontSize: 11 }}>
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4">
                        <Link
                          to={`/hearings/${h.hearingId}`}
                          className="btn btn-sm"
                          style={{ background: '#f4f6fa', borderRadius: 8, fontSize: 12, color: '#0f1629' }}
                        >
                          {t('Open')} <i className="bi bi-arrow-right ms-1" />
                        </Link>
                      </td>
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
