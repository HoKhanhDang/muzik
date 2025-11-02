/**
 * API Configuration Constants
 * Quản lý các API endpoints và cấu hình
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const API_ENDPOINTS = {
  VIDEOS: '/videos',
  PLAYLISTS: '/playlists',
  MUSIC: '/music',
  FILMS: '/films',
  MOVIES: '/movies',
  AUTH: '/auth',
}

export const getApiUrl = (endpoint) => {
  return `${API_BASE}${endpoint}`
}
