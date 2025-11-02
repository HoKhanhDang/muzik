/**
 * Music Service
 * Xử lý các API liên quan đến music
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'
import { getCurrentUserId } from '../utils/user.js'

export const musicService = {
  /**
   * Lấy tất cả music
   * @param {Object} params - { user_id? }
   * @returns {Promise<Array>} Danh sách music
   */
  getAll: async (params = {}) => {
    // Tự động filter theo user_id
    if (!params.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        params.user_id = userId
      }
    }
    return apiClient.get(API_ENDPOINTS.MUSIC, params)
  },

  /**
   * Lấy music theo ID
   * @param {number|string} id - Music ID
   * @returns {Promise<Object>} Music object
   */
  getById: async (id) => {
    return apiClient.get(`${API_ENDPOINTS.MUSIC}/${id}`)
  },

  /**
   * Tạo music mới
   * @param {Object} data - { title, artist?, audio_url?, thumbnail_url?, duration?, user_id? }
   * @returns {Promise<Object>} { id, message }
   */
  create: async (data) => {
    // Tự động thêm user_id nếu chưa có
    if (!data.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        data.user_id = userId
      }
    }
    return apiClient.post(API_ENDPOINTS.MUSIC, data)
  },

  /**
   * Cập nhật music
   * @param {number|string} id - Music ID
   * @param {Object} data - { title?, artist?, audio_url?, thumbnail_url?, duration? }
   * @returns {Promise<Object>} { message }
   */
  update: async (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.MUSIC}/${id}`, data)
  },

  /**
   * Xóa music
   * @param {number|string} id - Music ID
   * @returns {Promise<Object>} { message }
   */
  delete: async (id) => {
    return apiClient.delete(`${API_ENDPOINTS.MUSIC}/${id}`)
  },
}

