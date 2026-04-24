import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cases } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function FileCase() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({
    title: '',
    litigantId: user?.role === 'LITIGANT' ? user.email : '',
    lawyerId: '',
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await cases.file({
        title: form.title,
        litigantId: form.litigantId,
        lawyerId: form.lawyerId || null,
      })
      nav(`/cases/${res.caseId}`)
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="page-title h3 mb-0">File New Case</h1></div>
      <div className="card shadow-sm" style={{ maxWidth: 640 }}>
        <div className="card-body">
          {err && <div className="alert alert-danger py-2">{err}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Case Title</label>
              <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} minLength={3} maxLength={255} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Litigant ID (user email or id)</label>
              <input className="form-control" value={form.litigantId} onChange={e => setForm({ ...form, litigantId: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Lawyer ID (optional)</label>
              <input className="form-control" value={form.lawyerId} onChange={e => setForm({ ...form, lawyerId: e.target.value })} />
            </div>
            <button className="btn btn-dark" disabled={loading}>{loading ? 'Filing...' : 'File Case'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
