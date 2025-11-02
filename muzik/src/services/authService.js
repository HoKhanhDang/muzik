/**
 * Authentication Service
 * Xử lý các API liên quan đến authentication
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'

export const authService = {
  /**
   * Đăng ký user mới
   * @param {Object} data - { email, password, username? }
   * @returns {Promise<Object>} { message, user, token }
   */
  register: async (data) => {
    const response = await apiClient.post(`${API_ENDPOINTS.AUTH}/register`, data)
    
    // Lưu token vào localStorage
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
   * Đăng nhập
   * @param {Object} data - { email, password }
   * @returns {Promise<Object>} { message, user, token }
   */
  login: async (data) => {
    const response = await apiClient.post(`${API_ENDPOINTS.AUTH}/login`, data)
    
    // Lưu token vào localStorage
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
   * Lấy thông tin profile của user hiện tại
   * @param {number} userId - User ID (optional, nếu không có thì lấy từ token)
   * @returns {Promise<Object>} User profile
   */
  getProfile: async (userId = null) => {
    const endpoint = userId 
      ? `${API_ENDPOINTS.AUTH}/profile/${userId}`
      : `${API_ENDPOINTS.AUTH}/profile`
    
    return apiClient.get(endpoint)
  },

  /**
   * Đăng xuất (xóa token và user data)
   */
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  },
}

