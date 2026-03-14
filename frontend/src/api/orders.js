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

  // Update order
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

  // Hide order
  hide: (id) => {
    return apiClient.post(`/orders/${id}/hide/`)
  },

  // Items sub-resource
  items: {
    create: (orderId, data) =>
      apiClient.post(`/orders/${orderId}/items/`, data),
  },

  // Notes sub-resource
  notes: {
    getAll: (orderId) =>
      apiClient.get(`/orders/${orderId}/notes/`),

    create: (orderId, data) =>
      apiClient.post(`/orders/${orderId}/notes/`, data),

    update: (orderId, noteId, data) =>
      apiClient.patch(`/orders/${orderId}/notes/${noteId}/`, data),

    delete: (orderId, noteId) =>
      apiClient.delete(`/orders/${orderId}/notes/${noteId}/`),
  },
}