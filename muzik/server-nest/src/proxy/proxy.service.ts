import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common'
import * as https from 'https'
import { Response } from 'express'

@Injectable()
export class ProxyService {
  async proxyYoutubeApi(res: Response) {
    const youtubeUrl = 'https://www.youtube.com/iframe_api'

    https
      .get(youtubeUrl, (response) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET')
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
        res.setHeader('Cache-Control', 'public, max-age=3600')

        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            return https
              .get(redirectUrl, (redirectResponse) => {
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.setHeader('Access-Control-Allow-Methods', 'GET')
                res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
                res.setHeader('Cache-Control', 'public, max-age=3600')
                redirectResponse.pipe(res)
              })
              .on('error', (error) => {
                console.error('Proxy redirect error:', error)
                // Avoid sending headers twice if already sent
                if (!res.headersSent) res.status(500).send('Error proxying YouTube API')
              })
          }
        }

        response.pipe(res)
      })
      .on('error', (error) => {
        console.error('Proxy error:', error)
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Error proxying YouTube API',
            message: error.message,
          })
        }
      })
  }

  async searchYoutube(query: string, maxResults: number = 10, res: Response) {
    if (!query) {
      throw new BadRequestException('Search query is required')
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      if (!res.headersSent) res.status(500).json({ error: 'YouTube API key not configured' })
      return
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`

    https
      .get(searchUrl, (youtubeResponse) => {
        let data = ''

        youtubeResponse.on('data', (chunk) => {
          data += chunk
        })

        youtubeResponse.on('end', () => {
          try {
            const jsonData = JSON.parse(data)

            if (jsonData.error) {
              console.error('YouTube API error:', jsonData.error)
              if (!res.headersSent) {
                res.status(500).json({
                  error: 'YouTube API error',
                  message: jsonData.error.message || 'Unknown error',
                })
              }
              return
            }

            const videos =
              jsonData.items?.map((item: any) => ({
                videoId: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail:
                  item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
              })) || []

            res.setHeader('Access-Control-Allow-Origin', '*')
            res.json({ videos })
          } catch (parseError) {
            console.error('Error parsing YouTube response:', parseError)
            if (!res.headersSent) res.status(500).json({ error: 'Error parsing YouTube response' })
          }
        })
      })
      .on('error', (error) => {
        console.error('YouTube API error:', error)
        if (!res.headersSent) res.status(500).json({ error: 'Error fetching from YouTube API' })
      })
  }
}
