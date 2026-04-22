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
      <div className="page-header"><h1 className="page-title">File New Case</h1></div>
      <div className="card" style={{ maxWidth: 640 }}>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Case Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} minLength={3} maxLength={255} required />
          </div>
          <div className="form-row">
            <label>Litigant ID (user email or id)</label>
            <input value={form.litigantId} onChange={e => setForm({ ...form, litigantId: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>Lawyer ID (optional)</label>
            <input value={form.lawyerId} onChange={e => setForm({ ...form, lawyerId: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Filing...' : 'File Case'}</button>
        </form>
      </div>
    </div>
  )
}
