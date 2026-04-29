import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cases } from '../../api/services'
import { CASE_STATUS, statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function CaseList() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const isLitigant = user?.role === 'LITIGANT'

  const load = async () => {
    setLoading(true); setErr('')
    try {
      let data
      if (isLitigant) {
        // LITIGANT sees only their own cases
        data = await cases.byLitigant(encodeURIComponent(user.email))
        if (filter) data = (data || []).filter(c => c.status === filter)
      } else if (filter) {
        data = await cases.byStatus(filter)
      } else {
        data = await cases.list()
      }
      setList(data || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">{t('Cases')}</h1>
        {(user?.role === 'LITIGANT' || user?.role === 'LAWYER' || user?.role === 'CLERK') && (
          <Link to="/cases/file" className="btn btn-dark">+ {t('File Case')}</Link>
        )}
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
            <label className="form-label fw-semibold small mb-0">{t('Filter by status:')}</label>
            <select className="form-select form-select-sm w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">{t('All')}</option>
              {CASE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>{t('Refresh')}</button>
          </div>
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {loading ? <div className="text-center text-muted py-4">{t('Loading...')}</div> : list.length === 0 ? (
            <div className="text-center text-muted py-4">{t('No cases found')}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr><th>{t('ID')}</th><th>{t('Title')}</th><th>{t('Litigant')}</th><th>{t('Lawyer')}</th><th>{t('STATUS')}</th><th>{t('Filed')}</th><th></th></tr>
                </thead>
                <tbody>
                  {list.map(c => (
                    <tr key={c.caseId}>
                      <td>#{c.caseId}</td>
                      <td>{c.title}</td>
                      <td>{c.litigantId}</td>
                      <td>{c.lawyerId || '-'}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                      <td>{formatDate(c.filedDate)}</td>
                      <td><Link to={`/cases/${c.caseId}`} className="btn btn-outline-secondary btn-sm">{t('Open')}</Link></td>
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
