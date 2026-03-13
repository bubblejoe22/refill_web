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

  // Soft-hide an order from the user's history
  hide: (id) => {
    return apiClient.post(`/orders/${id}/hide/`)
  },
}
