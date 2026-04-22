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
      <div className="page-header"><h1 className="page-title">Audit Logs {userId ? `— User ${userId}` : ''}</h1></div>
      <div className="card">
        {err && <div className="alert alert-error">{err}</div>}
        {loading ? <div className="empty">Loading...</div> : logs.length === 0 ? <div className="empty">No logs</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>User ID</th><th>Action</th><th>Details</th><th>Timestamp</th></tr></thead>
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
        )}
      </div>
    </div>
  )
}
