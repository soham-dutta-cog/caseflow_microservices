import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cases, hearings, appeals, workflow, notifications } from '../api/services'
import { statusBadgeClass, formatDate } from '../utils/constants'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ cases: 0, hearings: 0, appeals: 0, breached: 0 })
  const [recentCases, setRecentCases] = useState([])
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
    { to: '/cases', label: 'Total Cases', value: stats.cases, icon: 'bi-folder2-open', gradient: 'linear-gradient(135deg, #4a90d9, #6baaf0)' },
    { to: '/hearings', label: 'Hearings', value: stats.hearings, icon: 'bi-calendar-event', gradient: 'linear-gradient(135deg, #c9a84c, #d4b865)' },
    { to: '/appeals', label: 'Appeals', value: stats.appeals, icon: 'bi-arrow-repeat', gradient: 'linear-gradient(135deg, #8b6cc1, #a88ad4)' },
    { to: '/workflow', label: 'SLA Breached', value: stats.breached, icon: 'bi-exclamation-triangle', gradient: 'linear-gradient(135deg, #f07068, #f4918b)', danger: stats.breached > 0 },
  ]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      {/* Header with greeting */}
      <div className="mb-4">
        <h1 className="page-title h3 mb-1">{greeting()}, {user?.name}</h1>
        <p className="text-muted mb-0" style={{ fontSize: 14 }}>Here's what's happening with your cases today.</p>
      </div>

      {err && <div className="alert alert-danger py-2">{err}</div>}

      {/* Stat cards - new design with icon + gradient accent */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div className="col-6 col-lg-3" key={s.to}>
            <Link to={s.to} className="text-decoration-none">
              <div className="card border-0 h-100" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,14,26,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(10,14,26,0.06)' }}>
                <div className="card-body d-flex align-items-center gap-3 p-3">
                  <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{
                    width: 44, height: 44, borderRadius: 10, background: s.gradient
                  }}>
                    <i className={`bi ${s.icon} text-white`} style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <div className="text-muted fw-medium" style={{ fontSize: 12, letterSpacing: '0.03em' }}>{s.label}</div>
                    <div className="fw-bold" style={{ fontSize: 24, lineHeight: 1.2, color: s.danger ? '#f07068' : '#0f1629' }}>{s.value}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Quick actions row */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="d-flex flex-wrap gap-2">
            {user?.role && ['LITIGANT', 'LAWYER', 'CLERK', 'ADMIN'].includes(user.role) && (
              <Link to="/cases/file" className="btn btn-sm fw-medium" style={{ background: '#0f1629', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13 }}>
                <i className="bi bi-plus-circle me-1" /> File New Case
              </Link>
            )}
            {['CLERK', 'JUDGE', 'ADMIN'].includes(user?.role) && (
              <Link to="/hearings/schedule" className="btn btn-sm btn-outline-dark fw-medium" style={{ borderRadius: 8, padding: '8px 16px', fontSize: 13 }}>
                <i className="bi bi-calendar-plus me-1" /> Schedule Hearing
              </Link>
            )}
            <Link to="/notifications" className="btn btn-sm btn-outline-dark fw-medium" style={{ borderRadius: 8, padding: '8px 16px', fontSize: 13 }}>
              <i className="bi bi-bell me-1" /> Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* Recent cases */}
      <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>Recent Cases</h3>
            <Link to="/cases" className="small fw-medium" style={{ color: '#c9a84c', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentCases.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-folder2-open d-block mb-2" style={{ fontSize: 32, opacity: 0.3 }} />
              <span>No cases yet. </span><Link to="/cases/file" style={{ color: '#c9a84c' }}>File your first case</Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f2f7' }}>
                    <th className="text-muted fw-semibold" style={{ fontSize: 12, letterSpacing: '0.04em' }}>ID</th>
                    <th className="text-muted fw-semibold" style={{ fontSize: 12, letterSpacing: '0.04em' }}>TITLE</th>
                    <th className="text-muted fw-semibold" style={{ fontSize: 12, letterSpacing: '0.04em' }}>STATUS</th>
                    <th className="text-muted fw-semibold" style={{ fontSize: 12, letterSpacing: '0.04em' }}>FILED</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map(c => (
                    <tr key={c.caseId}>
                      <td className="fw-medium">#{c.caseId}</td>
                      <td>{c.title}</td>
                      <td><span className={`badge rounded-pill ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                      <td className="text-muted">{formatDate(c.filedDate)}</td>
                      <td><Link to={`/cases/${c.caseId}`} className="btn btn-sm" style={{ background: '#f4f6fa', borderRadius: 8, fontSize: 12 }}>View</Link></td>
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
