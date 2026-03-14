import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken')
  if (token) config.headers['Authorization'] = `Token ${token}`
  return config
})

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      window.location.reload()
    }
    if (error.response?.status === 403) console.error('Permission denied')
    return Promise.reject(error)
  }
)

export default apiClient