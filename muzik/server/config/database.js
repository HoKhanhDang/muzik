import sqlite3 from 'sqlite3'
import pg from 'pg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbType = process.env.DB_TYPE || 'sqlite'
let db

// Initialize database based on type
if (dbType === 'postgresql') {
  const { Pool } = pg
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
  console.log('Connected to PostgreSQL/Supabase database')
  initDatabase().catch((err) => {
    console.error('Database initialization error:', err)
  })
} else {
  const dbPath = join(__dirname, '..', 'videos.db')
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message)
    } else {
      console.log('Connected to SQLite database')
      initDatabase()
    }
  })
}

// Initialize database schema
async function initDatabase() {
  if (dbType === 'postgresql') {
    try {
      // Videos table
      await db.query(`
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
      console.log('Videos table ready')
      
      // Add user_id column if it doesn't exist (migration)
      try {
        await db.query(`ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`)
      } catch (err) {
        // Column might already exist, ignore error
      }

      // Remove UNIQUE constraint from video_id if it exists (migration)
      try {
        await db.query(`ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_video_id_key`)
      } catch (err) {
        // Constraint might not exist, ignore error
      }

      // Create indexes for better performance
      try {
        await db.query(`CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)`)
        await db.query(`CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id)`)
        await db.query(`CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC)`)
      } catch (err) {
        // Indexes might already exist, ignore error
      }

      // Users table
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          username TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Users table ready')

      // Films table
      await db.query(`
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
      console.log('Films table ready')

      // Music table
      await db.query(`
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
      console.log('Music table ready')
      
      // Create indexes for music table
      try {
        await db.query(`CREATE INDEX IF NOT EXISTS idx_music_user_id ON music(user_id)`)
        await db.query(`CREATE INDEX IF NOT EXISTS idx_music_created_at ON music(created_at DESC)`)
      } catch (err) {
        // Indexes might already exist, ignore error
      }

      // Playlists table
      await db.query(`
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
      console.log('Playlists table ready')
      
      // Add type column if it doesn't exist (migration)
      try {
        await db.query(`ALTER TABLE playlists ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('video', 'film')) DEFAULT 'film'`)
      } catch (err) {
        // Column might already exist, ignore error
      }
      
      // Migrate existing playlists: change 'music' to 'film'
      try {
        await db.query(`UPDATE playlists SET type = 'film' WHERE type = 'music'`)
      } catch (err) {
        // Ignore migration errors
      }

      // Playlist items table
      await db.query(`
        CREATE TABLE IF NOT EXISTS playlist_items (
          id SERIAL PRIMARY KEY,
          playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
          film_id INTEGER REFERENCES films(id) ON DELETE CASCADE,
          video_id TEXT,
          position INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Playlist items table ready')
      
      // Add film_id column if it doesn't exist (migration)
      try {
        await db.query(`ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS film_id INTEGER REFERENCES films(id) ON DELETE CASCADE`)
      } catch (err) {
        // Column might already exist, ignore error
      }
      
      // Change video_id from INTEGER to TEXT (migration)
      try {
        await db.query(`ALTER TABLE playlist_items ALTER COLUMN video_id TYPE TEXT`)
      } catch (err) {
        // Column might already be TEXT, ignore error
      }
      
      // Remove music_id column if it exists (migration from old schema)
      try {
        await db.query(`ALTER TABLE playlist_items DROP COLUMN IF EXISTS music_id`)
      } catch (err) {
        // Column might not exist, ignore error
      }
    } catch (err) {
      console.error('Error creating tables:', err.message)
    }
  } else {
    db.run(
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
          console.error('Error creating videos table:', err.message)
        } else {
          console.log('Videos table ready')
          // Add user_id column if it doesn't exist (migration)
          db.run(`ALTER TABLE videos ADD COLUMN user_id INTEGER REFERENCES users(id)`, (alterErr) => {
            // Column might already exist, ignore error
          })
          // Create indexes for better performance
          db.run(`CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)`, (indexErr) => {
            // Index might already exist, ignore error
          })
          db.run(`CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id)`, (indexErr) => {
            // Index might already exist, ignore error
          })
          db.run(`CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC)`, (indexErr) => {
            // Index might already exist, ignore error
          })
        }
      },
    )

    db.run(
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
          console.error('Error creating users table:', err.message)
        } else {
          console.log('Users table ready')
        }
      },
    )

    db.run(
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
          console.error('Error creating films table:', err.message)
        } else {
          console.log('Films table ready')
        }
      },
    )

    db.run(
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
          console.error('Error creating music table:', err.message)
        } else {
          console.log('Music table ready')
          // Create indexes for better performance
          db.run(`CREATE INDEX IF NOT EXISTS idx_music_user_id ON music(user_id)`, (indexErr) => {
            // Index might already exist, ignore error
          })
          db.run(`CREATE INDEX IF NOT EXISTS idx_music_created_at ON music(created_at DESC)`, (indexErr) => {
            // Index might already exist, ignore error
          })
        }
      },
    )

    db.run(
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
          console.error('Error creating playlists table:', err.message)
        } else {
          console.log('Playlists table ready')
          // Migrate existing playlists: change 'music' to 'film'
          db.run(`UPDATE playlists SET type = 'film' WHERE type = 'music'`, (migrateErr) => {
            // Ignore migration errors
          })
        }
      },
    )

    db.run(
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
          console.error('Error creating playlist_items table:', err.message)
        } else {
          console.log('Playlist items table ready')
          // Add film_id column if it doesn't exist (migration)
          db.run(`ALTER TABLE playlist_items ADD COLUMN film_id INTEGER REFERENCES films(id)`, (alterErr) => {
            // Column might already exist, ignore error
          })
          // Remove music_id column if it exists (migration)
          db.run(`ALTER TABLE playlist_items DROP COLUMN music_id`, (dropErr) => {
            // Column might not exist, ignore error
          })
        }
      },
    )
  }
}

export { db, dbType }

