/**
 * User Utilities
 * Helper functions to get current user information
 */

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (e) {
    console.error('Error parsing user data:', e)
    return null
  }
}

/**
 * Get user ID of current user
 * @returns {number|null} User ID or null
 */
export const getCurrentUserId = () => {
  const user = getCurrentUser()
  return user?.id || null
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const user = getCurrentUser()
  const authStatus = localStorage.getItem('isAuthenticated')
  return !!(user && authStatus === 'true')
}

