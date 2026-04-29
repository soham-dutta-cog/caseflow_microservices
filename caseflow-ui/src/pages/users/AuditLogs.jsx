import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { users } from '../../api/services'
import { formatDateTime } from '../../utils/constants'

export default function AuditLogs() {
  const { userId } = useParams()
  const [logs, setLogs] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true); setErr('')
      try {
        const data = userId ? await users.auditLogsByUser(userId) : await users.auditLogs()
        setLogs(data || [])
      } catch (e) { setErr(e.message) } finally { setLoading(false) }
    }
    load()
  }, [userId])

  const uniqueUsers = new Set((logs || []).map(l => l.userId).filter(Boolean)).size

  const actionTone = (actionRaw) => {
    const action = String(actionRaw || '').toLowerCase()
    if (action.includes('delete') || action.includes('remove')) return { bg: 'rgba(240,112,104,0.12)', color: '#f07068' }
    if (action.includes('create') || action.includes('add')) return { bg: 'rgba(45,212,168,0.14)', color: '#149b77' }
    if (action.includes('update') || action.includes('edit')) return { bg: 'rgba(74,144,217,0.14)', color: '#3d7ec0' }
    return { bg: 'rgba(139,108,193,0.13)', color: '#8b6cc1' }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="page-title h3 mb-1">Audit Logs</h1>
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
          {userId ? `Showing activity for user ${userId}` : 'Showing platform-wide audit activity'}
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(74,144,217,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-list-check" style={{ color: '#4a90d9', fontSize: 18 }} />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Total Logs</div>
                <div className="fw-bold" style={{ fontSize: 22, color: '#0f1629', lineHeight: 1.2 }}>{logs.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(201,168,76,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-people" style={{ color: '#c9a84c', fontSize: 18 }} />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Users Involved</div>
                <div className="fw-bold" style={{ fontSize: 22, color: '#0f1629', lineHeight: 1.2 }}>{userId ? 1 : uniqueUsers}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }}>
        <div className="card-body p-0">
          <div className="px-4 py-3 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #eef1f6' }}>
            <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>Log Entries</h3>
          </div>

          <div className="p-4 pt-3">
            {err && <div className="alert alert-danger py-2">{err}</div>}
            {loading ? <div className="text-center text-muted py-4">Loading...</div> : logs.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="bi bi-journal-text d-block mb-2" style={{ fontSize: 34, opacity: 0.25 }} />
                No logs found
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#fafbfd' }}>
                      <th className="text-muted fw-semibold" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>ID</th>
                      <th className="text-muted fw-semibold" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>User ID</th>
                      <th className="text-muted fw-semibold" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Action</th>
                      <th className="text-muted fw-semibold" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Details</th>
                      <th className="text-muted fw-semibold" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l, i) => {
                      const action = l.action || l.event || '-'
                      const tone = actionTone(action)
                      return (
                        <tr key={l.id || l.auditLogId || i}>
                          <td className="text-muted" style={{ fontSize: 12 }}>#{l.id || l.auditLogId || i}</td>
                          <td>{l.userId || '-'}</td>
                          <td>
                            <span className="badge rounded-pill fw-semibold" style={{ background: tone.bg, color: tone.color, fontSize: 11 }}>
                              {action}
                            </span>
                          </td>
                          <td style={{ maxWidth: 420 }}>{l.details || l.description || '-'}</td>
                          <td className="text-muted">{formatDateTime(l.timestamp || l.createdAt || l.date)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
