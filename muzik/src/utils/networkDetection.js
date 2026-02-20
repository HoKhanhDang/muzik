/**
 * Network detection utility for optimizing YouTube player based on connection quality
 */

// ============================================================
// Speed detection cache (TTL = 2 min)
// Avoids redundant HEAD requests to youtube.com/favicon.ico
// ============================================================
const SPEED_CACHE_TTL = 2 * 60 * 1000 // 2 minutes
let speedCache = { result: null, timestamp: 0 }

/**
 * Detect network speed using Network Information API
 * Results are cached for 2 minutes to avoid redundant measurements
 * @returns {Promise<'good'|'medium'|'slow'|'offline'>}
 */
export const detectNetworkSpeed = async () => {
  // Check if offline
  if (!navigator.onLine) {
    return 'offline'
  }

  // Return cached result if still valid
  if (speedCache.result && (Date.now() - speedCache.timestamp < SPEED_CACHE_TTL)) {
    return speedCache.result
  }

  // Check Network Information API
  const connection = navigator.connection || 
                     navigator.mozConnection || 
                     navigator.webkitConnection

  let result

  if (!connection) {
    // Fallback: try to measure actual speed
    result = await measureNetworkSpeed()
  } else {
    // Check effective type
    const effectiveType = connection.effectiveType
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      result = 'slow'
    } else if (effectiveType === '3g') {
      result = 'medium'
    } else if (connection.downlink) {
      // Check downlink speed as additional indicator
      if (connection.downlink < 1) {
        result = 'slow'
      } else if (connection.downlink < 2) {
        result = 'medium'
      } else {
        result = 'good'
      }
    } else {
      result = 'good'
    }
  }

  // Cache the result
  speedCache = { result, timestamp: Date.now() }
  return result
}

/**
 * Measure network speed by downloading a small file
 * Uses its own internal cache to avoid repeated fetch calls
 * @returns {Promise<'good'|'medium'|'slow'>}
 */
const measureNetworkSpeed = async () => {
  // Return cached result if available (avoids redundant fetch)
  if (speedCache.result && (Date.now() - speedCache.timestamp < SPEED_CACHE_TTL)) {
    return speedCache.result
  }

  try {
    const startTime = performance.now()
    
    // Create AbortController for timeout (better browser support)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
    
    const response = await fetch('https://www.youtube.com/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const endTime = performance.now()
    const duration = endTime - startTime

    // If it takes more than 2 seconds, consider it slow
    if (duration > 2000) {
      return 'slow'
    }
    // If it takes more than 1 second, consider it medium
    if (duration > 1000) {
      return 'medium'
    }
    return 'good'
  } catch (error) {
    console.warn('Network speed measurement failed:', error)
    // Default to medium if measurement fails
    return 'medium'
  }
}

/**
 * Get optimal YouTube quality based on network quality
 * @param {string} networkQuality - Network quality: 'good', 'medium', 'slow', 'offline'
 * @param {boolean} audioOnlyMode - Whether in audio-only mode
 * @returns {string} YouTube quality parameter
 */
export const getOptimalQuality = (networkQuality, audioOnlyMode = false) => {
  if (audioOnlyMode) {
    return 'tiny'
  }

  switch (networkQuality) {
    case 'slow':
      return 'small'
    case 'medium':
      return 'medium'
    case 'good':
    default:
      return 'default'
  }
}

/**
 * Get optimal playerVars based on network quality
 * @param {string} networkQuality - Network quality
 * @param {boolean} audioOnlyMode - Whether in audio-only mode
 * @returns {Object} Optimized playerVars
 */
export const getOptimalPlayerVars = (networkQuality, audioOnlyMode = false) => {
  const quality = getOptimalQuality(networkQuality, audioOnlyMode)
  
  return {
    autoplay: 0,
    controls: audioOnlyMode ? 0 : 1,
    loop: 0,
    modestbranding: 1, // Reduced branding = less data
    rel: 0, // No related videos = less data
    showinfo: 0, // Hide info = less data
    enablejsapi: 1,
    iv_load_policy: 3, // Hide annotations = less data
    cc_load_policy: 0, // No captions = less data
    fs: 0, // Disable fullscreen button = less UI (optional)
    vq: quality, // Set quality based on network
    playsinline: 1, // Better for mobile
    origin: window.location.origin, // Security optimization
  }
}

/**
 * Setup network monitoring
 * @param {Function} callback - Callback function when network changes
 * @returns {Function} Cleanup function
 */
export const setupNetworkMonitoring = (callback) => {
  if (!navigator.connection) {
    return () => {} // No-op cleanup
  }

  const connection = navigator.connection || 
                     navigator.mozConnection || 
                     navigator.webkitConnection

  const handleChange = async () => {
    // Invalidate cache on network change so we get fresh measurement
    speedCache = { result: null, timestamp: 0 }
    const quality = await detectNetworkSpeed()
    callback(quality)
  }

  connection.addEventListener('change', handleChange)

  // Return cleanup function
  return () => {
    connection.removeEventListener('change', handleChange)
  }
}
