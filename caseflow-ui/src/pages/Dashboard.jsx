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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name}</h1>
        <span className="muted">Role: {user?.role}</span>
      </div>
      {err && <div className="alert alert-error">{err}</div>}

      <div className="stats-grid">
        <Link to="/cases" className="stat" style={{ textDecoration: 'none' }}>
          <div className="stat__label">Total Cases</div>
          <div className="stat__value">{stats.cases}</div>
        </Link>
        <Link to="/hearings" className="stat" style={{ textDecoration: 'none' }}>
          <div className="stat__label">Hearings</div>
          <div className="stat__value">{stats.hearings}</div>
        </Link>
        <Link to="/appeals" className="stat" style={{ textDecoration: 'none' }}>
          <div className="stat__label">Appeals</div>
          <div className="stat__value">{stats.appeals}</div>
        </Link>
        <Link to="/workflow" className="stat" style={{ textDecoration: 'none' }}>
          <div className="stat__label">SLA Breached</div>
          <div className="stat__value" style={{ color: stats.breached > 0 ? '#f07068' : undefined }}>{stats.breached}</div>
        </Link>
      </div>

      <div className="card">
        <h3>Recent Cases</h3>
        {recentCases.length === 0 ? (
          <div className="empty">No cases yet. <Link to="/cases/file">File a case</Link></div>
        ) : (
          <table className="table">
            <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Filed</th><th></th></tr></thead>
            <tbody>
              {recentCases.map(c => (
                <tr key={c.caseId}>
                  <td>#{c.caseId}</td>
                  <td>{c.title}</td>
                  <td><span className={`badge-pill ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                  <td>{formatDate(c.filedDate)}</td>
                  <td><Link to={`/cases/${c.caseId}`} className="btn btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
