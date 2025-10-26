-- Muzik App - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create the videos table
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

-- Create an index on video_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- Add updated_at trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT 'Database setup complete!' as status;

