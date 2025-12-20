import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import * as crypto from 'crypto'
import * as jwt from 'jsonwebtoken'

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

  constructor(private readonly db: DatabaseService) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
  }

  private generateToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES_IN as any,
      },
    )
  }

  private getPlaceholder(index: number): string {
    return this.db.getDbType() === 'postgresql' ? `$${index}` : '?'
  }

  async register(data: { email?: string; password?: string; username?: string }) {
    const { email, password, username } = data

    if (!email || !password) {
      throw new BadRequestException('Email and password are required')
    }

    try {
      const passwordHash = this.hashPassword(password)

      let user
      const dbType = this.db.getDbType()

      if (dbType === 'postgresql') {
        const query = `INSERT INTO users (email, password_hash, username)
           VALUES ($1, $2, $3)
           RETURNING id, email, username, created_at`
        // Use executeQueryOne to get the returned row directly
        user = await this.db.executeQueryOne(query, [email, passwordHash, username || null])
      } else {
        const query = `INSERT INTO users (email, password_hash, username)
           VALUES (?, ?, ?)`
        const result = await this.db.executeUpdate(query, [email, passwordHash, username || null])

        const selectQuery = 'SELECT id, email, username, created_at FROM users WHERE id = ?'
        user = await this.db.executeQueryOne(selectQuery, [result.insertId])
      }

      const token = this.generateToken(user)

      return {
        message: 'User registered successfully',
        user,
        token,
      }
    } catch (error) {
      if (
        error.code === '23505' ||
        (error.message && error.message.includes('UNIQUE constraint failed'))
      ) {
        throw new ConflictException('Email already exists')
      } else {
        throw new InternalServerErrorException(error.message)
      }
    }
  }

  async login(data: { email?: string; password?: string }) {
    const { email, password } = data

    if (!email || !password) {
      throw new BadRequestException('Email and password are required')
    }

    try {
      const passwordHash = this.hashPassword(password)
      const query = `SELECT id, email, username FROM users WHERE email = ${this.getPlaceholder(1)} AND password_hash = ${this.getPlaceholder(2)}`

      const user = await this.db.executeQueryOne(query, [email, passwordHash])

      if (!user) {
        throw new UnauthorizedException('Invalid email or password')
      }

      const token = this.generateToken(user)

      return {
        message: 'Login successful',
        user,
        token,
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      throw new InternalServerErrorException(error.message)
    }
  }

  async getProfile(userId: string | number) {
    if (!userId) {
      throw new BadRequestException('User ID is required')
    }

    try {
      const query = `SELECT id, email, username, created_at FROM users WHERE id = ${this.getPlaceholder(1)}`
      const user = await this.db.executeQueryOne(query, [userId])

      if (!user) {
        throw new BadRequestException('User not found') // Matching original 404 behavior essentially, but simpler to use BadRequest or NotFound
      }

      return user
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
