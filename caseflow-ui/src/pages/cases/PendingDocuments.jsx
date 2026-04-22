import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cases } from '../../api/services'
import { statusBadgeClass, formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function PendingDocuments() {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await cases.pendingDocs()
      setDocs(data || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const verify = async (d, status) => {
    let rejectionReason = ''
    if (status === 'REJECTED') {
      rejectionReason = prompt('Reason for rejection?') || ''
      if (!rejectionReason) return
    }
    try {
      await cases.verifyDoc(d.documentId, { status, rejectionReason, clerkId: user.email })
      setMsg(`Document ${status.toLowerCase()}`); load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Pending Documents</h1></div>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        {loading ? <div className="empty">Loading...</div> : docs.length === 0 ? <div className="empty">Nothing pending</div> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Case</th><th>Title</th><th>Type</th><th>Uploaded</th><th>By</th><th>Actions</th></tr></thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.documentId}>
                  <td>#{d.documentId}</td>
                  <td><Link to={`/cases/${d.caseId}`}>#{d.caseId}</Link></td>
                  <td>{d.title}</td>
                  <td>{d.type}</td>
                  <td>{formatDate(d.uploadedDate)}</td>
                  <td>{d.uploadedBy}</td>
                  <td className="row-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => verify(d, 'VERIFIED')}>Verify</button>
                    <button className="btn btn-danger btn-sm" onClick={() => verify(d, 'REJECTED')}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
