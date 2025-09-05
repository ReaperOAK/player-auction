import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  teamLogin: (credentials) => api.post('/auth/team/login', credentials),
  getTeams: () => api.get('/auth/teams'),
}

export const playersApi = {
  getAll: (params) => api.get('/players', { params }),
  getById: (id) => api.get(`/players/${id}`),
  create: (data) => api.post('/players', data),
  update: (id, data) => api.put(`/players/${id}`, data),
  delete: (id) => api.delete(`/players/${id}`),
  uploadCSV: (formData) => api.post('/players/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

export const teamsApi = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  getMyInfo: () => api.get('/teams/me/info'),
  getLeaderboard: () => api.get('/teams/leaderboard'),
}

export const auctionApi = {
  getState: () => api.get('/auction/state'),
  startAuction: (playerId, config) => api.post(`/auction/start/${playerId}`, config),
  pauseAuction: () => api.post('/auction/pause'),
  resumeAuction: () => api.post('/auction/resume'),
  endAuction: () => api.post('/auction/end'),
  placeBid: (bidAmount) => api.post('/auction/bid', { bidAmount }),
  getHistory: () => api.get('/auction/history'),
}

export default api
