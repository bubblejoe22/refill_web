import apiClient from './client'

export const usersAPI = {
  getAll: () => {
    return apiClient.get('/auth/users/')
  },

  getCurrentUser: () => {
    return apiClient.get('/auth/users/me/')
  },

  getById: (id) => {
    return apiClient.get(`/auth/users/${id}/`)
  },

  getProfiles: () => {
    return apiClient.get('/auth/profiles/')
  },

  getMyProfile: () => {
    return apiClient.get('/auth/profiles/my_profile/')
  },

  getProfileById: (id) => {
    return apiClient.get(`/auth/profiles/${id}/`)
  },

  updateProfile: (id, data) => {
    return apiClient.patch(`/auth/profiles/${id}/`, data)
  },

  deleteProfile: (id) => {
    return apiClient.delete(`/auth/profiles/${id}/`)
  },
}
