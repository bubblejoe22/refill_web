import apiClient from './client'

/**
 * Orders API Service
 */

export const ordersAPI = {
  // Get all orders (admin) or user's orders
  getAll: (params = {}) => {
    return apiClient.get('/orders/', { params })
  },

  // Get order by ID
  getById: (id) => {
    return apiClient.get(`/orders/${id}/`)
  },

  // Create new order
  create: (data) => {
    return apiClient.post('/orders/', data)
  },

  // Update order (status, etc.)
  update: (id, data) => {
    return apiClient.patch(`/orders/${id}/`, data)
  },

  // Delete order
  delete: (id) => {
    return apiClient.delete(`/orders/${id}/`)
  },

  // Update order status
  updateStatus: (id, status) => {
    return apiClient.patch(`/orders/${id}/`, { status })
  },

  // Cancel order
  cancel: (id) => {
    return apiClient.post(`/orders/${id}/cancel/`)
  },

  // ── OrderNote CRUD (nested under /api/orders/{orderId}/notes/) ──
  notes: {
    // READ — fetch all notes for an order
    getAll: (orderId) =>
      apiClient.get(`/orders/${orderId}/notes/`),

    // CREATE — add a new note to an order
    create: (orderId, data) =>
      apiClient.post(`/orders/${orderId}/notes/`, data),

    // UPDATE — edit an existing note
    update: (orderId, noteId, data) =>
      apiClient.patch(`/orders/${orderId}/notes/${noteId}/`, data),

    // DELETE — remove a note
    delete: (orderId, noteId) =>
      apiClient.delete(`/orders/${orderId}/notes/${noteId}/`),
  },
}