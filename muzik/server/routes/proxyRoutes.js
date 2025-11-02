import express from 'express'
import https from 'https'
import http from 'http'

const router = express.Router()

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
 */
router.get('/youtube-search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' })
    }

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
          
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.json({ videos })
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
    timestamp: new Date().toISOString() 
  })
})

export default router

