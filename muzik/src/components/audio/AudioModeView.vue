<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  currentVideo: Object,
  videos: Array,
  currentVideoIndex: Number,
  volume: Number,
  isMuted: Boolean,
  isPlayerReady: Boolean,
  isPlaying: Boolean,
})

const emit = defineEmits([
  'play-video',
  'play-next',
  'play-previous',
  'toggle-mute',
  'set-volume',
  'toggle-play',
])

const showVolumeSlider = ref(false)

const currentThumbnail = computed(() => {
  if (props.currentVideo?.thumbnail_url) {
    return props.currentVideo.thumbnail_url
  }
  if (props.currentVideo?.video_id) {
    return `https://img.youtube.com/vi/${props.currentVideo.video_id}/maxresdefault.jpg`
  }
  return null
})

const currentTitle = computed(() => {
  return props.currentVideo?.title || 'No track playing'
})

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handlePlayVideo = (index) => {
  emit('play-video', index)
}

const handleTogglePlay = () => {
  emit('toggle-play')
}

const handlePrevious = () => {
  emit('play-previous')
}

const handleNext = () => {
  emit('play-next')
}

const handleToggleMute = () => {
  emit('toggle-mute')
}

const handleVolumeChange = (event) => {
  emit('set-volume', Number(event.target.value))
}

const handleToggleVolumeSlider = () => {
  showVolumeSlider.value = !showVolumeSlider.value
}
</script>

<template>
  <div class="audio-mode-container">
    <!-- Main Content Area -->
    <div class="audio-main">
      <!-- Album Art & Info Section -->
      <div class="album-section">
        <div class="album-art-wrapper">
          <img 
            v-if="currentThumbnail" 
            :src="currentThumbnail" 
            :alt="currentTitle"
            class="album-art"
            @error="$event.target.src = 'https://via.placeholder.com/400x400?text=No+Image'"
          />
          <div v-else class="album-art-placeholder">
            <span class="music-icon">🎵</span>
          </div>
        </div>
        
        <div class="track-info">
          <h1 class="track-title">{{ currentTitle }}</h1>
          <p class="track-artist">Muzik Player</p>
        </div>
      </div>

      <!-- Playlist Section -->
      <div class="playlist-section">
        <div class="playlist-header">
          <h2>Queue</h2>
          <span class="track-count">{{ videos.length }} tracks</span>
        </div>
        
        <div class="playlist-items">
          <div 
            v-for="(video, index) in videos" 
            :key="video.id"
            @click="handlePlayVideo(index)"
            class="playlist-item"
            :class="{ 'active': index === currentVideoIndex }"
          >
            <div class="item-number">
              <span v-if="index !== currentVideoIndex">{{ index + 1 }}</span>
              <svg v-else class="playing-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            
            <div class="item-thumbnail">
              <img 
                :src="`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`" 
                :alt="video.title"
                @error="$event.target.src = 'https://via.placeholder.com/80x45?text=No+Image'"
              />
            </div>
            
            <div class="item-info">
              <div class="item-title">{{ video.title }}</div>
              <div class="item-artist">Muzik Player</div>
            </div>
            
            <div class="item-duration">
              {{ video.duration || '--:--' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Player Controls Section -->
    <div class="player-controls-bar">
      <div class="controls-wrapper">
        <!-- Left: Current track mini info -->
        <div class="mini-track-info">
          <div class="mini-thumbnail" v-if="currentThumbnail">
            <img :src="currentThumbnail" :alt="currentTitle" />
          </div>
          <div class="mini-text">
            <div class="mini-title">{{ currentTitle }}</div>
            <div class="mini-artist">Muzik Player</div>
          </div>
        </div>

        <!-- Center: Playback controls -->
        <div class="playback-controls">
          <button @click="handlePrevious" class="control-btn" :disabled="videos.length <= 1">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          <button @click="handleTogglePlay" class="control-btn play-btn">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>

          <button @click="handleNext" class="control-btn" :disabled="videos.length <= 1">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        <!-- Right: Volume controls -->
        <div class="volume-controls">
          <button @click="handleToggleMute" class="control-btn volume-btn">
            <svg v-if="!isMuted && volume > 50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <svg v-else-if="!isMuted && volume > 0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          </button>
          
          <div class="volume-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              :value="volume"
              @input="handleVolumeChange"
              class="volume-slider"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-mode-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d1b3d 50%, #1e1e2e 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.audio-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 40px;
  overflow: hidden;
  min-height: 0;
}

/* Album Section */
.album-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 20px;
}

