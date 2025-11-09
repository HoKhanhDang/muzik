/**
 * Music Service
 * Handle APIs related to music
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'
import { getCurrentUserId } from '../utils/user.js'

export const musicService = {
  /**
   * Get all music
   * @param {Object} params - { user_id? }
   * @returns {Promise<Array>} List of music
   */
  getAll: async (params = {}) => {
    // Automatically filter by user_id
    if (!params.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        params.user_id = userId
      }
    }
    return apiClient.get(API_ENDPOINTS.MUSIC, params)
  },

  /**
   * Get music by ID
   * @param {number|string} id - Music ID
   * @returns {Promise<Object>} Music object
   */
  getById: async (id) => {
    return apiClient.get(`${API_ENDPOINTS.MUSIC}/${id}`)
  },

  /**
   * Create new music
   * @param {Object} data - { title, artist?, audio_url?, thumbnail_url?, duration?, user_id? }
   * @returns {Promise<Object>} { id, message }
   */
  create: async (data) => {
    // Automatically add user_id if not present
    if (!data.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        data.user_id = userId
      }
    }
    return apiClient.post(API_ENDPOINTS.MUSIC, data)
  },

  /**
   * Update music
   * @param {number|string} id - Music ID
   * @param {Object} data - { title?, artist?, audio_url?, thumbnail_url?, duration? }
   * @returns {Promise<Object>} { message }
   */
  update: async (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.MUSIC}/${id}`, data)
  },

  /**
   * Delete music
   * @param {number|string} id - Music ID
   * @returns {Promise<Object>} { message }
   */
  delete: async (id) => {
    return apiClient.delete(`${API_ENDPOINTS.MUSIC}/${id}`)
  },
}

