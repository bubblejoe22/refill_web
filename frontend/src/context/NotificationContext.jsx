// COMPLIANCE (Lab 4 - Task 1): State management for real system data (Notifications/Auth)

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { user } = useAuth()  // tied to auth state — not raw localStorage
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(false)

  const fetchNotifications = useCallback(async () => {
    // Guard: never fetch when not logged in
    if (!user) return

    setLoading(true)
    try {
      const r    = await apiClient.get('/notifications/')
      const data = Array.isArray(r.data) ? r.data : r.data?.results || []
      setNotifications(data)
    } catch (err) {
      // 401 is already handled globally by the Axios interceptor (clears token + redirects)
      // Don't log 401 here — it creates noise and the interceptor handles it
      if (err.response?.status !== 401) {
        console.error('Notifications fetch failed:', err.response?.status)
      }
    } finally {
      setLoading(false)
    }
  }, [user])  // rebuilds only when user changes (login / logout)

  useEffect(() => {
    if (!user) {
      setNotifications([])       // clear stale notifications on logout
      return
    }

    fetchNotifications()         // initial fetch on login

    // Poll every 30 s — interval is cleared automatically on logout or unmount
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications, user])

  const markRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/`, { is_read: true })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (err) {
      if (err.response?.status !== 401)
        console.error('Mark read failed:', err.response?.status)
    }
  }

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark_all_read/')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      if (err.response?.status !== 401)
        console.error('Mark all read failed:', err.response?.status)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markRead,
      markAllRead,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider')
  return ctx
}