# 🎵 Muzik - Personal YouTube Music Player

A personal background music player that stores your YouTube videos in SQLite and plays them automatically.

## Features

- 🎵 **Auto-play background music** - Videos start automatically and cycle through your playlist
- 💾 **SQLite storage** - All your videos are stored locally in a SQLite database
- ➕ **Easy video management** - Add videos by YouTube URL or video ID
- 🎮 **Full control** - Play, pause, skip, mute, and delete videos
- 📱 **Modern UI** - Clean, responsive interface with dark theme
- 🔄 **Auto-next** - Automatically plays the next video when current one ends
- ⚡ **Instant Play** - Play any YouTube video instantly without adding to playlist
- 📜 **Play History** - Track your instant play history with thumbnails and titles
- ➕ **Add from History** - Easily add videos from history to your permanent playlist with full video information

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd muzik/server
npm install
```

### 2. Start the Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:3001`

### 3. Start the Frontend

In a new terminal, go back to the main project directory:

```bash
cd muzik
npm run dev
```

The Vue app will run on `http://localhost:5173`

## How to Use

### Instant Play Tab ⚡

1. Enter a **YouTube URL** or **Video ID** in the input field
2. Click **"▶️ Play Now"** to play instantly
3. Videos played here are automatically added to your **History**
4. Each history item shows:
   - Thumbnail preview with play overlay
   - Video title (auto-fetched from YouTube)
   - Timestamp when played
5. From History, you can:
   - Click to replay the video
   - Click **➕** button to add to permanent playlist with full details
   - See **✓** badge if already in playlist

### Playlist Tab 📋

1. Click the **"+ Add Video"** button
2. Enter either:
   - **YouTube URL**: `https://youtube.com/watch?v=XbLemOwzdxk`
   - **Video ID**: `XbLemOwzdxk`
3. Optionally add a title and duration (or auto-fetch)
4. Click **"Add Video"**

### Playing Music

- Videos start playing automatically when you load the page
- Use the **⏮️** and **⏭️** buttons to navigate
- Click **🔊** to toggle sound (starts muted for background playback)
- Click any video in the playlist to jump to it
- Videos automatically advance to the next one when finished

### Managing Your Library

- **Delete videos**: Click the 🗑️ button next to any video
- **View all videos**: Your complete library is shown in the playlist
- **Current track info**: See what's playing with title and video ID
- **Clear history**: Click 🗑️ Clear in history section to remove all history

## Database Schema

The SQLite database stores videos with the following structure:

```sql
CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  video_id TEXT NOT NULL UNIQUE,
  youtube_url TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /api/videos` - Get all videos
- `POST /api/videos` - Add new video
- `GET /api/videos/:id` - Get specific video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/ids` - Get just video IDs for player

## File Structure

```
muzik/
├── src/
│   └── App.vue          # Main Vue application
├── server/
│   ├── server.js        # Express server with SQLite
│   ├── package.json     # Server dependencies
│   └── videos.db        # SQLite database (created automatically)
└── package.json         # Frontend dependencies
```

## Technical Details

- **Frontend**: Vue 3 with Composition API
- **Backend**: Express.js with SQLite3
- **YouTube Integration**: YouTube IFrame API
- **Database**: SQLite (local file storage)
- **Styling**: Custom CSS with modern dark theme

## Troubleshooting

### Server won't start
- Make sure you're in the `muzik/server` directory
- Run `npm install` to install dependencies
- Check if port 3001 is available

### Videos not loading
- Ensure the backend server is running on port 3001
- Check browser console for API errors
- Verify YouTube video IDs are valid

### Auto-play not working
- Modern browsers block autoplay with sound
- The player starts muted - click the 🔊 button to enable sound
- Some videos may require user interaction first

Enjoy your personal music collection! 🎶