import { executeQuery, executeQueryOne, executeUpdate } from '../utils/helpers.js'
import { dbType } from '../config/database.js'

export const getAllMusic = async (req, res) => {
  try {
    const { user_id } = req.query
    let query, params

    if (user_id) {
      query = dbType === 'postgresql'
        ? 'SELECT * FROM music WHERE user_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM music WHERE user_id = ? ORDER BY created_at DESC'
      params = [user_id]
    } else {
      query = 'SELECT * FROM music ORDER BY created_at DESC'
      params = []
    }

    const music = await executeQuery(query, params)
    res.json(music)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getMusicById = async (req, res) => {
  const { id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'SELECT * FROM music WHERE id = $1'
      : 'SELECT * FROM music WHERE id = ?'

    const music = await executeQueryOne(query, [id])

    if (!music) {
      res.status(404).json({ error: 'Music not found' })
      return
    }

    res.json(music)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createMusic = async (req, res) => {
  const { title, artist, audio_url, thumbnail_url, duration, user_id } = req.body

  if (!title) {
    res.status(400).json({ error: 'Title is required' })
    return
  }

  try {
    const params = [title, artist || null, audio_url || null, thumbnail_url || null, duration || null, user_id || null]
    
    if (dbType === 'postgresql') {
      const query = `INSERT INTO music (title, artist, audio_url, thumbnail_url, duration, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`
      const { db } = await import('../config/database.js')
      const result = await db.query(query, params)
      
      res.status(201).json({
        id: result.rows[0].id,
        message: 'Music added successfully',
      })
    } else {
      const query = `INSERT INTO music (title, artist, audio_url, thumbnail_url, duration, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      const result = await executeUpdate(query, params)
      
      res.status(201).json({
        id: result.insertId,
        message: 'Music added successfully',
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateMusic = async (req, res) => {
  const { id } = req.params
  const { title, artist, audio_url, thumbnail_url, duration } = req.body

  try {
    const query = dbType === 'postgresql'
      ? `UPDATE music 
         SET title = $1, artist = $2, audio_url = $3, thumbnail_url = $4, duration = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`
      : `UPDATE music 
         SET title = ?, artist = ?, audio_url = ?, thumbnail_url = ?, duration = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`

    const params = [title, artist, audio_url, thumbnail_url, duration, id]
    const result = await executeUpdate(query, params)

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Music not found' })
      return
    }

    res.json({ message: 'Music updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteMusic = async (req, res) => {
  const { id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'DELETE FROM music WHERE id = $1'
      : 'DELETE FROM music WHERE id = ?'

    const result = await executeUpdate(query, [id])

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Music not found' })
      return
    }

    res.json({ message: 'Music deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

