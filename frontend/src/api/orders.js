import apiClient from './client'

export const ordersAPI = {
  getAll: (params = {}) => {
    return apiClient.get('/orders/', { params })
  },

  getById: (id) => {
    return apiClient.get(`/orders/${id}/`)
  },

  create: (data) => {
    return apiClient.post('/orders/', data)
  },

  update: (id, data) => {
    return apiClient.patch(`/orders/${id}/`, data)
  },

  delete: (id) => {
    return apiClient.delete(`/orders/${id}/`)
  },

  updateStatus: (id, status) => {
    return apiClient.patch(`/orders/${id}/`, { status })
  },

  hide: (id) => {
    return apiClient.post(`/orders/${id}/hide/`)
  },

  items: {
    create: (orderId, data) =>
      apiClient.post(`/orders/${orderId}/items/`, data),
  },

  notes: {
    getAll: (orderId) =>
      apiClient.get(`/orders/${orderId}/notes/`),

    create: (orderId, data) =>
      apiClient.post(`/orders/${orderId}/notes/`, data),

    update: (orderId, noteId, data) =>
      apiClient.patch(`/orders/${orderId}/notes/${noteId}/`, data),

    delete: (orderId, noteId) =>
      apiClient.delete(`/orders/${orderId}/notes/${noteId}/`),
  }
}