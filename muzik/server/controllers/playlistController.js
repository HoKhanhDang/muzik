import { executeQuery, executeQueryOne, executeUpdate } from '../utils/helpers.js'
import { dbType } from '../config/database.js'

export const getAllPlaylists = async (req, res) => {
  try {
    const { user_id } = req.query
    let query, params

    if (user_id) {
      query = dbType === 'postgresql'
        ? `SELECT p.*, 
                  COUNT(pi.id) as items_count
           FROM playlists p
           LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
           WHERE p.user_id = $1
           GROUP BY p.id
           ORDER BY p.created_at DESC`
        : `SELECT p.*, 
                  COUNT(pi.id) as items_count
           FROM playlists p
           LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
           WHERE p.user_id = ?
           GROUP BY p.id
           ORDER BY p.created_at DESC`
      params = [user_id]
    } else {
      query = dbType === 'postgresql'
        ? `SELECT p.*, 
                  COUNT(pi.id) as items_count
           FROM playlists p
           LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
           GROUP BY p.id
           ORDER BY p.created_at DESC`
        : `SELECT p.*, 
                  COUNT(pi.id) as items_count
           FROM playlists p
           LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
           GROUP BY p.id
           ORDER BY p.created_at DESC`
      params = []
    }

    const playlists = await executeQuery(query, params)
    console.log('Raw playlists from DB:', playlists) // Debug log
    
    // Convert items_count to number
    const playlistsWithCount = playlists.map(p => {
      const count = Number(p.items_count || 0)
      console.log(`Playlist ${p.id}: items_count = ${p.items_count} (raw), ${count} (converted)`) // Debug log
      return {
        ...p,
        items_count: count
      }
    })
    
    console.log('Playlists with count:', playlistsWithCount) // Debug log
    res.json(playlistsWithCount)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getPlaylistById = async (req, res) => {
  const { id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'SELECT * FROM playlists WHERE id = $1'
      : 'SELECT * FROM playlists WHERE id = ?'

    const playlist = await executeQueryOne(query, [id])

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' })
      return
    }

    // Get playlist items
    const itemsQuery = dbType === 'postgresql'
      ? `SELECT pi.*, 
                f.title as film_title, f.director, f.genre, f.video_url as film_video_url, f.thumbnail_url as film_thumbnail,
                v.title as video_title, pi.video_id, v.youtube_url, v.thumbnail_url as video_thumbnail
         FROM playlist_items pi
         LEFT JOIN films f ON pi.film_id = f.id
         LEFT JOIN videos v ON pi.video_id::text = v.video_id
         WHERE pi.playlist_id = $1
         ORDER BY pi.position ASC, pi.created_at ASC`
      : `SELECT pi.*, 
                f.title as film_title, f.director, f.genre, f.video_url as film_video_url, f.thumbnail_url as film_thumbnail,
                v.title as video_title, pi.video_id, v.youtube_url, v.thumbnail_url as video_thumbnail
         FROM playlist_items pi
         LEFT JOIN films f ON pi.film_id = f.id
         LEFT JOIN videos v ON pi.video_id = v.video_id
         WHERE pi.playlist_id = ?
         ORDER BY pi.position ASC, pi.created_at ASC`

    const items = await executeQuery(itemsQuery, [id])

    res.json({
      ...playlist,
      items,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createPlaylist = async (req, res) => {
  const { name, description, type, user_id } = req.body

  if (!name) {
    res.status(400).json({ error: 'Playlist name is required' })
    return
  }

  // Normalize and validate type - ensure it's lowercase and valid
  // Always ensure type is a valid string, never null or undefined
  let playlistType = 'film' // default
  if (type != null && type !== '') {
    const normalizedType = String(type).toLowerCase().trim()
    if (normalizedType === 'video' || normalizedType === 'film') {
      playlistType = normalizedType
    } else {
      res.status(400).json({ error: 'Playlist type must be "video" or "film"' })
      return
    }
  }
  
  // Final safety check - ensure playlistType is never null/undefined
  if (!playlistType || (playlistType !== 'video' && playlistType !== 'film')) {
    playlistType = 'film'
  }

  try {
    // Ensure we never pass null for type to the database
    const params = [name, description || null, String(playlistType), user_id || null]
    
    if (dbType === 'postgresql') {
      const query = `INSERT INTO playlists (name, description, type, user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`
      const { db } = await import('../config/database.js')
      const result = await db.query(query, params)
      
      res.status(201).json({
        id: result.rows[0].id,
        message: 'Playlist created successfully',
      })
    } else {
      const query = `INSERT INTO playlists (name, description, type, user_id)
         VALUES (?, ?, ?, ?)`
      const result = await executeUpdate(query, params)
      
      res.status(201).json({
        id: result.insertId,
        message: 'Playlist created successfully',
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updatePlaylist = async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body

  try {
    const query = dbType === 'postgresql'
      ? `UPDATE playlists 
         SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`
      : `UPDATE playlists 
         SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`

    const params = [name, description, id]
    const result = await executeUpdate(query, params)

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Playlist not found' })
      return
    }

    res.json({ message: 'Playlist updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deletePlaylist = async (req, res) => {
  const { id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'DELETE FROM playlists WHERE id = $1'
      : 'DELETE FROM playlists WHERE id = ?'

    const result = await executeUpdate(query, [id])

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Playlist not found' })
      return
    }

    res.json({ message: 'Playlist deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const addItemToPlaylist = async (req, res) => {
  const { playlist_id } = req.params
  const { film_id, video_id, position } = req.body

  if (!film_id && !video_id) {
    res.status(400).json({ error: 'Either film_id or video_id is required' })
    return
  }

  try {
    // Get playlist to check type
    const playlistQuery = dbType === 'postgresql'
      ? 'SELECT type FROM playlists WHERE id = $1'
      : 'SELECT type FROM playlists WHERE id = ?'
    const playlist = await executeQueryOne(playlistQuery, [playlist_id])

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' })
      return
    }

    // Validate item type matches playlist type
    if (playlist.type === 'film' && video_id) {
      res.status(400).json({ error: 'Cannot add video to a film playlist' })
      return
    }
    if (playlist.type === 'video' && film_id) {
      res.status(400).json({ error: 'Cannot add film to a video playlist' })
      return
    }

    const params = [playlist_id, film_id || null, video_id || null, position || null]
    
    if (dbType === 'postgresql') {
      const query = `INSERT INTO playlist_items (playlist_id, film_id, video_id, position)
         VALUES ($1, $2, $3, $4)
         RETURNING id`
      const { db } = await import('../config/database.js')
      const result = await db.query(query, params)
      
      res.status(201).json({
        id: result.rows[0].id,
        message: 'Item added to playlist successfully',
      })
    } else {
      const query = `INSERT INTO playlist_items (playlist_id, film_id, video_id, position)
         VALUES (?, ?, ?, ?)`
      const result = await executeUpdate(query, params)
      
      res.status(201).json({
        id: result.insertId,
        message: 'Item added to playlist successfully',
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const removeItemFromPlaylist = async (req, res) => {
  const { playlist_id, item_id } = req.params

  try {
    const query = dbType === 'postgresql'
      ? 'DELETE FROM playlist_items WHERE playlist_id = $1 AND id = $2'
      : 'DELETE FROM playlist_items WHERE playlist_id = ? AND id = ?'

    const result = await executeUpdate(query, [playlist_id, item_id])

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Item not found in playlist' })
      return
    }

    res.json({ message: 'Item removed from playlist successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

