import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../../components/AppLayout.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'LITIGANT' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await register(form)
      setSuccess('Account created. Redirecting to sign in...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page d-flex align-items-center justify-content-center p-3">
      <div className="auth-card card shadow-lg border-0" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h1 className="h3 mb-1">Create Account</h1>
          <p className="text-muted mb-3">Register as a Litigant on CaseFlow</p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Full Name</label>
              <input className="form-control" value={form.name} onChange={update('name')} minLength={2} maxLength={100} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={update('email')} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Phone (10 digits)</label>
              <input className="form-control" value={form.phone} onChange={update('phone')} pattern="\d{10}" required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Password (min 6 chars)</label>
              <input className="form-control" type="password" value={form.password} onChange={update('password')} minLength={6} required />
            </div>
            <input type="hidden" value={form.role} />
            <button type="submit" className="btn btn-dark w-100" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <div className="d-flex justify-content-between mt-3 small">
            <Link to="/login" className="text-decoration-none">Already have an account?</Link>
            <Link to="/" className="text-decoration-none">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
