/**
 * Video Service
 * Handle APIs related to videos
 */
import { apiClient } from './apiClient.js'
import { API_ENDPOINTS } from '../constants/api.js'
import { getCurrentUserId } from '../utils/user.js'

// ============================================================
// Client-side search cache (TTL = 5 min, max 50 entries)
// Prevents redundant API calls for repeated searches
// ============================================================
const SEARCH_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const SEARCH_CACHE_MAX_SIZE = 50
const searchCache = new Map()

const getSearchCacheKey = (query, maxResults) => {
  return `${query.toLowerCase().trim()}::${maxResults}`
}

const getCachedSearch = (key) => {
  const entry = searchCache.get(key)
  if (!entry) return null

  if (Date.now() - entry.timestamp > SEARCH_CACHE_TTL) {
    searchCache.delete(key)
    return null
  }

  return entry.data
}

const setCachedSearch = (key, data) => {
  // LRU eviction
  if (searchCache.size >= SEARCH_CACHE_MAX_SIZE) {
    const oldestKey = searchCache.keys().next().value
    searchCache.delete(oldestKey)
  }

  searchCache.set(key, { data, timestamp: Date.now() })
}

export const videoService = {
  /**
   * Get all videos
   * @param {Object} params - { user_id? }
   * @returns {Promise<Array>} List of videos
   */
  getAll: async (params = {}) => {
    // Automatically filter by user_id
    if (!params.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        params.user_id = userId
      }
    }
    return apiClient.get(API_ENDPOINTS.VIDEOS, params)
  },

  /**
   * Get video by ID
   * @param {number|string} id - Video ID
   * @returns {Promise<Object>} Video object
   */
  getById: async (id) => {
    return apiClient.get(`${API_ENDPOINTS.VIDEOS}/${id}`)
  },

  /**
   * Create new video
   * @param {Object} data - { title, video_id, youtube_url?, thumbnail_url?, duration?, user_id? }
   * @returns {Promise<Object>} { id, message, video_id }
   */
  create: async (data) => {
    // Automatically add user_id if not present
    if (!data.user_id) {
      const userId = getCurrentUserId()
      if (userId) {
        data.user_id = userId
      }
    }
    return apiClient.post(API_ENDPOINTS.VIDEOS, data)
  },

  /**
   * Update video
   * @param {number|string} id - Video ID
   * @param {Object} data - { title?, video_id?, youtube_url?, thumbnail_url?, duration? }
   * @returns {Promise<Object>} { message }
   */
  update: async (id, data) => {
    return apiClient.put(`${API_ENDPOINTS.VIDEOS}/${id}`, data)
  },

  /**
   * Delete video
   * @param {number|string} id - Video ID
   * @returns {Promise<Object>} { message }
   */
  delete: async (id) => {
    return apiClient.delete(`${API_ENDPOINTS.VIDEOS}/${id}`)
  },

  /**
   * Get all video IDs
   * @returns {Promise<Array<string>>} List of video IDs
   */
  getVideoIds: async () => {
    const userId = getCurrentUserId()
    const params = userId ? { user_id: userId } : {}
    return apiClient.get(`${API_ENDPOINTS.VIDEOS}/ids`, params)
  },

  /**
   * Search videos on YouTube
   * Uses client-side cache (5 min TTL) before hitting server
   * @param {string} query - Search keywords
   * @param {number} maxResults - Maximum number of results (default: 20)
   * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
   * @returns {Promise<Array>} List of videos
   */
  searchYouTube: async (query, maxResults = 20, signal) => {
    // Check client cache first
    const cacheKey = getSearchCacheKey(query, maxResults)
    const cached = getCachedSearch(cacheKey)
    if (cached) {
      console.log(`[Client Cache HIT] "${query}"`)
      return cached
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const fetchOptions = signal ? { signal } : {}
    const response = await fetch(`${apiBase}/proxy/youtube-search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`, fetchOptions)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Search failed' }))
      throw new Error(error.message || error.error || 'Search failed')
    }
    
    const data = await response.json()
    const videos = data.videos || []

    // Store in cache
    if (videos.length > 0) {
      setCachedSearch(cacheKey, videos)
    }

    return videos
  },

  /**
   * Clear the client-side search cache
   * Useful when user wants fresh results
   */
  clearSearchCache: () => {
    searchCache.clear()
  },
}
