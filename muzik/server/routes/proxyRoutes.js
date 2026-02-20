import express from 'express'
import https from 'https'
import http from 'http'

const router = express.Router()

// ============================================================
// Search Cache — In-memory cache with TTL (10 minutes)
// Saves YouTube API quota (search.list = 100 units, daily limit = 10,000)
// ============================================================
const SEARCH_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const SEARCH_CACHE_MAX_SIZE = 200
const searchCache = new Map()

/**
 * Get normalized cache key from query params
 */
const getSearchCacheKey = (query, maxResults) => {
  return `${query.toLowerCase().trim()}::${maxResults}`
}

/**
 * Get cached search result if still valid
 * @returns {Object|null} Cached result or null
 */
const getCachedSearch = (key) => {
  const entry = searchCache.get(key)
  if (!entry) return null

  const age = Date.now() - entry.timestamp
  if (age > SEARCH_CACHE_TTL) {
    searchCache.delete(key)
    return null
  }

  return entry.data
}

/**
 * Store search result in cache with LRU eviction
 */
const setCachedSearch = (key, data) => {
  // LRU eviction: remove oldest entry if cache is full
  if (searchCache.size >= SEARCH_CACHE_MAX_SIZE) {
    const oldestKey = searchCache.keys().next().value
    searchCache.delete(oldestKey)
  }

  searchCache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

// ============================================================
// Rate Limiter — Simple in-memory, per-IP, 10 req/min
// ============================================================
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10
const rateLimitMap = new Map()

/**
 * Check if request is within rate limit
 * @returns {boolean} true if allowed, false if rate limited
 */
const checkRateLimit = (ip) => {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return true
  }

  // Reset window if expired
  if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return true
  }

  // Increment and check
  entry.count++
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  return true
}

// Periodically clean up stale rate limit entries (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip)
    }
  }
}, 5 * 60 * 1000)

/**
 * Proxy endpoint for YouTube iframe API
 * Helps bypass company proxy restrictions by loading through backend server
 */
router.get('/youtube-api', async (req, res) => {
  try {
    const youtubeUrl = 'https://www.youtube.com/iframe_api'
    
    https.get(youtubeUrl, (response) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET')
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          return https.get(redirectUrl, (redirectResponse) => {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET')
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
            res.setHeader('Cache-Control', 'public, max-age=3600')
            redirectResponse.pipe(res)
            return
          }).on('error', (error) => {
            console.error('Proxy redirect error:', error)
            res.status(500).send('Error proxying YouTube API')
          })
        }
      }
      
      response.pipe(res)
    }).on('error', (error) => {
      console.error('Proxy error:', error)
      res.status(500).json({ 
        error: 'Error proxying YouTube API',
        message: error.message 
      })
    })
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Error proxying YouTube API',
      message: error.message 
    })
  }
})

/**
 * Search YouTube videos
 * Uses YouTube Data API v3 to search for videos
 * - Server-side cache (TTL = 10 min, max 200 entries)
 * - Rate limiting (10 req/min per IP)
 * - Cache-Control headers for browser caching
 */
router.get('/youtube-search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    // Rate limit check
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown'
    if (!checkRateLimit(clientIp)) {
      res.setHeader('Retry-After', '60')
      return res.status(429).json({ 
        error: 'Too many requests',
        message: 'Please wait before searching again. Max 10 searches per minute.' 
      })
    }

    // Check cache first
    const cacheKey = getSearchCacheKey(q, maxResults)
    const cachedResult = getCachedSearch(cacheKey)

    if (cachedResult) {
      console.log(`[Cache HIT] Search: "${q}" (maxResults=${maxResults})`)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'public, max-age=600') // 10 min browser cache
      res.setHeader('X-Cache', 'HIT')
      return res.json(cachedResult)
    }

    console.log(`[Cache MISS] Search: "${q}" (maxResults=${maxResults}) — calling YouTube API`)

    // Get API key from environment variable
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured' })
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=${maxResults}&key=${apiKey}`
    
    https.get(searchUrl, (youtubeResponse) => {
      let data = ''
      
      youtubeResponse.on('data', (chunk) => {
        data += chunk
      })
      
      youtubeResponse.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          
          // Check for API errors
          if (jsonData.error) {
            console.error('YouTube API error:', jsonData.error)
            return res.status(500).json({ 
              error: 'YouTube API error',
              message: jsonData.error.message || 'Unknown error'
            })
          }
          
          // Format response for frontend
          const videos = jsonData.items?.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt
          })) || []

          const responseData = { videos }

          // Store in cache
          setCachedSearch(cacheKey, responseData)
          
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Cache-Control', 'public, max-age=600') // 10 min browser cache
          res.setHeader('X-Cache', 'MISS')
          res.json(responseData)
        } catch (parseError) {
          console.error('Error parsing YouTube response:', parseError)
          res.status(500).json({ error: 'Error parsing YouTube response' })
        }
      })
    }).on('error', (error) => {
      console.error('YouTube API error:', error)
      res.status(500).json({ error: 'Error fetching from YouTube API' })
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search error', message: error.message })
  }
})

/**
 * Health check for proxy endpoint
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'proxy',
    timestamp: new Date().toISOString(),
    cache: {
      searchEntries: searchCache.size,
      maxSize: SEARCH_CACHE_MAX_SIZE,
    }
  })
})

export default router
