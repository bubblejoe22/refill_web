import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage({ navigate }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleLogin = async () => {
    if (!form.username || !form.password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      await login(form.username, form.password)
      navigate('home')
    } catch {
      setError('Invalid username or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <button className="auth-back" onClick={() => navigate('welcome')}>← Back</button>
        <div className="auth-brand">💧 Refill Web</div>
        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>

        {error && <div className="login-error">{error}</div>}

        <div className="field">
          <label className="form-label">Username</label>
          <input className="text-inp" placeholder="Enter your username"
            value={form.username} onChange={set('username')}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <div className="field">
          <label className="form-label">Password</label>
          <input className="text-inp" type="password" placeholder="Enter your password"
            value={form.password} onChange={set('password')}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <button className="btn-primary full" onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="auth-switch">
          Don't have an account?{' '}
          <button className="link-btn" onClick={() => navigate('register')}>Create one</button>
        </p>
      </div>
    </div>
  )
}