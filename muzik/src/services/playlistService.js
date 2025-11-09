/**
 * Playlist Service
 * Handle APIs related to playlists
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'
import { getCurrentUserId } from '../utils/user.js'

export const playlistService = {
  /**
   * Get all playlists
   * @param {Object} params - { user_id?, type? }
   * @returns {Promise<Array>} List of playlists
   */
  getAll: async (params = {}) => {
    // Automatically add user_id if not present
    if (!params.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        params.user_id = userId
      }
    }
    return apiClient.get(API_ENDPOINTS.PLAYLISTS, params)
  },

  /**
   * Get playlist by ID (including items)
   * @param {number|string} id - Playlist ID
   * @returns {Promise<Object>} Playlist object with items
   */
  getById: async (id) => {
    return apiClient.get(`${API_ENDPOINTS.PLAYLISTS}/${id}`)
  },

  /**
   * Create new playlist
   * @param {Object} data - { name, description?, type? ('video' | 'film'), user_id? }
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
    // Normalize and validate type - ensure it's always 'video' or 'film'
    if (data.type) {
      const normalizedType = String(data.type).toLowerCase().trim()
      data.type = (normalizedType === 'video' || normalizedType === 'film') ? normalizedType : 'film'
    } else {
      data.type = 'film'
    }
    return apiClient.post(API_ENDPOINTS.PLAYLISTS, data)
  },

  /**
   * Update playlist
   * @param {number|string} id - Playlist ID
   * @param {Object} data - { name?, description? }
   * @returns {Promise<Object>} { message }
   */
  update: async (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.PLAYLISTS}/${id}`, data)
  },

  /**
   * Delete playlist
   * @param {number|string} id - Playlist ID
   * @returns {Promise<Object>} { message }
   */
  delete: async (id) => {
    return apiClient.delete(`${API_ENDPOINTS.PLAYLISTS}/${id}`)
  },

  /**
   * Add item to playlist
   * @param {number|string} playlistId - Playlist ID
   * @param {Object} data - { film_id?, video_id?, position? }
   * @returns {Promise<Object>} { id, message }
   */
  addItem: async (playlistId, data) => {
    return apiClient.post(`${API_ENDPOINTS.PLAYLISTS}/${playlistId}/items`, data)
  },

  /**
   * Remove item from playlist
   * @param {number|string} playlistId - Playlist ID
   * @param {number|string} itemId - Item ID
   * @returns {Promise<Object>} { message }
   */
  removeItem: async (playlistId, itemId) => {
    return apiClient.delete(`${API_ENDPOINTS.PLAYLISTS}/${playlistId}/items/${itemId}`)
  },
}

