import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'

export default function RegisterPage({ navigate }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleRegister = async () => {
    if (!form.username || !form.password) { setError('Username and password are required'); return }
    if (form.password !== form.confirm)   { setError('Passwords do not match'); return }
    if (form.password.length < 8)         { setError('Password must be at least 8 characters'); return }

    setLoading(true); setError('')
    try {
      await apiClient.post('/auth/users/', {
        username: form.username,
        email: form.email,
        password: form.password,
        re_password: form.confirm, 
      })

      navigate('login', { message: "Account created successfully. Please login." })
    } catch (e) {
      const data = e.response?.data
      if (data?.username) setError(`Username: ${data.username[0]}`)
      else if (data?.password) setError(`Password: ${data.password[0]}`)
      else setError('Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <button className="auth-back" onClick={() => navigate('welcome')}>← Back</button>
        <div className="auth-brand">💧 Refill Web</div>
        <h2>Create account</h2>
        <p className="auth-sub">Start ordering water today</p>

        {error && <div className="login-error">{error}</div>}

        <div className="field">
          <label className="form-label">Username</label>
          <input className="text-inp" placeholder="Choose a username"
            value={form.username} onChange={set('username')} />
        </div>
        <div className="field">
          <label className="form-label">Email <span className="opt-label">(optional)</span></label>
          <input className="text-inp" type="email" placeholder="your@email.com"
            value={form.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label className="form-label">Password</label>
          <input className="text-inp" type="password" placeholder="At least 8 characters"
            value={form.password} onChange={set('password')} />
        </div>
        <div className="field">
          <label className="form-label">Confirm Password</label>
          <input className="text-inp" type="password" placeholder="Repeat your password"
            value={form.confirm} onChange={set('confirm')}
            onKeyDown={e => e.key === 'Enter' && handleRegister()} />
        </div>

        <button className="btn-primary full" onClick={handleRegister} disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="auth-switch">
          Already have an account?{' '}
          <button className="link-btn" onClick={() => navigate('login')}>Sign in</button>
        </p>
      </div>
    </div>
  )
}