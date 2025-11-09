/**
 * Film Service
 * Handle APIs related to films
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'

export const filmService = {
  /**
   * Get all films
   * @param {Object} params - { user_id? }
   * @returns {Promise<Array>} List of films
   */
  getAll: async (params = {}) => {
    return apiClient.get(API_ENDPOINTS.FILMS, params)
  },

  /**
   * Get film by ID
   * @param {number|string} id - Film ID
   * @returns {Promise<Object>} Film object
   */
  getById: async (id) => {
    return apiClient.get(`${API_ENDPOINTS.FILMS}/${id}`)
  },

  /**
   * Create new film
   * @param {Object} data - { title, director?, genre?, year?, description?, thumbnail_url?, duration?, video_url?, user_id? }
   * @returns {Promise<Object>} { id, message }
   */
  create: async (data) => {
    return apiClient.post(API_ENDPOINTS.FILMS, data)
  },

  /**
   * Update film
   * @param {number|string} id - Film ID
   * @param {Object} data - { title?, director?, genre?, year?, description?, thumbnail_url?, duration?, video_url? }
   * @returns {Promise<Object>} { message }
   */
  update: async (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.FILMS}/${id}`, data)
  },

  /**
   * Delete film
   * @param {number|string} id - Film ID
   * @returns {Promise<Object>} { message }
   */
  delete: async (id) => {
    return apiClient.delete(`${API_ENDPOINTS.FILMS}/${id}`)
  },
}

