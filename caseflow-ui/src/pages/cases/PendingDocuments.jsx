import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cases } from '../../api/services'
import { formatDate } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function PendingDocuments() {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)

  const load = async () => {
    setLoading(true); setErr('')
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
      await cases.verifyDoc(d.documentId, { status, rejectionReason, clerkId: user.userId || user.email })
      setMsg(`Document ${status.toLowerCase()}`); load()
    } catch (e) { setErr(e.message) }
  }

  const downloadDoc = async (d) => {
    setDownloadingId(d.documentId); setErr('')
    try {
      const res = await cases.downloadDoc(d.documentId, user.role)
      if (!res.ok) throw new Error(`Download failed (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = d.originalFileName || `document_${d.documentId}`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setErr(e.message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title h3 mb-0">Pending Documents</h1>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
          <i className="bi bi-arrow-clockwise me-1" />Refresh
        </button>
      </div>
      {err && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-triangle me-2" />{err}</div>}
      {msg && <div className="alert alert-success py-2"><i className="bi bi-check-circle me-2" />{msg}</div>}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center text-muted py-4">Loading...</div>
          ) : docs.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-check2-circle display-4 d-block mb-3 opacity-25 text-success" />
              <p className="mb-0">Nothing pending — all caught up!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Case</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Uploaded</th>
                    <th>By</th>
                    <th style={{ minWidth: 320 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d.documentId}>
                      <td className="text-muted small">#{d.documentId}</td>
                      <td>
                        <Link to={`/cases/${d.caseId}`} className="fw-semibold">
                          Case #{d.caseId}
                        </Link>
                      </td>
                      <td>{d.title}</td>
                      <td>
                        <span className="badge text-bg-light border text-muted">{d.type}</span>
                      </td>
                      <td className="small text-nowrap text-muted">{formatDate(d.uploadedDate)}</td>
                      <td className="small text-muted">{d.uploadedBy}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <Link
                            to={`/cases/${d.caseId}`}
                            className="btn btn-outline-primary btn-sm"
                            title="Open the case to see context"
                          >
                            <i className="bi bi-folder2-open me-1" />Open Case
                          </Link>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            disabled={downloadingId === d.documentId}
                            onClick={() => downloadDoc(d)}
                            title="Download the document"
                          >
                            {downloadingId === d.documentId
                              ? <><span className="spinner-border spinner-border-sm me-1" />…</>
                              : <><i className="bi bi-download me-1" />Download</>}
                          </button>
                          <button className="btn btn-success btn-sm" onClick={() => verify(d, 'VERIFIED')}>
                            <i className="bi bi-check-lg me-1" />Verify
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => verify(d, 'REJECTED')}>
                            <i className="bi bi-x-lg me-1" />Reject
                          </button>
                        </div>
                      </td>
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
