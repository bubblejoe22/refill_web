import { createContext, useContext, useState } from 'react'
import axios from 'axios'
import apiClient from '../api/client'

const AuthContext = createContext(null)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (username, password) => {
    // Step 1: obtain JWT access + refresh tokens
    const tokenRes = await axios.post(`${API_BASE_URL}/auth/jwt/create/`, { username, password })
    const { access, refresh } = tokenRes.data

    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)

    // Step 2: fetch current user details (includes is_staff for RBAC)
    const userRes = await axios.get(`${API_BASE_URL}/auth/users/me/`, {
      headers: { Authorization: `Bearer ${access}` }
    })
    const { username: uname, email, is_staff } = userRes.data
    const userData = { username: uname, email, is_staff }

    localStorage.setItem('authUser', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = async () => {
    // Blacklist the refresh token on the server
    const refresh = localStorage.getItem('refreshToken')
    if (refresh) {
      try {
        await apiClient.post('/auth/jwt/blacklist/', { refresh })
      } catch { /* ignore — token may already be expired */ }
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('authUser')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)