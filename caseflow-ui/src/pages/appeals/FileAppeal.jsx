import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { appeals } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function FileAppeal() {
  const { user } = useAuth()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [form, setForm] = useState({
    caseId: sp.get('caseId') || '',
    filedByUserId: '',
    reason: '',
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await appeals.file({
        caseId: Number(form.caseId),
        filedByUserId: Number(form.filedByUserId),
        reason: form.reason,
      })
      nav(`/appeals/${res.appealId}`)
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">File Appeal</h1></div>
      <div className="card shadow-sm" style={{ maxWidth: 640 }}>
        <div className="card-body">
          {err && <div className="alert alert-danger py-2">{err}</div>}
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold small">Case ID</label><input className="form-control" type="number" value={form.caseId} onChange={e => setForm({ ...form, caseId: e.target.value })} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold small">Your User ID</label><input className="form-control" type="number" value={form.filedByUserId} onChange={e => setForm({ ...form, filedByUserId: e.target.value })} required /></div>
            </div>
            <div className="mt-3 mb-3">
              <label className="form-label fw-semibold small">Reason</label>
              <textarea className="form-control" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
            </div>
            <button className="btn btn-dark" disabled={loading}>{loading ? 'Filing...' : 'File Appeal'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
