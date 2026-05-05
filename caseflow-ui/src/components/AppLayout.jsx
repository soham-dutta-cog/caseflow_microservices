import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { notifications as notifApi } from '../api/services'
import './AppLayout.css'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
    ],
  },
  {
    label: 'Admin & Reports',
    items: [
      { to: '/compliance', label: 'Compliance', icon: 'bi-shield-check', roles: ['ADMIN', 'CLERK'] },
      { to: '/audits', label: 'Audits', icon: 'bi-clipboard-data', roles: ['ADMIN'] },
      { to: '/reports', label: 'Reports', icon: 'bi-bar-chart-line', roles: ['ADMIN', 'CLERK', 'LAWYER'] },
      { to: '/users', label: 'Users', icon: 'bi-people', roles: ['ADMIN'] },
      { to: '/users/audit-logs', label: 'Audit Logs', icon: 'bi-journal-text', roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Case Management',
    items: [
      { to: '/cases', label: 'Cases', icon: 'bi-folder2-open', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
      { to: '/cases/file', label: 'File Case', icon: 'bi-plus-circle', roles: ['LITIGANT'] },
      { to: '/cases/documents/pending', label: 'Pending Docs', icon: 'bi-file-earmark-check', roles: ['CLERK', 'ADMIN'] },
    ],
  },
  {
    label: 'Hearings',
    items: [
      { to: '/hearings', label: 'Hearings', icon: 'bi-calendar-event', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
      { to: '/hearings/schedule', label: 'Schedule', icon: 'bi-calendar-plus', roles: ['CLERK', 'JUDGE', 'ADMIN'] },
    ],
  },
  {
    label: 'Legal Process',
    items: [
      { to: '/appeals', label: 'Appeals', icon: 'bi-arrow-repeat', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
      { to: '/appeals/file', label: 'File Appeal', icon: 'bi-pencil-square', roles: ['LITIGANT', 'LAWYER', 'ADMIN'] },
      { to: '/appeals/reviews/my', label: 'My Reviews', icon: 'bi-gavel', roles: ['JUDGE'] },
      { to: '/appeals/reviews/judge', label: 'Lookup Judge', icon: 'bi-search', roles: ['CLERK', 'ADMIN'] },
      { to: '/workflow', label: 'Workflow / SLA', icon: 'bi-diagram-3', roles: ['ADMIN', 'CLERK', 'JUDGE'] },
    ],
  },
  {
    label: '',
    items: [
      { to: '/notifications', label: 'Notifications', icon: 'bi-bell', roles: ['ADMIN', 'CLERK', 'JUDGE', 'LAWYER', 'LITIGANT'] },
    ],
  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t, supportedLanguages } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    let active = true
    async function fetchUnread() {
      if (!user) return
      try {
        // Prefer the JWT-based "my" endpoint so it works regardless of whether the
        // user-id stored on the notification is an email or an IAM userId.
        let res
        try {
          res = await notifApi.myCount()
        } catch {
          res = await notifApi.count(user.userId || user.email)
        }
        const n = res?.unreadCount ?? res?.count ?? (Array.isArray(res) ? res.length : 0)
        if (active) setUnread(Number(n) || 0)
      } catch { /* ignore */ }
    }
    fetchUnread()
    // Poll every 5s while the tab is visible so the bell feels instant.
    // When the tab is hidden we slow to 60s to avoid burning quota / API hits.
    let interval = 5000
    let tick = setInterval(fetchUnread, interval)
    const reschedule = (newInterval) => {
      if (newInterval === interval) return
      clearInterval(tick)
      interval = newInterval
      tick = setInterval(fetchUnread, interval)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUnread()         // immediate refresh on tab return
        reschedule(5000)
      } else {
        reschedule(60000)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Cross-tab signal: any other tab can dispatch this event after performing
    // an action that creates a notification (e.g. file case, schedule hearing).
    // window.dispatchEvent(new Event('cf:notify-bump'))
    const onBump = () => fetchUnread()
    window.addEventListener('cf:notify-bump', onBump)

    // Also refresh on browser focus (covers the OS-level "tab clicked" case
    // where visibilitychange might not fire).
    window.addEventListener('focus', onBump)

    // Refresh when navigating to a different page in the SPA.
    return () => {
      active = false
      clearInterval(tick)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('cf:notify-bump', onBump)
      window.removeEventListener('focus', onBump)
    }
  }, [user])

  // When the user navigates between pages, refresh the badge once — covers
  // the common case of "perform an action -> get redirected -> bell should reflect it".
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        let res
        try { res = await notifApi.myCount() } catch { res = await notifApi.count(user.userId || user.email) }
        const n = res?.unreadCount ?? res?.count ?? (Array.isArray(res) ? res.length : 0)
        if (!cancelled) setUnread(Number(n) || 0)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [location.pathname, user])

  useEffect(() => { setDrawerOpen(false); setProfileOpen(false) }, [location])

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleGroups = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(n => !n.roles || n.roles.includes(user?.role)),
  })).filter(g => g.items.length > 0)

  const allItems = visibleGroups.flatMap(g => g.items)
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="app-shell" data-theme={theme}>
      {/* ===== TOP BAR ===== */}
      <header className="app-topbar">
        <div className="app-topbar__left">
          <button className="app-topbar__toggle" onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Toggle menu">
            <i className={`bi ${drawerOpen ? 'bi-x-lg' : 'bi-list'}`} style={{ fontSize: 20 }} />
          </button>
          <Link to="/dashboard" className="app-topbar__brand">
            <span className="app-topbar__brand-icon">⚖</span>
            <span className="app-topbar__brand-text">Case<span className="app-topbar__brand-accent">Flow</span></span>
          </Link>
        </div>

        {/* Desktop horizontal nav */}
        <nav className="app-topbar__nav">
          {allItems.slice(0, 8).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `app-topbar__navlink ${isActive ? 'app-topbar__navlink--active' : ''}`}
            >
              <i className={`bi ${item.icon}`} />
              <span>{t(item.label)}</span>
              {item.to === '/notifications' && unread > 0 && (
                <span className="app-topbar__inline-badge">{unread}</span>
              )}
            </NavLink>
          ))}
          {allItems.length > 8 && (
            <button className="app-topbar__navlink" onClick={() => setDrawerOpen(true)} style={{ border: 'none', background: 'none' }}>
              <i className="bi bi-three-dots" />
              <span>{t('More')}</span>
            </button>
          )}
        </nav>

        <div className="app-topbar__right">
          <NavLink
            to="/notifications"
            className="app-topbar__icon-btn"
            title={unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'Notifications'}
            style={{ position: 'relative' }}
          >
            {/* Animated bell when there are unread items so the user notices */}
            <i className={`bi ${unread > 0 ? 'bi-bell-fill' : 'bi-bell'}`}
               style={unread > 0 ? { color: '#dc3545' } : {}} />
            {unread > 0 && (
              <span
                className="app-topbar__notif-badge"
                style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#dc3545', color: '#fff',
                  borderRadius: 999, minWidth: 18, height: 18,
                  fontSize: 10, fontWeight: 700, lineHeight: '18px',
                  textAlign: 'center', padding: '0 5px',
                  boxShadow: '0 0 0 2px #fff', display: 'inline-block'
                }}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </NavLink>

          <div className="app-topbar__profile" ref={profileRef}>
            <button className="app-topbar__avatar-btn" onClick={() => setProfileOpen(!profileOpen)}>
              <span className="app-topbar__avatar">{initials}</span>
              <span className="app-topbar__uname">{user?.name}</span>
              <i className={`bi bi-chevron-${profileOpen ? 'up' : 'down'}`} style={{ fontSize: 11 }} />
            </button>
            {profileOpen && (
              <div className="app-topbar__dropdown">
                <div className="app-topbar__dd-header">
                  <div className="fw-semibold">{user?.name}</div>
                  <span className="app-topbar__role-pill">{user?.role}</span>
                </div>
                <hr className="my-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                {/* Settings toggle */}
                <button
                  className="app-topbar__dd-item"
                  onClick={() => setSettingsOpen(s => !s)}
                >
                  <i className="bi bi-gear me-2" />
                  {t('Settings')}
                  <i className={`bi bi-chevron-${settingsOpen ? 'up' : 'down'} ms-auto`} style={{ fontSize: 10 }} />
                </button>
                {settingsOpen && (
                  <div className="app-topbar__settings">
                    <div className="app-topbar__settings-row">
                      <span className="app-topbar__settings-label">{t('Theme')}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className={`app-topbar__theme-btn${theme === 'light' ? ' app-topbar__theme-btn--active' : ''}`}
                          onClick={() => setTheme('light')}
                        >
                          ☀ {t('Light')}
                        </button>
                        <button
                          className={`app-topbar__theme-btn${theme === 'dark' ? ' app-topbar__theme-btn--active' : ''}`}
                          onClick={() => setTheme('dark')}
                        >
                          ☾ {t('Dark')}
                        </button>
                      </div>
                    </div>
                    <div className="app-topbar__settings-row">
                      <span className="app-topbar__settings-label">{t('Language')}</span>
                      <select
                        className="app-topbar__lang-select"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                      >
                        {(supportedLanguages || []).map(l => (
                          <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <hr className="my-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                <Link to="/change-password" className="app-topbar__dd-item">
                  <i className="bi bi-key me-2" /> {t('Change Password')}
                </Link>
                <button onClick={handleLogout} className="app-topbar__dd-item app-topbar__dd-item--danger">
                  <i className="bi bi-box-arrow-right me-2" /> {t('Sign Out')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== OFFCANVAS DRAWER ===== */}
      <div className={`app-overlay ${drawerOpen ? 'app-overlay--show' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`app-drawer ${drawerOpen ? 'app-drawer--open' : ''}`}>
        <div className="app-drawer__head">
          <span className="app-drawer__head-title">{t('Navigation')}</span>
          <button className="app-drawer__close" onClick={() => setDrawerOpen(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <nav className="app-drawer__nav">
          {visibleGroups.map((group, gi) => (
            <div key={gi} className="app-drawer__section">
              {group.label && <div className="app-drawer__section-label">{t(group.label)}</div>}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) => `app-drawer__link ${isActive ? 'app-drawer__link--active' : ''}`}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{t(item.label)}</span>
                  {item.to === '/notifications' && unread > 0 && (
                    <span className="badge rounded-pill text-bg-danger ms-auto" style={{ fontSize: 10 }}>{unread}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="app-drawer__foot">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="app-topbar__avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials}</span>
            <div>
              <div className="fw-semibold" style={{ fontSize: 13 }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: '#94a5c5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline-light btn-sm w-100">
            <i className="bi bi-box-arrow-right me-1" /> {t('Sign Out')}
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
