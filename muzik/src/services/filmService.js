/**
 * Film Service
 * Xử lý các API liên quan đến films
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'

export const filmService = {
  /**
   * Lấy tất cả films
   * @param {Object} params - { user_id? }
   * @returns {Promise<Array>} Danh sách films
   */
  getAll: async (params = {}) => {
    return apiClient.get(API_ENDPOINTS.FILMS, params)
  },

  /**
   * Lấy film theo ID
   * @param {number|string} id - Film ID
   * @returns {Promise<Object>} Film object
   */
  getById: async (id) => {
    return apiClient.get(`${API_ENDPOINTS.FILMS}/${id}`)
  },

  /**
   * Tạo film mới
   * @param {Object} data - { title, director?, genre?, year?, description?, thumbnail_url?, duration?, video_url?, user_id? }
   * @returns {Promise<Object>} { id, message }
   */
  create: async (data) => {
    return apiClient.post(API_ENDPOINTS.FILMS, data)
  },

  /**
   * Cập nhật film
   * @param {number|string} id - Film ID
   * @param {Object} data - { title?, director?, genre?, year?, description?, thumbnail_url?, duration?, video_url? }
   * @returns {Promise<Object>} { message }
   */
  update: async (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.FILMS}/${id}`, data)
  },

  /**
   * Xóa film
   * @param {number|string} id - Film ID
   * @returns {Promise<Object>} { message }
   */
  delete: async (id) => {
    return apiClient.delete(`${API_ENDPOINTS.FILMS}/${id}`)
  },
}

