/**
 * Authentication Service
 * Handle APIs related to authentication
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'

export const authService = {
  /**
   * Register new user
   * @param {Object} data - { email, password, username? }
   * @returns {Promise<Object>} { message, user, token }
   */
  register: async (data) => {
    const response = await apiClient.post(`${API_ENDPOINTS.AUTH}/register`, data)
    
    // Save token to localStorage
    if (response.token) {
      localStorage.setItem('token', response.token)
      if (response.user) {
        response.user.token = response.token
        localStorage.setItem('user', JSON.stringify(response.user))
      }
    }
    
    return response
  },

  /**
   * Login
   * @param {Object} data - { email, password }
   * @returns {Promise<Object>} { message, user, token }
   */
  login: async (data) => {
    const response = await apiClient.post(`${API_ENDPOINTS.AUTH}/login`, data)
    
    // Save token to localStorage
    if (response.token) {
      localStorage.setItem('token', response.token)
      if (response.user) {
        response.user.token = response.token
        localStorage.setItem('user', JSON.stringify(response.user))
      }
    }
    
    return response
  },

  /**
   * Get current user's profile information
   * @param {number} userId - User ID (optional, if not provided, get from token)
   * @returns {Promise<Object>} User profile
   */
  getProfile: async (userId = null) => {
    const endpoint = userId 
      ? `${API_ENDPOINTS.AUTH}/profile/${userId}`
      : `${API_ENDPOINTS.AUTH}/profile`
    
    return apiClient.get(endpoint)
  },

  /**
   * Logout (remove token and user data)
   */
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  },
}

