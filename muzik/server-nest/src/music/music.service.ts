import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class MusicService {
  constructor(private readonly db: DatabaseService) {}

  private getPlaceholder(index: number): string {
    return this.db.getDbType() === 'postgresql' ? `$${index}` : '?'
  }

  async getAllMusic(userId?: string) {
    try {
      let query: string
      let params: any[]

      if (userId) {
        query = `SELECT * FROM music WHERE user_id = ${this.getPlaceholder(1)} ORDER BY created_at DESC`
        params = [userId]
      } else {
        query = 'SELECT * FROM music ORDER BY created_at DESC'
        params = []
      }

      return await this.db.executeQuery(query, params)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async getMusicById(id: string | number) {
    try {
      const query = `SELECT * FROM music WHERE id = ${this.getPlaceholder(1)}`
      const music = await this.db.executeQueryOne(query, [id])

      if (!music) {
        throw new NotFoundException('Music not found')
      }
      return music
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async createMusic(data: any) {
    const { title, artist, audio_url, thumbnail_url, duration, user_id } = data

    if (!title) {
      throw new BadRequestException('Title is required')
    }

    try {
      const params = [
        title,
        artist || null,
        audio_url || null,
        thumbnail_url || null,
        duration || null,
        user_id || null,
      ]
      const dbType = this.db.getDbType()

      let result
      if (dbType === 'postgresql') {
        const query = `INSERT INTO music (title, artist, audio_url, thumbnail_url, duration, user_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`
        result = await this.db.executeUpdate(query, params)
      } else {
        const query = `INSERT INTO music (title, artist, audio_url, thumbnail_url, duration, user_id)
           VALUES (?, ?, ?, ?, ?, ?)`
        result = await this.db.executeUpdate(query, params)
      }

      return {
        id: result.insertId,
        message: 'Music added successfully',
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async updateMusic(id: string | number, data: any) {
    const { title, artist, audio_url, thumbnail_url, duration } = data

    try {
      const dbType = this.db.getDbType()
      let query: string

      if (dbType === 'postgresql') {
        query = `UPDATE music
           SET title = $1, artist = $2, audio_url = $3, thumbnail_url = $4, duration = $5, updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`
      } else {
        query = `UPDATE music
           SET title = ?, artist = ?, audio_url = ?, thumbnail_url = ?, duration = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
      }

      const params = [title, artist, audio_url, thumbnail_url, duration, id]
      const result = await this.db.executeUpdate(query, params)

      if (result.rowCount === 0) {
        throw new NotFoundException('Music not found')
      }

      return { message: 'Music updated successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async deleteMusic(id: string | number) {
    try {
      const query = `DELETE FROM music WHERE id = ${this.getPlaceholder(1)}`
      const result = await this.db.executeUpdate(query, [id])

      if (result.rowCount === 0) {
        throw new NotFoundException('Music not found')
      }

      return { message: 'Music deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }
}
