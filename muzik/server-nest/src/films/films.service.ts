import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class FilmsService {
  constructor(private readonly db: DatabaseService) {}

  private getPlaceholder(index: number): string {
    return this.db.getDbType() === 'postgresql' ? `$${index}` : '?'
  }

  async getAllFilms(userId?: string) {
    try {
      let query: string
      let params: any[]

      if (userId) {
        query = `SELECT * FROM films WHERE user_id = ${this.getPlaceholder(1)} ORDER BY created_at DESC`
        params = [userId]
      } else {
        query = 'SELECT * FROM films ORDER BY created_at DESC'
        params = []
      }

      return await this.db.executeQuery(query, params)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async getFilmById(id: string | number) {
    try {
      const query = `SELECT * FROM films WHERE id = ${this.getPlaceholder(1)}`
      const film = await this.db.executeQueryOne(query, [id])

      if (!film) {
        throw new NotFoundException('Film not found')
      }
      return film
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async createFilm(data: any) {
    const {
      title,
      director,
      genre,
      year,
      description,
      thumbnail_url,
      duration,
      video_url,
      user_id,
    } = data

    if (!title) {
      throw new BadRequestException('Title is required')
    }

    try {
      const params = [
        title,
        director || null,
        genre || null,
        year || null,
        description || null,
        thumbnail_url || null,
        duration || null,
        video_url || null,
        user_id || null,
      ]
      const dbType = this.db.getDbType()

      let result
      if (dbType === 'postgresql') {
        const query = `INSERT INTO films (title, director, genre, year, description, thumbnail_url, duration, video_url, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`
        result = await this.db.executeUpdate(query, params)
      } else {
        const query = `INSERT INTO films (title, director, genre, year, description, thumbnail_url, duration, video_url, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        result = await this.db.executeUpdate(query, params)
      }

      return {
        id: result.insertId,
        message: 'Film added successfully',
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async updateFilm(id: string | number, data: any) {
    const { title, director, genre, year, description, thumbnail_url, duration, video_url } = data

    try {
      const dbType = this.db.getDbType()
      let query: string

      if (dbType === 'postgresql') {
        query = `UPDATE films
           SET title = $1, director = $2, genre = $3, year = $4, description = $5, thumbnail_url = $6, duration = $7, video_url = $8, updated_at = CURRENT_TIMESTAMP
           WHERE id = $9`
      } else {
        query = `UPDATE films
           SET title = ?, director = ?, genre = ?, year = ?, description = ?, thumbnail_url = ?, duration = ?, video_url = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
      }

      const params = [
        title,
        director,
        genre,
        year,
        description,
        thumbnail_url,
        duration,
        video_url,
        id,
      ]
      const result = await this.db.executeUpdate(query, params)

      if (result.rowCount === 0) {
        throw new NotFoundException('Film not found')
      }

      return { message: 'Film updated successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async deleteFilm(id: string | number) {
    try {
      const query = `DELETE FROM films WHERE id = ${this.getPlaceholder(1)}`
      const result = await this.db.executeUpdate(query, [id])

      if (result.rowCount === 0) {
        throw new NotFoundException('Film not found')
      }

      return { message: 'Film deleted successfully' }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }
}
