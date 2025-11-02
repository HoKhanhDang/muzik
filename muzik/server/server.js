import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'

import { db, dbType } from './config/database.js'
import videoRoutes from './routes/videoRoutes.js'
import authRoutes from './routes/authRoutes.js'
import filmRoutes from './routes/filmRoutes.js'
import playlistRoutes from './routes/playlistRoutes.js'
import musicRoutes from './routes/musicRoutes.js'
import proxyRoutes from './routes/proxyRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware - Allow all origins in production for flexible CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), dbType })
})

// Routes
app.use('/api/videos', videoRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/films', filmRoutes)
app.use('/api/music', musicRoutes)
app.use('/api/playlists', playlistRoutes)
app.use('/api/proxy', proxyRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Using ${dbType} database`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  if (dbType === 'postgresql') {
    await db.end()
    console.log('Database connection closed')
  } else {
    db.close((err) => {
      if (err) {
        console.error(err.message)
      }
      console.log('Database connection closed')
    })
  }
  process.exit(0)
})

// Export for Vercel serverless
export default app
