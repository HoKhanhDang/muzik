import { executeQuery, executeQueryOne, executeUpdate } from '../utils/helpers.js'
import { dbType } from '../config/database.js'

export const getAllFilms = async (req, res) => {
  try {
    const { user_id } = req.query
    let query, params

    if (user_id) {
      query = dbType === 'postgresql'
        ? 'SELECT * FROM films WHERE user_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM films WHERE user_id = ? ORDER BY created_at DESC'
      params = [user_id]
    } else {
      query = 'SELECT * FROM films ORDER BY created_at DESC'
      params = []
    }

    const films = await executeQuery(query, params)
    res.json(films)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getFilmById = async (req, res) => {
  const { id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'SELECT * FROM films WHERE id = $1'
      : 'SELECT * FROM films WHERE id = ?'

    const film = await executeQueryOne(query, [id])

    if (!film) {
      res.status(404).json({ error: 'Film not found' })
      return
    }

    res.json(film)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createFilm = async (req, res) => {
  const { title, director, genre, year, description, thumbnail_url, duration, video_url, user_id } = req.body

  if (!title) {
    res.status(400).json({ error: 'Title is required' })
    return
  }

  try {
    const params = [title, director || null, genre || null, year || null, description || null, thumbnail_url || null, duration || null, video_url || null, user_id || null]
    
    if (dbType === 'postgresql') {
      const query = `INSERT INTO films (title, director, genre, year, description, thumbnail_url, duration, video_url, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`
      const { db } = await import('../config/database.js')
      const result = await db.query(query, params)
      
      res.status(201).json({
        id: result.rows[0].id,
        message: 'Film added successfully',
      })
    } else {
      const query = `INSERT INTO films (title, director, genre, year, description, thumbnail_url, duration, video_url, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      const result = await executeUpdate(query, params)
      
      res.status(201).json({
        id: result.insertId,
        message: 'Film added successfully',
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateFilm = async (req, res) => {
  const { id } = req.params
  const { title, director, genre, year, description, thumbnail_url, duration, video_url } = req.body

  try {
    const query = dbType === 'postgresql'
      ? `UPDATE films 
         SET title = $1, director = $2, genre = $3, year = $4, description = $5, thumbnail_url = $6, duration = $7, video_url = $8, updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`
      : `UPDATE films 
         SET title = ?, director = ?, genre = ?, year = ?, description = ?, thumbnail_url = ?, duration = ?, video_url = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`

    const params = [title, director, genre, year, description, thumbnail_url, duration, video_url, id]
    const result = await executeUpdate(query, params)

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Film not found' })
      return
    }

    res.json({ message: 'Film updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteFilm = async (req, res) => {
  const { id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'DELETE FROM films WHERE id = $1'
      : 'DELETE FROM films WHERE id = ?'

    const result = await executeUpdate(query, [id])

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Film not found' })
      return
    }

    res.json({ message: 'Film deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

