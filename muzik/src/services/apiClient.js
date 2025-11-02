/**
 * Base API Client
 * Utility để xử lý HTTP requests với authentication
 */
import { API_BASE } from '../constants/api.js'
import { eventBus } from '../utils/eventBus.js'

const getAuthToken = () => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const userData = JSON.parse(user)
      return userData.token || localStorage.getItem('token')
    } catch (e) {
      return localStorage.getItem('token')
    }
  }
  return localStorage.getItem('token')
}

const getHeaders = (customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const handleResponse = async (response) => {
  if (!response.ok) {
    let error
    try {
      const errorData = await response.json()
      error = errorData.error || errorData.message || `HTTP error! status: ${response.status}`
    } catch (e) {
      error = `HTTP error! status: ${response.status}`
    }
    
    // If token is invalid or expired (401), trigger logout
    if (response.status === 401) {
      eventBus.emit('auth-error', { status: 401, message: 'Session expired. Please login again.' })
    }
    
    throw new Error(error)
  }
  try {
    return await response.json()
  } catch (e) {
    // Some endpoints might return empty response
    if (response.status === 204 || response.status === 200) {
      return {}
    }
    throw new Error('Invalid response from server')
  }
}

export const apiClient = {
  get: async (endpoint, params = {}) => {
    try {
      const url = new URL(`${API_BASE}${endpoint}`)
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key])
        }
      })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: getHeaders(),
      })

      return handleResponse(response)
    } catch (error) {
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('URL')) {
          throw new Error('Network error. Please check your connection and API configuration.')
        }
      }
      throw error
    }
  },

  post: async (endpoint, data = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      })

      return handleResponse(response)
    } catch (error) {
      if (error instanceof TypeError) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection.')
        }
      }
      throw error
    }
  },

  put: async (endpoint, data = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      })

      return handleResponse(response)
    } catch (error) {
      if (error instanceof TypeError) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection.')
        }
      }
      throw error
    }
  },

  delete: async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })

      return handleResponse(response)
    } catch (error) {
      if (error instanceof TypeError) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection.')
        }
      }
      throw error
    }
  },
}

