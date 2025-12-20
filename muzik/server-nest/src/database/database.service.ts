import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as sqlite3 from 'sqlite3'
import * as pg from 'pg' // Use * as pg to avoid default export issues with some bundlers, or just import { Pool }
import { join } from 'path'

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: any
  private dbType: string
  private readonly logger = new Logger(DatabaseService.name)

  constructor(private configService: ConfigService) {
    this.dbType = this.configService.get<string>('DB_TYPE', 'sqlite')
  }

  async onModuleInit() {
    this.logger.log(`Initializing database with type: ${this.dbType}`)

    if (this.dbType === 'postgresql') {
      const { Pool } = pg
      this.db = new Pool({
        connectionString: this.configService.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      })
      this.logger.log('Connected to PostgreSQL/Supabase database')
      await this.initDatabaseSchema()
    } else {
      const dbPath = join(process.cwd(), 'videos.db')
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          this.logger.error('Error opening database:', err.message)
        } else {
          this.logger.log(`Connected to SQLite database at ${dbPath}`)
          this.initDatabaseSchema()
        }
      })
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection...')
    if (this.dbType === 'postgresql') {
      await this.db.end()
    } else {
      this.db.close((err) => {
        if (err) {
          this.logger.error(err.message)
        }
      })
    }
  }

  // Helper function to execute database queries
  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    if (this.dbType === 'postgresql') {
      const result = await this.db.query(query, params)
      return result.rows
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(query, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    }
  }

  // Helper function to execute database query (single row)
  async executeQueryOne(query: string, params: any[] = []): Promise<any> {
    if (this.dbType === 'postgresql') {
      const result = await this.db.query(query, params)
      return result.rows[0] || null
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(query, params, (err, row) => {
          if (err) reject(err)
          else resolve(row || null)
        })
      })
    }
  }

  // Helper function to execute database insert/update/delete
  async executeUpdate(
    query: string,
    params: any[] = [],
  ): Promise<{ rowCount: number; insertId?: any }> {
    if (this.dbType === 'postgresql') {
      const result = await this.db.query(query, params)
      return {
        rowCount: result.rowCount,
        insertId: result.rows[0]?.id,
      }
    } else {
      const db = this.db
      return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
          if (err) reject(err)
          else
            resolve({
              rowCount: this.changes,
              insertId: this.lastID,
            })
        })
      })
    }
  }

  getDbType(): string {
    return this.dbType
  }

  private async initDatabaseSchema() {
    if (this.dbType === 'postgresql') {
      try {
        // Videos table
        await this.db.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          video_id TEXT NOT NULL,
          youtube_url TEXT,
          thumbnail_url TEXT,
          duration TEXT,
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
        this.logger.log('Videos table ready')

        // Add user_id column if it doesn't exist (migration)
        try {
          await this.db.query(
            `ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`,
          )
        } catch (err) {
          // Column might already exist, ignore error
        }

        // Remove UNIQUE constraint from video_id if it exists (migration)
        try {
          await this.db.query(`ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_video_id_key`)
        } catch (err) {
          // Constraint might not exist, ignore error
        }

        // Create indexes for better performance
        try {
          await this.db.query(`CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)`)
          await this.db.query(`CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id)`)
          await this.db.query(
            `CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC)`,
          )
        } catch (err) {
          // Indexes might already exist, ignore error
        }

        // Users table
        await this.db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          username TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
        this.logger.log('Users table ready')

        // Films table
        await this.db.query(`
        CREATE TABLE IF NOT EXISTS films (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          director TEXT,
          genre TEXT,
          year INTEGER,
          description TEXT,
          thumbnail_url TEXT,
          duration TEXT,
          video_url TEXT,
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
        this.logger.log('Films table ready')

        // Music table
        await this.db.query(`
        CREATE TABLE IF NOT EXISTS music (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT,
          audio_url TEXT,
          thumbnail_url TEXT,
          duration TEXT,
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
        this.logger.log('Music table ready')

        // Create indexes for music table
        try {
          await this.db.query(`CREATE INDEX IF NOT EXISTS idx_music_user_id ON music(user_id)`)
          await this.db.query(
            `CREATE INDEX IF NOT EXISTS idx_music_created_at ON music(created_at DESC)`,
          )
        } catch (err) {
          // Indexes might already exist, ignore error
        }

        // Playlists table
        await this.db.query(`
        CREATE TABLE IF NOT EXISTS playlists (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT CHECK (type IN ('video', 'film')) DEFAULT 'film',
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
        this.logger.log('Playlists table ready')

        // Add type column if it doesn't exist (migration)
        try {
          await this.db.query(
            `ALTER TABLE playlists ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('video', 'film')) DEFAULT 'film'`,
          )
        } catch (err) {
          // Column might already exist, ignore error
        }

        // Migrate existing playlists: change 'music' to 'film'
        try {
          await this.db.query(`UPDATE playlists SET type = 'film' WHERE type = 'music'`)
        } catch (err) {
          // Ignore migration errors
        }

        // Playlist items table
        await this.db.query(`
        CREATE TABLE IF NOT EXISTS playlist_items (
          id SERIAL PRIMARY KEY,
          playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
          film_id INTEGER REFERENCES films(id) ON DELETE CASCADE,
          video_id TEXT,
          position INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
        this.logger.log('Playlist items table ready')

        // Add film_id column if it doesn't exist (migration)
        try {
          await this.db.query(
            `ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS film_id INTEGER REFERENCES films(id) ON DELETE CASCADE`,
          )
        } catch (err) {
          // Column might already exist, ignore error
        }

        // Change video_id from INTEGER to TEXT (migration)
        try {
          await this.db.query(`ALTER TABLE playlist_items ALTER COLUMN video_id TYPE TEXT`)
        } catch (err) {
          // Column might already be TEXT, ignore error
        }

        // Remove music_id column if it exists (migration from old schema)
        try {
          await this.db.query(`ALTER TABLE playlist_items DROP COLUMN IF EXISTS music_id`)
        } catch (err) {
          // Column might not exist, ignore error
        }
      } catch (err) {
        this.logger.error('Error creating tables:', err.message)
      }
    } else {
      this.db.run(
        `CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        video_id TEXT NOT NULL,
        youtube_url TEXT,
        thumbnail_url TEXT,
        duration TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
        (err) => {
          if (err) {
            this.logger.error('Error creating videos table:', err.message)
          } else {
            this.logger.log('Videos table ready')
            // Add user_id column if it doesn't exist (migration)
            this.db.run(
              `ALTER TABLE videos ADD COLUMN user_id INTEGER REFERENCES users(id)`,
              (alterErr) => {
                // Column might already exist, ignore error
              },
            )
            // Create indexes for better performance
            this.db.run(
              `CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)`,
              (indexErr) => {
                // Index might already exist, ignore error
              },
            )
            this.db.run(
              `CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id)`,
              (indexErr) => {
                // Index might already exist, ignore error
              },
            )
            this.db.run(
              `CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC)`,
              (indexErr) => {
                // Index might already exist, ignore error
              },
            )
          }
        },
      )

      this.db.run(
        `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        username TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
        (err) => {
          if (err) {
            this.logger.error('Error creating users table:', err.message)
          } else {
            this.logger.log('Users table ready')
          }
        },
      )

      this.db.run(
        `CREATE TABLE IF NOT EXISTS films (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        director TEXT,
        genre TEXT,
        year INTEGER,
        description TEXT,
        thumbnail_url TEXT,
        duration TEXT,
        video_url TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
        (err) => {
          if (err) {
            this.logger.error('Error creating films table:', err.message)
          } else {
            this.logger.log('Films table ready')
          }
        },
      )

      this.db.run(
        `CREATE TABLE IF NOT EXISTS music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT,
        audio_url TEXT,
        thumbnail_url TEXT,
        duration TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
        (err) => {
          if (err) {
            this.logger.error('Error creating music table:', err.message)
          } else {
            this.logger.log('Music table ready')
            // Create indexes for better performance
            this.db.run(
              `CREATE INDEX IF NOT EXISTS idx_music_user_id ON music(user_id)`,
              (indexErr) => {
                // Index might already exist, ignore error
              },
            )
            this.db.run(
              `CREATE INDEX IF NOT EXISTS idx_music_created_at ON music(created_at DESC)`,
              (indexErr) => {
                // Index might already exist, ignore error
              },
            )
          }
        },
      )

      this.db.run(
        `CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT CHECK (type IN ('video', 'film')) DEFAULT 'film',
        user_id INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
        (err) => {
          if (err) {
            this.logger.error('Error creating playlists table:', err.message)
          } else {
            this.logger.log('Playlists table ready')
            // Migrate existing playlists: change 'music' to 'film'
            this.db.run(`UPDATE playlists SET type = 'film' WHERE type = 'music'`, (migrateErr) => {
              // Ignore migration errors
            })
          }
        },
      )

      this.db.run(
        `CREATE TABLE IF NOT EXISTS playlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
        film_id INTEGER REFERENCES films(id) ON DELETE CASCADE,
        video_id TEXT,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
        (err) => {
          if (err) {
            this.logger.error('Error creating playlist_items table:', err.message)
          } else {
            this.logger.log('Playlist items table ready')
            // Add film_id column if it doesn't exist (migration)
            this.db.run(
              `ALTER TABLE playlist_items ADD COLUMN film_id INTEGER REFERENCES films(id)`,
              (alterErr) => {
                // Column might already exist, ignore error
              },
            )
            // Remove music_id column if it exists (migration)
            this.db.run(`ALTER TABLE playlist_items DROP COLUMN music_id`, (dropErr) => {
              // Column might not exist, ignore error
            })
          }
        },
      )
    }
  }
}
