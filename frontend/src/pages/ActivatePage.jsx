import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ActivatePage({ uid, token, navigate }) {
  const { logout } = useAuth()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    // Clear any existing session so activation always lands on login
    logout()

    apiClient.post('/auth/users/activation/', { uid, token })
      .then(() => {
        setStatus('success')
        setTimeout(() => navigate('login'), 3000)
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f4ff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💧</div>
        <h2 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>Refill Web</h2>

        {status === 'loading' && (
          <>
            <p style={{ color: '#555', fontSize: '16px' }}>Activating your account...</p>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e0e0e0',
              borderTop: '4px solid #1a73e8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '20px auto'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', margin: '16px 0' }}>✅</div>
            <h3 style={{ color: '#1a73e8', margin: '0 0 8px' }}>Account Activated!</h3>
            <p style={{ color: '#555', fontSize: '15px' }}>
              Your account has been successfully activated.
              Redirecting to login in 3 seconds...
            </p>
            <button
              onClick={() => navigate('login')}
              style={{
                marginTop: '24px',
                padding: '12px 32px',
                backgroundColor: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', margin: '16px 0' }}>❌</div>
            <h3 style={{ color: '#e53935', margin: '0 0 8px' }}>Activation Failed</h3>
            <p style={{ color: '#555', fontSize: '15px' }}>
              The activation link is invalid or has already been used.
              Please register again.
            </p>
            <button
              onClick={() => navigate('register')}
              style={{
                marginTop: '24px',
                padding: '12px 32px',
                backgroundColor: '#e53935',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Back to Register
            </button>
          </>
        )}
      </div>
    </div>
  )
}