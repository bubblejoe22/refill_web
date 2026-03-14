import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const r = await apiClient.get('/notifications/')
      const data = Array.isArray(r.data) ? r.data : r.data?.results || []
      setNotifications(data)
    } catch {

    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/`, { is_read: true })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark_all_read/')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch { /* silent */ }
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