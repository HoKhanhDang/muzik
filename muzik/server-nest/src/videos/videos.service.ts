import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { extractVideoId } from '../common/utils'

@Injectable()
export class VideosService {
  constructor(private readonly db: DatabaseService) {}

  private getPlaceholder(index: number): string {
    return this.db.getDbType() === 'postgresql' ? `$${index}` : '?'
  }

  async getAllVideos(userId?: string) {
    try {
      let query: string
      let params: any[]

      if (userId) {
        query = `SELECT * FROM videos WHERE user_id = ${this.getPlaceholder(1)} ORDER BY created_at DESC`
        params = [userId]
      } else {
        query = 'SELECT * FROM videos ORDER BY created_at DESC'
        params = []
      }

      return await this.db.executeQuery(query, params)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async getVideoById(id: string | number) {
    try {
      const query = `SELECT * FROM videos WHERE id = ${this.getPlaceholder(1)}`
      const video = await this.db.executeQueryOne(query, [id])

      if (!video) {
        throw new NotFoundException('Video not found')
      }
      return video
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async createVideo(data: {
    title: string
    video_id: string
    youtube_url?: string
    thumbnail_url?: string
    duration?: string
    user_id?: string | number
  }) {
    let { title, video_id, youtube_url, thumbnail_url, duration, user_id } = data

    let finalVideoId = video_id
    if (youtube_url && !video_id) {
      finalVideoId = extractVideoId(youtube_url)
      if (!finalVideoId) {
        throw new BadRequestException('Invalid YouTube URL')
      }
    }

    if (!finalVideoId) {
      throw new BadRequestException('Video ID is required')
    }

    try {
      const dbType = this.db.getDbType()
      const params = [
        title || `Video ${finalVideoId}`,
        finalVideoId,
        youtube_url,
        thumbnail_url,
        duration,
        user_id || null,
      ]

      let result
      if (dbType === 'postgresql') {
        const query = `INSERT INTO videos (title, video_id, youtube_url, thumbnail_url, duration, user_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`
        // We need to bypass executeUpdate slightly because we want the returning ID from PG query in a specific way using executeQueryOne which returns a row.
        // Or executeUpdate supports it? My executeUpdate returns { rowCount, insertId }.
        // For PG, my executeUpdate implementation: insertId: result.rows[0]?.id. So it works!

        result = await this.db.executeUpdate(query, params)
      } else {
        const query = `INSERT INTO videos (title, video_id, youtube_url, thumbnail_url, duration, user_id)
           VALUES (?, ?, ?, ?, ?, ?)`
        result = await this.db.executeUpdate(query, params)
      }

      // Since executeUpdate unifies the return structure:
      return {
        id: result.insertId, // Note: SQLite uses numbers, PG uses numbers/strings depending on driver config
        message: 'Video added successfully',
        video_id: finalVideoId,
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async updateVideo(
    id: string | number,
    data: {
      title?: string
      video_id?: string
      youtube_url?: string
      thumbnail_url?: string
      duration?: string
    },
  ) {
    const { title, video_id, youtube_url, thumbnail_url, duration } = data

    try {
      const dbType = this.db.getDbType()
      let query: string

      if (dbType === 'postgresql') {
        query = `UPDATE videos
           SET title = $1, video_id = $2, youtube_url = $3, thumbnail_url = $4, duration = $5, updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`
      } else {
        query = `UPDATE videos
           SET title = ?, video_id = ?, youtube_url = ?, thumbnail_url = ?, duration = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
      }

      const params = [title, video_id, youtube_url, thumbnail_url, duration, id]
      const result = await this.db.executeUpdate(query, params)

      if (result.rowCount === 0) {
        throw new NotFoundException('Video not found')
      }

      return { message: 'Video updated successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async deleteVideo(id: string | number) {
    try {
      const query = `DELETE FROM videos WHERE id = ${this.getPlaceholder(1)}`
      const result = await this.db.executeUpdate(query, [id])

      if (result.rowCount === 0) {
        throw new NotFoundException('Video not found')
      }

      return { message: 'Video deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async getVideoIds(userId?: string) {
    try {
      let query: string
      let params: any[]

      if (userId) {
        query = `SELECT video_id FROM videos WHERE user_id = ${this.getPlaceholder(1)} ORDER BY created_at DESC`
        params = [userId]
      } else {
        query = 'SELECT video_id FROM videos ORDER BY created_at DESC'
        params = []
      }

      const videos = await this.db.executeQuery(query, params)
      return videos.map((row) => row.video_id)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
