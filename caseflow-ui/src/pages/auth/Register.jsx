import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="muted">Register as a Litigant on CaseFlow</p>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Full Name</label>
            <input value={form.name} onChange={update('name')} minLength={2} maxLength={100} required />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update('email')} required />
          </div>
          <div className="form-row">
            <label>Phone (10 digits)</label>
            <input value={form.phone} onChange={update('phone')} pattern="\d{10}" required />
          </div>
          <div className="form-row">
            <label>Password (min 6 chars)</label>
            <input type="password" value={form.password} onChange={update('password')} minLength={6} required />
          </div>
          <input type="hidden" value={form.role} />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <div className="links">
          <Link to="/login">Already have an account?</Link>
          <Link to="/">Home</Link>
        </div>
      </div>
    </div>
  )
}
