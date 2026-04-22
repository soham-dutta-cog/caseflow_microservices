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
      <div className="page-header"><h1 className="page-title">File Appeal</h1></div>
      <div className="card" style={{ maxWidth: 640 }}>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-row"><label>Case ID</label><input type="number" value={form.caseId} onChange={e => setForm({ ...form, caseId: e.target.value })} required /></div>
            <div className="form-row"><label>Your User ID</label><input type="number" value={form.filedByUserId} onChange={e => setForm({ ...form, filedByUserId: e.target.value })} required /></div>
          </div>
          <div className="form-row">
            <label>Reason</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Filing...' : 'File Appeal'}</button>
        </form>
      </div>
    </div>
  )
}
