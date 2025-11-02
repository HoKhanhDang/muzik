/**
 * Playlist Service
 * Xử lý các API liên quan đến playlists
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'
import { getCurrentUserId } from '../utils/user.js'

export const playlistService = {
  /**
   * Lấy tất cả playlists
   * @param {Object} params - { user_id?, type? }
   * @returns {Promise<Array>} Danh sách playlists
   */
  getAll: async (params = {}) => {
    // Tự động thêm user_id nếu chưa có
    if (!params.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        params.user_id = userId
      }
    }
    return apiClient.get(API_ENDPOINTS.PLAYLISTS, params)
  },

  /**
   * Lấy playlist theo ID (bao gồm items)
   * @param {number|string} id - Playlist ID
   * @returns {Promise<Object>} Playlist object với items
   */
  getById: async (id) => {
    return apiClient.get(`${API_ENDPOINTS.PLAYLISTS}/${id}`)
  },

  /**
   * Tạo playlist mới
   * @param {Object} data - { name, description?, type? ('video' | 'film'), user_id? }
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
    // Normalize và validate type - đảm bảo luôn là 'video' hoặc 'film'
    if (data.type) {
      const normalizedType = String(data.type).toLowerCase().trim()
      data.type = (normalizedType === 'video' || normalizedType === 'film') ? normalizedType : 'film'
    } else {
      data.type = 'film'
    }
    return apiClient.post(API_ENDPOINTS.PLAYLISTS, data)
  },

  /**
   * Cập nhật playlist
   * @param {number|string} id - Playlist ID
   * @param {Object} data - { name?, description? }
   * @returns {Promise<Object>} { message }
   */
  update: async (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.PLAYLISTS}/${id}`, data)
  },

  /**
   * Xóa playlist
   * @param {number|string} id - Playlist ID
   * @returns {Promise<Object>} { message }
   */
  delete: async (id) => {
    return apiClient.delete(`${API_ENDPOINTS.PLAYLISTS}/${id}`)
  },

  /**
   * Thêm item vào playlist
   * @param {number|string} playlistId - Playlist ID
   * @param {Object} data - { film_id?, video_id?, position? }
   * @returns {Promise<Object>} { id, message }
   */
  addItem: async (playlistId, data) => {
    return apiClient.post(`${API_ENDPOINTS.PLAYLISTS}/${playlistId}/items`, data)
  },

  /**
   * Xóa item khỏi playlist
   * @param {number|string} playlistId - Playlist ID
   * @param {number|string} itemId - Item ID
   * @returns {Promise<Object>} { message }
   */
  removeItem: async (playlistId, itemId) => {
    return apiClient.delete(`${API_ENDPOINTS.PLAYLISTS}/${playlistId}/items/${itemId}`)
  },
}

