import { executeQuery, executeQueryOne, executeUpdate } from '../utils/helpers.js'
import { extractVideoId } from '../utils/helpers.js'
import { dbType } from '../config/database.js'

export const getAllVideos = async (req, res) => {
  try {
    const { user_id } = req.query
    let query, params

    if (user_id) {
      query = dbType === 'postgresql'
        ? 'SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC'
      params = [user_id]
    } else {
      query = 'SELECT * FROM videos ORDER BY created_at DESC'
      params = []
    }

    const videos = await executeQuery(query, params)
    res.json(videos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getVideoById = async (req, res) => {
  const { id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'SELECT * FROM videos WHERE id = $1'
      : 'SELECT * FROM videos WHERE id = ?'
    
    const video = await executeQueryOne(query, [id])
    
    if (!video) {
      res.status(404).json({ error: 'Video not found' })
      return
    }
    
    res.json(video)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createVideo = async (req, res) => {
  const { title, video_id, youtube_url, thumbnail_url, duration, user_id } = req.body

  let finalVideoId = video_id
  if (youtube_url && !video_id) {
    finalVideoId = extractVideoId(youtube_url)
    if (!finalVideoId) {
      res.status(400).json({ error: 'Invalid YouTube URL' })
      return
    }
  }

  if (!finalVideoId) {
    res.status(400).json({ error: 'Video ID is required' })
    return
  }

  try {
    const params = [title || `Video ${finalVideoId}`, finalVideoId, youtube_url, thumbnail_url, duration, user_id || null]
    
    if (dbType === 'postgresql') {
      const query = `INSERT INTO videos (title, video_id, youtube_url, thumbnail_url, duration, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`
      const { db } = await import('../config/database.js')
      const result = await db.query(query, params)
      
      res.json({
        id: result.rows[0].id,
        message: 'Video added successfully',
        video_id: finalVideoId,
      })
    } else {
      const query = `INSERT INTO videos (title, video_id, youtube_url, thumbnail_url, duration, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      const result = await executeUpdate(query, params)
      
      res.json({
        id: result.insertId,
        message: 'Video added successfully',
        video_id: finalVideoId,
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateVideo = async (req, res) => {
  const { id } = req.params
  const { title, video_id, youtube_url, thumbnail_url, duration } = req.body

  try {
    const query = dbType === 'postgresql'
      ? `UPDATE videos 
         SET title = $1, video_id = $2, youtube_url = $3, thumbnail_url = $4, duration = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`
      : `UPDATE videos 
         SET title = ?, video_id = ?, youtube_url = ?, thumbnail_url = ?, duration = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`

    const params = [title, video_id, youtube_url, thumbnail_url, duration, id]
    const result = await executeUpdate(query, params)

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Video not found' })
      return
    }
    
    res.json({ message: 'Video updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteVideo = async (req, res) => {
  const { id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'DELETE FROM videos WHERE id = $1'
      : 'DELETE FROM videos WHERE id = ?'

    const result = await executeUpdate(query, [id])

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Video not found' })
      return
    }
    
    res.json({ message: 'Video deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getVideoIds = async (req, res) => {
  try {
    const { user_id } = req.query
    let query, params

    if (user_id) {
      query = dbType === 'postgresql'
        ? 'SELECT video_id FROM videos WHERE user_id = $1 ORDER BY created_at DESC'
        : 'SELECT video_id FROM videos WHERE user_id = ? ORDER BY created_at DESC'
      params = [user_id]
    } else {
      query = 'SELECT video_id FROM videos ORDER BY created_at DESC'
      params = []
    }
    
    const videos = await executeQuery(query, params)
    const videoIds = videos.map((row) => row.video_id)
    res.json(videoIds)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

