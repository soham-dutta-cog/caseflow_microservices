import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { notifications as notifApi } from '../api/services'
import './AppLayout.css'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
  { to: '/cases', label: 'Cases', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
  { to: '/cases/file', label: 'File New Case', roles: ['LITIGANT', 'LAWYER', 'CLERK', 'ADMIN'] },
  { to: '/cases/documents/pending', label: 'Pending Documents', roles: ['CLERK', 'ADMIN'] },
  { to: '/hearings', label: 'Hearings', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
  { to: '/hearings/schedule', label: 'Schedule Hearing', roles: ['CLERK', 'JUDGE', 'ADMIN'] },
  { to: '/hearings/slots', label: 'Judge Slots', roles: ['JUDGE', 'CLERK', 'ADMIN'] },
  { to: '/workflow', label: 'Workflow / SLA', roles: ['ADMIN', 'CLERK', 'JUDGE'] },
  { to: '/appeals', label: 'Appeals', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
  { to: '/appeals/file', label: 'File Appeal', roles: ['LITIGANT', 'LAWYER'] },
  { to: '/compliance', label: 'Compliance', roles: ['ADMIN', 'CLERK'] },
  { to: '/audits', label: 'Audits', roles: ['ADMIN'] },
  { to: '/notifications', label: 'Notifications', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
  { to: '/reports', label: 'Reports', roles: ['ADMIN', 'CLERK', 'LAWYER'] },
  { to: '/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/users/audit-logs', label: 'Audit Logs', roles: ['ADMIN'] },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    async function fetchUnread() {
      if (!user) return
      try {
        const res = await notifApi.count(user.email)
        if (active) setUnread(res?.unreadCount || 0)
      } catch { /* user id may not be numeric - ignore */ }
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 30000)
    return () => { active = false; clearInterval(t) }
  }, [user])

  const visibleNav = NAV.filter(n => !n.roles || n.roles.includes(user?.role))

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-layout d-flex">
      <aside className="app-sidebar d-flex flex-column">
        <div className="p-3 sidebar-divider">
          <Link to="/dashboard" className="app-brand d-block mb-2">⚖ CaseFlow</Link>
          <div className="fw-semibold small">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <nav className="nav nav-pills flex-column flex-grow-1 overflow-auto py-2">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `nav-link d-flex justify-content-between align-items-center ${isActive ? 'active' : ''}`}
            >
              <span>{item.label}</span>
              {item.to === '/notifications' && unread > 0 && (
                <span className="badge rounded-pill text-bg-danger">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 sidebar-divider d-flex flex-column gap-2">
          <Link to="/change-password" className="text-decoration-none small" style={{ color: '#94a5c5' }}>Change Password</Link>
          <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Logout</button>
        </div>
      </aside>
      <main className="app-main flex-grow-1">
        <Outlet />
      </main>
    </div>
  )
}
