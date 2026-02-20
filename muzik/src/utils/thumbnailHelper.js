/**
 * Thumbnail Helper
 * Returns appropriate YouTube thumbnail URL based on network quality
 * 
 * YouTube thumbnail sizes:
 * - default:   120x90
 * - mqdefault: 320x180
 * - hqdefault: 480x360
 */

/**
 * Get thumbnail URL optimized for network quality
 * @param {string} videoId - YouTube video ID
 * @param {string} networkQuality - 'good' | 'medium' | 'slow' | 'offline'
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (videoId, networkQuality = 'good') => {
  if (!videoId) return null
  const size = networkQuality === 'slow' ? 'default' : 'mqdefault'
  return `https://img.youtube.com/vi/${videoId}/${size}.jpg`
}

/**
 * Get thumbnail size name for network quality
 * @param {string} networkQuality
 * @returns {string} 'default' | 'mqdefault'
 */
export const getThumbnailSize = (networkQuality = 'good') => {
  return networkQuality === 'slow' ? 'default' : 'mqdefault'
}
