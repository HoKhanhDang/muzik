import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class PlaylistsService {
  constructor(private readonly db: DatabaseService) {}

  private getPlaceholder(index: number): string {
    return this.db.getDbType() === 'postgresql' ? `$${index}` : '?'
  }

  async getAllPlaylists(userId?: string) {
    try {
      let query: string
      let params: any[]
      const dbType = this.db.getDbType()

      if (userId) {
        query =
          dbType === 'postgresql'
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
        params = [userId]
      } else {
        query =
          dbType === 'postgresql'
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

      const playlists = await this.db.executeQuery(query, params)

      // Convert items_count to number
      return playlists.map((p) => ({
        ...p,
        items_count: Number(p.items_count || 0),
      }))
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async getPlaylistById(id: string | number) {
    try {
      const query = `SELECT * FROM playlists WHERE id = ${this.getPlaceholder(1)}`
      const playlist = await this.db.executeQueryOne(query, [id])

      if (!playlist) {
        throw new NotFoundException('Playlist not found')
      }

      const dbType = this.db.getDbType()
      const itemsQuery =
        dbType === 'postgresql'
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

      const items = await this.db.executeQuery(itemsQuery, [id])

      return {
        ...playlist,
        items,
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async createPlaylist(data: any) {
    const { name, description, type, user_id } = data

    if (!name) {
      throw new BadRequestException('Playlist name is required')
    }

    let playlistType = 'film'
    if (type != null && type !== '') {
      const normalizedType = String(type).toLowerCase().trim()
      if (normalizedType === 'video' || normalizedType === 'film') {
        playlistType = normalizedType
      } else {
        throw new BadRequestException('Playlist type must be "video" or "film"')
      }
    }

    try {
      const params = [name, description || null, String(playlistType), user_id || null]
      const dbType = this.db.getDbType()

      let result
      if (dbType === 'postgresql') {
        const query = `INSERT INTO playlists (name, description, type, user_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id`
        result = await this.db.executeUpdate(query, params)
      } else {
        const query = `INSERT INTO playlists (name, description, type, user_id)
           VALUES (?, ?, ?, ?)`
        result = await this.db.executeUpdate(query, params)
      }

      return {
        id: result.insertId,
        message: 'Playlist created successfully',
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async updatePlaylist(id: string | number, data: any) {
    const { name, description } = data

    try {
      const dbType = this.db.getDbType()
      let query: string

      if (dbType === 'postgresql') {
        query = `UPDATE playlists
           SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`
      } else {
        query = `UPDATE playlists
           SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
      }

      const params = [name, description, id]
      const result = await this.db.executeUpdate(query, params)

      if (result.rowCount === 0) {
        throw new NotFoundException('Playlist not found')
      }

      return { message: 'Playlist updated successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async deletePlaylist(id: string | number) {
    try {
      const query = `DELETE FROM playlists WHERE id = ${this.getPlaceholder(1)}`
      const result = await this.db.executeUpdate(query, [id])

      if (result.rowCount === 0) {
        throw new NotFoundException('Playlist not found')
      }

      return { message: 'Playlist deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async addItemToPlaylist(playlistId: string | number, data: any) {
    const { film_id, video_id, position } = data

    if (!film_id && !video_id) {
      throw new BadRequestException('Either film_id or video_id is required')
    }

    try {
      // Get playlist to check type
      const playlist = await this.db.executeQueryOne(
        `SELECT type FROM playlists WHERE id = ${this.getPlaceholder(1)}`,
        [playlistId],
      )

      if (!playlist) {
        throw new NotFoundException('Playlist not found')
      }

      if (playlist.type === 'film' && video_id) {
        throw new BadRequestException('Cannot add video to a film playlist')
      }
      if (playlist.type === 'video' && film_id) {
        throw new BadRequestException('Cannot add film to a video playlist')
      }

      const params = [playlistId, film_id || null, video_id || null, position || null]
      const dbType = this.db.getDbType()

      let result
      if (dbType === 'postgresql') {
        const query = `INSERT INTO playlist_items (playlist_id, film_id, video_id, position)
           VALUES ($1, $2, $3, $4)
           RETURNING id`
        result = await this.db.executeUpdate(query, params)
      } else {
        const query = `INSERT INTO playlist_items (playlist_id, film_id, video_id, position)
           VALUES (?, ?, ?, ?)`
        result = await this.db.executeUpdate(query, params)
      }

      return {
        id: result.insertId,
        message: 'Item added to playlist successfully',
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async removeItemFromPlaylist(playlistId: string | number, itemId: string | number) {
    try {
      const query = `DELETE FROM playlist_items WHERE playlist_id = ${this.getPlaceholder(1)} AND id = ${this.getPlaceholder(2)}`
      const result = await this.db.executeUpdate(query, [playlistId, itemId])

      if (result.rowCount === 0) {
        throw new NotFoundException('Item not found in playlist')
      }

      return { message: 'Item removed from playlist successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }
}
