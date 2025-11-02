/**
 * User Utilities
 * Helper functions để lấy thông tin user hiện tại
 */

/**
 * Lấy current user từ localStorage
 * @returns {Object|null} User object hoặc null
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
 * Lấy user ID của current user
 * @returns {number|null} User ID hoặc null
 */
export const getCurrentUserId = () => {
  const user = getCurrentUser()
  return user?.id || null
}

/**
 * Kiểm tra user đã đăng nhập chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const user = getCurrentUser()
  const authStatus = localStorage.getItem('isAuthenticated')
  return !!(user && authStatus === 'true')
}

