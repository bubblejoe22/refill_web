import { createContext, useContext, useState } from 'react'
import apiClient from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  })


  const login = async (username, password) => {

    // Login to get token
    const res = await apiClient.post('/auth/token/login/', { username, password })
    const { auth_token } = res.data

    // Save token
    localStorage.setItem('authToken', auth_token)

    // Fetch user profile
    const userRes = await apiClient.get('/auth/users/me/')
    const userData = userRes.data

    // Save user
    localStorage.setItem('authUser', JSON.stringify(userData))
    setUser(userData)

    return userData
  }


  const logout = async () => {
    try {
      await apiClient.post('/auth/token/logout/')
    } catch {}

    localStorage.removeItem('authToken')
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