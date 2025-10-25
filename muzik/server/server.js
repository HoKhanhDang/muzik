import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const dbPath = join(__dirname, 'videos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database schema
function initDatabase() {
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

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Routes

// Get all videos
app.get('/api/videos', (req, res) => {
  db.all('SELECT * FROM videos ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get video by ID
app.get('/api/videos/:id', (req, res) => {
  const { id } = req.params;
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
});

// Add new video
app.post('/api/videos', (req, res) => {
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
});

// Update video
app.put('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  const { title, video_id, youtube_url, thumbnail_url, duration } = req.body;
  
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
});

// Delete video
app.delete('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  
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
});

// Get video IDs for player
app.get('/api/videos/ids', (req, res) => {
  db.all('SELECT video_id FROM videos ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const videoIds = rows.map(row => row.video_id);
    res.json(videoIds);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});