.album-art-wrapper {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.album-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.album-art-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-icon {
  font-size: 120px;
  opacity: 0.5;
}

.track-info {
  text-align: center;
  width: 100%;
  padding: 0 20px;
}

.track-title {
  font-size: 32px;
  font-weight: bold;
  color: white;
  margin: 0 0 10px 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.track-artist {
  font-size: 18px;
  color: #aaa;
  margin: 0;
}

/* Playlist Section */
.playlist-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 20px;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.playlist-header h2 {
  color: white;
  font-size: 24px;
  margin: 0;
}

.track-count {
  color: #aaa;
  font-size: 14px;
}

.playlist-items {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.playlist-items::-webkit-scrollbar {
  width: 8px;
}

.playlist-items::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-items::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.playlist-items::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.playlist-item {
  display: grid;
  grid-template-columns: 40px 80px 1fr 60px;
  gap: 15px;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 5px;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(78, 205, 196, 0.2);
}

.item-number {
  text-align: center;
  color: #aaa;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
}

.playing-icon {
  width: 20px;
  height: 20px;
  color: #4ecdc4;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.item-thumbnail {
  width: 80px;
  height: 45px;
  border-radius: 4px;
  overflow: hidden;
}

.item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-item.active .item-title {
  color: #4ecdc4;
}

.item-artist {
  color: #aaa;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-duration {
  color: #aaa;
  font-size: 13px;
  text-align: right;
}

/* Player Controls Bar */
.player-controls-bar {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 40px;
  flex-shrink: 0;
}

.controls-wrapper {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Mini Track Info */
.mini-track-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.mini-thumbnail {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.mini-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mini-text {
  min-width: 0;
  flex: 1;
}

.mini-title {
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-artist {
  color: #aaa;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Playback Controls */
.playback-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  justify-content: center;
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
}

.play-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
}

.play-btn svg {
  width: 24px;
  height: 24px;
}

/* Volume Controls */
.volume-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.volume-btn {
  background: transparent;
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.volume-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.volume-btn svg {
  width: 22px;
  height: 22px;
}

.volume-slider-container {
  width: 100px;
}

.volume-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

/* Tablet */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .audio-main {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 30px;
  }

  .album-section {
    gap: 20px;
  }

  .album-art-wrapper {
    max-width: 300px;
  }

  .track-title {
    font-size: 24px;
  }

  .track-artist {
    font-size: 16px;
  }

  .player-controls-bar {
    padding: 15px 30px;
  }

  .controls-wrapper {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .mini-track-info {
    justify-content: center;
  }

  .volume-controls {
    justify-content: center;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .audio-main {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }

  .album-section {
    gap: 15px;
    padding: 10px;
  }

  .album-art-wrapper {
    max-width: 250px;
  }

  .music-icon {
    font-size: 80px;
  }

  .track-title {
    font-size: 20px;
  }

  .track-artist {
    font-size: 14px;
  }

  .playlist-section {
    padding: 15px;
  }

  .playlist-header h2 {
    font-size: 20px;
  }

  .playlist-item {
    grid-template-columns: 30px 60px 1fr 50px;
    gap: 10px;
    padding: 10px;
  }

  .item-thumbnail {
    width: 60px;
    height: 34px;
  }

  .item-title {
    font-size: 13px;
  }

  .item-artist {
    font-size: 11px;
  }

  .player-controls-bar {
    padding: 12px 20px;
  }

  .controls-wrapper {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .mini-track-info {
    justify-content: center;
  }

  .mini-thumbnail {
    width: 48px;
    height: 48px;
  }

  .mini-title {
    font-size: 13px;
  }

  .mini-artist {
    font-size: 11px;
  }

  .playback-controls {
    gap: 12px;
  }

  .control-btn {
    width: 36px;
    height: 36px;
  }

  .play-btn {
    width: 44px;
    height: 44px;
  }

  .volume-controls {
    justify-content: center;
  }

  .volume-slider-container {
    width: 80px;
  }
}
</style>

