import apiClient from './client'

export const stationsAPI = {

  getAll: (params = {}) => {
    return apiClient.get('/stations/', { params })
  },

  getById: (id) => {
    return apiClient.get(`/stations/${id}/`)
  },

  getNearby: (params = {}) => {
    return apiClient.get('/stations/nearby/', { params })
  },
}