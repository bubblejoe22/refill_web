import apiClient from './client'

export const productsAPI = {

  getAll: (params = {}) => {
    return apiClient.get('/products/', { params })
  },

  getById: (id) => {
    return apiClient.get(`/products/${id}/`)
  },

  create: (data) => {
    return apiClient.post('/products/', data)
  },

  update: (id, data) => {
    return apiClient.patch(`/products/${id}/`, data)
  },

  delete: (id) => {
    return apiClient.delete(`/products/${id}/`)
  },

  getCategories: () => {
    return apiClient.get('/products/categories/')
  },

  getCategoryById: (id) => {
    return apiClient.get(`/products/categories/${id}/`)
  },

  createCategory: (data) => {
    return apiClient.post('/products/categories/', data)
  },

  updateCategory: (id, data) => {
    return apiClient.patch(`/products/categories/${id}/`, data)
  },

  deleteCategory: (id) => {
    return apiClient.delete(`/products/categories/${id}/`)
  },
}
