import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cases, hearings, appeals, workflow, notifications } from '../api/services'
import { statusBadgeClass, formatDate } from '../utils/constants'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ cases: 0, hearings: 0, appeals: 0, breached: 0 })
  const [recentCases, setRecentCases] = useState([])
  const [recentNotifs, setRecentNotifs] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [c, h, a, sla] = await Promise.allSettled([
          cases.list(),
          hearings.list(),
          appeals.paginated(0, 5),
          workflow.breached(),
        ])
        if (!active) return
        setStats({
          cases: c.status === 'fulfilled' ? (c.value?.length || 0) : 0,
          hearings: h.status === 'fulfilled' ? (h.value?.length || 0) : 0,
          appeals: a.status === 'fulfilled' ? (a.value?.totalElements || a.value?.content?.length || 0) : 0,
          breached: sla.status === 'fulfilled' ? (sla.value?.length || 0) : 0,
        })
        if (c.status === 'fulfilled') setRecentCases((c.value || []).slice(0, 5))
      } catch (e) { setErr(e.message) }
    }
    load()
    return () => { active = false }
  }, [user])

  const statCards = [
    { to: '/cases', label: 'Total Cases', value: stats.cases },
    { to: '/hearings', label: 'Hearings', value: stats.hearings },
    { to: '/appeals', label: 'Appeals', value: stats.appeals },
    { to: '/workflow', label: 'SLA Breached', value: stats.breached, danger: stats.breached > 0 },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Welcome, {user?.name}</h1>
        <span className="text-muted small">Role: {user?.role}</span>
      </div>
      {err && <div className="alert alert-danger py-2">{err}</div>}

      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div className="col-sm-6 col-lg-3" key={s.to}>
            <Link to={s.to} className="card shadow-sm text-decoration-none h-100">
              <div className="card-body">
                <div className="text-uppercase text-muted small fw-semibold" style={{ letterSpacing: '0.5px' }}>{s.label}</div>
                <div className="fs-2 fw-bold mt-1" style={{ color: s.danger ? '#f07068' : '#0f1629' }}>{s.value}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="h5 mb-3">Recent Cases</h3>
          {recentCases.length === 0 ? (
            <div className="text-center text-muted py-4">No cases yet. <Link to="/cases/file">File a case</Link></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr><th>ID</th><th>Title</th><th>Status</th><th>Filed</th><th></th></tr>
                </thead>
                <tbody>
                  {recentCases.map(c => (
                    <tr key={c.caseId}>
                      <td>#{c.caseId}</td>
                      <td>{c.title}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                      <td>{formatDate(c.filedDate)}</td>
                      <td><Link to={`/cases/${c.caseId}`} className="btn btn-outline-secondary btn-sm">View</Link></td>
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
