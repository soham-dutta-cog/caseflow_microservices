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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">Audit Logs {userId ? `— User ${userId}` : ''}</h1></div>
      <div className="card shadow-sm">
        <div className="card-body">
          {err && <div className="alert alert-danger py-2">{err}</div>}
          {loading ? <div className="text-center text-muted py-4">Loading...</div> : logs.length === 0 ? <div className="text-center text-muted py-4">No logs</div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light"><tr><th>ID</th><th>User ID</th><th>Action</th><th>Details</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={l.id || l.auditLogId || i}>
                      <td>{l.id || l.auditLogId || i}</td>
                      <td>{l.userId || '-'}</td>
                      <td>{l.action || l.event || '-'}</td>
                      <td>{l.details || l.description || '-'}</td>
                      <td>{formatDateTime(l.timestamp || l.createdAt || l.date)}</td>
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
