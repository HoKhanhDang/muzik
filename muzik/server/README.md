# Muzik Server API

Express server with SQLite (local) and PostgreSQL/Supabase (production) support.

## Local Development

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp env.example .env
```

3. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:3001`

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (use the one under "Connection pooling")
5. Update your `.env` file:
```env
DB_TYPE=postgresql
DATABASE_URL=postgresql://...
```

## Vercel Deployment

### Prerequisites
- Supabase account and project
- Vercel account

### Steps

1. **Set up Supabase:**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your connection string from Settings → Database
   - Run this SQL in Supabase SQL Editor to create the table:
   ```sql
   CREATE TABLE IF NOT EXISTS videos (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     video_id TEXT NOT NULL UNIQUE,
     youtube_url TEXT,
     thumbnail_url TEXT,
     duration TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Deploy to Vercel:**

   **Option A: Using Vercel CLI**
   ```bash
   npm i -g vercel
   cd server
   vercel
   ```

   **Option B: Using GitHub**
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Set these environment variables in Vercel:
     - `DB_TYPE=postgresql`
     - `DATABASE_URL` (your Supabase connection string)
   - Deploy

3. **Get your API URL:**
   - After deployment, Vercel will give you a URL like: `https://your-app.vercel.app`
   - Your API will be available at: `https://your-app.vercel.app/api/*`

## API Endpoints

### Public Endpoints
- `GET /health` - Health check

### Auth Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (requires token)
- `GET /api/auth/profile/:id` - Get user profile by ID (requires token)

### Video Endpoints
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get video by ID
- `POST /api/videos` - Add new video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/ids` - Get all video IDs

### Music Endpoints
- `GET /api/music` - Get all music
- `GET /api/music/:id` - Get music by ID
- `POST /api/music` - Create music
- `PUT /api/music/:id` - Update music
- `DELETE /api/music/:id` - Delete music

### Playlist Endpoints
- `GET /api/playlists` - Get all playlists
- `GET /api/playlists/:id` - Get playlist by ID
- `POST /api/playlists` - Create playlist
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:playlist_id/items` - Add item to playlist
- `DELETE /api/playlists/:playlist_id/items/:item_id` - Remove item from playlist

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. 

### How to use:
1. **Register/Login** to get a token:
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

2. **Include token** in subsequent requests:
```bash
Authorization: Bearer <your_token_here>
```

3. **Use middleware** to protect routes:
```javascript
import { authenticateToken } from './middleware/authMiddleware.js'

router.get('/protected', authenticateToken, yourController)
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_TYPE` | Database type: `sqlite` or `postgresql` | Yes | `sqlite` |
| `DATABASE_URL` | PostgreSQL connection string (required if DB_TYPE=postgresql) | Conditional | - |
| `PORT` | Server port | No | `3001` |
| `NODE_ENV` | Environment: `development` or `production` | No | `development` |
| `JWT_SECRET` | Secret key for JWT token signing | Yes | - |
| `JWT_EXPIRES_IN` | Token expiration time | No | `7d` |

