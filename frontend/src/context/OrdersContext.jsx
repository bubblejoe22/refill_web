// =============================================================
// OrdersContext.jsx
// =============================================================
// Provides global CRUD operations for orders to the entire app.
// Any component that calls useOrders() gets access to:
//
//   CRUD: CREATE  → createOrder(payload)
//   CRUD: READ    → orders, fetchOrders()
//   CRUD: UPDATE  → updateOrder(id, payload), cancelOrder(id)
//   CRUD: DELETE  → deleteOrder(id)
//
// FORM VALIDATION errors from the server are returned from each
// function so the calling page can display them to the user.
// =============================================================

import { createContext, useContext, useState, useEffect } from 'react'
import { ordersAPI } from '../api/orders'
import { useAuth } from './AuthContext'

const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const { user } = useAuth()

  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)   // last API error message

  // ── CRUD: READ — fetch all orders for the logged-in user ────
  const fetchOrders = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const r    = await ordersAPI.getAll()
      const data = Array.isArray(r.data) ? r.data : r.data?.results || []
      setOrders(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch on login, clear on logout
  useEffect(() => {
    if (!user) { setOrders([]); return }
    fetchOrders()
  }, [user])

  // ── CRUD: CREATE — POST a new order to /api/orders/ ─────────
  // FORM VALIDATION: if the server returns 400, errors are returned
  // to the calling component (e.g. OrderPage) to show inline messages.
  const createOrder = async (payload) => {
    setError(null)
    try {
      const res      = await ordersAPI.create(payload)
      const newOrder = res.data
      // Prepend to local state so it appears immediately at top of list
      setOrders(prev => [newOrder, ...prev])
      return { success: true, data: newOrder }
    } catch (err) {
      // FORM VALIDATION errors from serializers.py come back as err.response.data
      const errors = err.response?.data || { detail: 'Failed to create order.' }
      setError(JSON.stringify(errors))
      return { success: false, errors }
    }
  }

  // ── CRUD: UPDATE — PATCH an existing order ──────────────────
  // Used by: status changes, address edits, note edits
  // FORM VALIDATION: validate_status() in serializers.py will reject
  // invalid status transitions and return a 400 with an error message.
  const updateOrder = async (id, payload) => {
    setError(null)
    try {
      const res     = await ordersAPI.update(id, payload)
      const updated = res.data
      // Replace the stale order in local state with the updated one
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)))
      return { success: true, data: updated }
    } catch (err) {
      // FORM VALIDATION errors returned here (e.g. invalid status transition)
      const errors = err.response?.data || { detail: 'Failed to update order.' }
      setError(JSON.stringify(errors))
      return { success: false, errors }
    }
  }

  // ── CRUD: UPDATE (special) — cancel an order ────────────────
  // Calls the dedicated /api/orders/{id}/cancel/ endpoint.
  const cancelOrder = async (id) => {
    setError(null)
    try {
      await ordersAPI.cancel(id)
      // Update local state to reflect cancelled status immediately
      setOrders(prev =>
        prev.map(o => (o.id === id ? { ...o, status: 'cancelled' } : o))
      )
      return { success: true }
    } catch (err) {
      const errors = err.response?.data || { detail: 'Failed to cancel order.' }
      setError(JSON.stringify(errors))
      return { success: false, errors }
    }
  }

  // ── CRUD: DELETE — remove an order ──────────────────────────
  const deleteOrder = async (id) => {
    setError(null)
    try {
      await ordersAPI.delete(id)
      // Remove from local state so the UI updates instantly
      setOrders(prev => prev.filter(o => o.id !== id))
      return { success: true }
    } catch (err) {
      const errors = err.response?.data || { detail: 'Failed to delete order.' }
      setError(JSON.stringify(errors))
      return { success: false, errors }
    }
  }

  // ── Legacy helper — kept for backwards compatibility ─────────
  // Older pages call addOrder() after a successful ordersAPI.create().
  // New pages should use createOrder() instead (handles errors too).
  const addOrder = (order) => setOrders(prev => [order, ...prev])

  return (
    <OrdersContext.Provider value={{
      // State
      orders,
      loading,
      error,
      // CRUD: READ
      fetchOrders,
      // CRUD: CREATE
      createOrder,
      addOrder,       // legacy
      // CRUD: UPDATE
      updateOrder,
      cancelOrder,
      // CRUD: DELETE
      deleteOrder,
      // Direct setter (escape hatch for complex pages)
      setOrders,
    }}>
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => useContext(OrdersContext)