import express from 'express';
import sqlite3 from 'sqlite3';
import pg from 'pg';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database configuration
const dbType = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgresql'
let db;

// Initialize database based on type
if (dbType === 'postgresql') {
  // PostgreSQL/Supabase connection
  const { Pool } = pg;
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2, // Limit connections for serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  console.log('Connected to PostgreSQL/Supabase database');
  
  // Initialize database asynchronously
  initDatabase().catch(err => {
    console.error('Database initialization error:', err);
  });
} else {
  // SQLite connection (local development)
  const dbPath = join(__dirname, 'videos.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database');
      initDatabase();
    }
  });
}

// Initialize database schema
async function initDatabase() {
  if (dbType === 'postgresql') {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          video_id TEXT NOT NULL UNIQUE,
          youtube_url TEXT,
          thumbnail_url TEXT,
          duration TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Videos table ready');
    } catch (err) {
      console.error('Error creating table:', err.message);
    }
  } else {
    db.run(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        video_id TEXT NOT NULL UNIQUE,
        youtube_url TEXT,
        thumbnail_url TEXT,
        duration TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Videos table ready');
      }
    });
  }
}

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), dbType });
});

// Routes

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    if (dbType === 'postgresql') {
      const result = await db.query('SELECT * FROM videos ORDER BY created_at DESC');
      res.json(result.rows);
    } else {
      db.all('SELECT * FROM videos ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(rows);
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get video by ID
app.get('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    if (dbType === 'postgresql') {
      const result = await db.query('SELECT * FROM videos WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }
      res.json(result.rows[0]);
    } else {
      db.get('SELECT * FROM videos WHERE id = ?', [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (!row) {
          res.status(404).json({ error: 'Video not found' });
          return;
        }
        res.json(row);
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new video
app.post('/api/videos', async (req, res) => {
  const { title, video_id, youtube_url, thumbnail_url, duration } = req.body;
  
  // If youtube_url is provided, extract video_id
  let finalVideoId = video_id;
  if (youtube_url && !video_id) {
    finalVideoId = extractVideoId(youtube_url);
    if (!finalVideoId) {
      res.status(400).json({ error: 'Invalid YouTube URL' });
      return;
    }
  }
  
  if (!finalVideoId) {
    res.status(400).json({ error: 'Video ID is required' });
    return;
  }

  try {
    if (dbType === 'postgresql') {
      const result = await db.query(
        `INSERT INTO videos (title, video_id, youtube_url, thumbnail_url, duration)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [title || `Video ${finalVideoId}`, finalVideoId, youtube_url, thumbnail_url, duration]
      );
      res.json({ 
        id: result.rows[0].id, 
        message: 'Video added successfully',
        video_id: finalVideoId
      });
    } else {
      const sql = `
        INSERT INTO videos (title, video_id, youtube_url, thumbnail_url, duration)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.run(sql, [title || `Video ${finalVideoId}`, finalVideoId, youtube_url, thumbnail_url, duration], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({ error: 'Video already exists' });
          } else {
            res.status(500).json({ error: err.message });
          }
          return;
        }
        res.json({ 
          id: this.lastID, 
          message: 'Video added successfully',
          video_id: finalVideoId
        });
      });
    }
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation
      res.status(409).json({ error: 'Video already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update video
app.put('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, video_id, youtube_url, thumbnail_url, duration } = req.body;
  
  try {
    if (dbType === 'postgresql') {
      const result = await db.query(
        `UPDATE videos 
         SET title = $1, video_id = $2, youtube_url = $3, thumbnail_url = $4, duration = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [title, video_id, youtube_url, thumbnail_url, duration, id]
      );
      
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }
      res.json({ message: 'Video updated successfully' });
    } else {
      const sql = `
        UPDATE videos 
        SET title = ?, video_id = ?, youtube_url = ?, thumbnail_url = ?, duration = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      db.run(sql, [title, video_id, youtube_url, thumbnail_url, duration, id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Video not found' });
          return;
        }
        res.json({ message: 'Video updated successfully' });
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    if (dbType === 'postgresql') {
      const result = await db.query('DELETE FROM videos WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }
      res.json({ message: 'Video deleted successfully' });
    } else {
      db.run('DELETE FROM videos WHERE id = ?', [id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Video not found' });
          return;
        }
        res.json({ message: 'Video deleted successfully' });
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get video IDs for player
app.get('/api/videos/ids', async (req, res) => {
  try {
    if (dbType === 'postgresql') {
      const result = await db.query('SELECT video_id FROM videos ORDER BY created_at DESC');
      const videoIds = result.rows.map(row => row.video_id);
      res.json(videoIds);
    } else {
      db.all('SELECT video_id FROM videos ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        const videoIds = rows.map(row => row.video_id);
        res.json(videoIds);
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Using ${dbType} database`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (dbType === 'postgresql') {
    await db.end();
    console.log('Database connection closed');
  } else {
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Database connection closed');
    });
  }
  process.exit(0);
});

// Export for Vercel serverless
export default app;
