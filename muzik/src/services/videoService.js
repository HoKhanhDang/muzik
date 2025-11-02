/**
 * Video Service
 * Xử lý các API liên quan đến videos
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'
import { getCurrentUserId } from '../utils/user.js'

export const videoService = {
  /**
   * Lấy tất cả videos
   * @param {Object} params - { user_id? }
   * @returns {Promise<Array>} Danh sách videos
   */
  getAll: async (params = {}) => {
    // Tự động filter theo user_id
    if (!params.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        params.user_id = userId
      }
    }
    return apiClient.get(API_ENDPOINTS.VIDEOS, params)
  },

  /**
   * Lấy video theo ID
   * @param {number|string} id - Video ID
   * @returns {Promise<Object>} Video object
   */
  getById: async (id) => {
    return apiClient.get(`${API_ENDPOINTS.VIDEOS}/${id}`)
  },

  /**
   * Tạo video mới
   * @param {Object} data - { title, video_id, youtube_url?, thumbnail_url?, duration?, user_id? }
   * @returns {Promise<Object>} { id, message, video_id }
   */
  create: async (data) => {
    // Tự động thêm user_id nếu chưa có
    if (!data.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        data.user_id = userId
      }
    }
    return apiClient.post(API_ENDPOINTS.VIDEOS, data)
  },

  /**
   * Cập nhật video
   * @param {number|string} id - Video ID
   * @param {Object} data - { title?, video_id?, youtube_url?, thumbnail_url?, duration? }
   * @returns {Promise<Object>} { message }
   */
  update: async (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.VIDEOS}/${id}`, data)
  },

  /**
   * Xóa video
   * @param {number|string} id - Video ID
   * @returns {Promise<Object>} { message }
   */
  delete: async (id) => {
    return apiClient.delete(`${API_ENDPOINTS.VIDEOS}/${id}`)
  },

  /**
   * Lấy tất cả video IDs
   * @returns {Promise<Array<string>>} Danh sách video IDs
   */
  getVideoIds: async () => {
    const userId = getCurrentUserId()
    const params = userId ? { user_id: userId } : {}
    return apiClient.get(`${API_ENDPOINTS.VIDEOS}/ids`, params)
  },

  /**
   * Tìm kiếm video trên YouTube
   * @param {string} query - Từ khóa tìm kiếm
   * @param {number} maxResults - Số kết quả tối đa (default: 20)
   * @returns {Promise<Array>} Danh sách video
   */
  searchYouTube: async (query, maxResults = 20) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${apiBase}/proxy/youtube-search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Search failed' }))
      throw new Error(error.message || error.error || 'Search failed')
    }
    
    const data = await response.json()
    return data.videos || []
  },
}

