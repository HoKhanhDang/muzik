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

