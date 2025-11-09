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
  currentTime: Number,
  duration: Number,
})

const emit = defineEmits([
  'play-video',
  'play-next',
  'play-previous',
  'toggle-mute',
  'set-volume',
  'toggle-play',
  'seek',
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

const progress = computed(() => {
  if (!props.duration || props.duration === 0) return 0
  return (props.currentTime / props.duration) * 100
})

const formattedCurrentTime = computed(() => {
  return formatTime(props.currentTime || 0)
})

const formattedDuration = computed(() => {
  return formatTime(props.duration || 0)
})

// Format duration from video object (can be string like "3:45" or seconds number)
const formatVideoDuration = (video) => {
  if (!video) return '--:--'
  
  // If duration is already a formatted string (e.g., "3:45")
  if (typeof video.duration === 'string' && video.duration.includes(':')) {
    return video.duration
  }
  
  // If duration is a number (seconds)
  if (typeof video.duration === 'number' && video.duration > 0) {
    return formatTime(video.duration)
  }
  
  // If duration is a string that can be parsed as number
  const durationNum = parseFloat(video.duration)
  if (!isNaN(durationNum) && durationNum > 0) {
    return formatTime(durationNum)
  }
  
  return '--:--'
}

// Get formatted duration for each video in playlist
const getVideoDuration = (video, index) => {
  // If this is the currently playing video and we have duration from player, use that
  if (index === props.currentVideoIndex && props.duration > 0) {
    return formatTime(props.duration)
  }
  
  // Otherwise use duration from video object
  return formatVideoDuration(video)
}

const handleSeek = (event) => {
  if (!props.duration || props.duration === 0) return
  const sliderValue = Number(event.target.value)
  const seekTime = (sliderValue / 100) * props.duration
  emit('seek', seekTime)
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
              {{ getVideoDuration(video, index) }}
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

        <!-- Center: Playback controls and progress -->
        <div class="center-controls">
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

          <!-- Progress bar -->
          <div class="progress-container">
            <span class="time-display">{{ formattedCurrentTime }}</span>
            <div class="progress-bar-wrapper">
              <div class="progress-filled" :style="{ width: `${progress}%` }"></div>
              <input
                type="range"
                min="0"
                max="100"
                :value="progress"
                @input="handleSeek"
                class="progress-slider"
                :disabled="!duration || duration === 0"
              />
            </div>
            <span class="time-display">{{ formattedDuration }}</span>
          </div>
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
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  max-height: 100%;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  -webkit-overflow-scrolling: touch;
}

.audio-main::-webkit-scrollbar {
  width: 8px;
}

.audio-main::-webkit-scrollbar-track {
  background: transparent;
}

.audio-main::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.audio-main::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Album Section */
.album-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 30px;
  padding: 20px;
  min-height: 0;
  overflow: visible;
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
  min-height: 0;
  max-height: 100%;
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
  grid-template-columns: 1fr 2fr 1fr;
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
.center-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  justify-content: center;
  margin-bottom: 12px;
}

/* Progress Bar */
.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 600px;
}

.time-display {
  color: #aaa;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: center;
}

.progress-bar-wrapper {
  flex: 1;
  position: relative;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.progress-filled {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4 0%, #45b7aa 100%);
  border-radius: 2px;
  transition: width 0.1s linear;
  pointer-events: none;
  z-index: 1;
}

.progress-slider {

  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: transparent;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: height 2s ease;
  position: relative;
  z-index: 2;
  margin: 0;
  padding-bottom: 15px;
}

.progress-slider:hover {
  height: 6px;
}

.progress-bar-wrapper:hover .progress-filled {
  height: 6px;
}

.progress-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Webkit - Chrome, Safari, Edge */
.progress-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4ecdc4;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(78, 205, 196, 0.4);
  margin-top: -4px;
  position: relative;
  z-index: 3;
  border: none;
}

.progress-slider:hover::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  margin-top: -5px;
  background: #45b7aa;
  box-shadow: 0 3px 8px rgba(78, 205, 196, 0.6);
}

/* Firefox */
.progress-slider::-moz-range-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: transparent;
  border: none;
}

.progress-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4ecdc4;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(78, 205, 196, 0.4);
  margin: 0;
  padding: 0;
}

.progress-slider:hover::-moz-range-thumb {
  transform: scale(1.3);
  background: #45b7aa;
  box-shadow: 0 3px 8px rgba(78, 205, 196, 0.6);
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
    gap: 20px;
    padding: 20px;
    overflow-y: auto;
  }

  .album-section {
    gap: 15px;
    padding: 15px;
    justify-content: flex-start;
  }

  .album-art-wrapper {
    max-width: 280px;
  }

  .track-title {
    font-size: 22px;
  }

  .track-artist {
    font-size: 15px;
  }

  .playlist-section {
    padding: 15px;
    max-height: 60vh;
    min-height: 300px;
  }

  .playlist-items {
    overflow-y: auto;
    overflow-x: hidden;
  }

  .player-controls-bar {
    padding: 15px 20px;
  }

  .controls-wrapper {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .center-controls {
    width: 100%;
  }

  .progress-container {
    max-width: 100%;
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
    gap: 15px;
    padding: 15px;
    overflow-y: auto;
  }

  .album-section {
    gap: 12px;
    padding: 10px;
    justify-content: flex-start;
  }

  .album-art-wrapper {
    max-width: 200px;
  }

  .music-icon {
    font-size: 60px;
  }

  .track-title {
    font-size: 18px;
    -webkit-line-clamp: 2;
  }

  .track-artist {
    font-size: 13px;
  }

  .playlist-section {
    padding: 12px;
    max-height: 50vh;
    min-height: 250px;
  }

  .playlist-header {
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .playlist-header h2 {
    font-size: 18px;
  }

  .track-count {
    font-size: 12px;
  }

  .playlist-items {
    overflow-y: auto;
    overflow-x: hidden;
  }

  .playlist-item {
    grid-template-columns: 30px 50px 1fr 45px;
    gap: 8px;
    padding: 8px;
    margin-bottom: 4px;
  }

  .item-number {
    font-size: 12px;
  }

  .playing-icon {
    width: 16px;
    height: 16px;
  }

  .item-thumbnail {
    width: 50px;
    height: 28px;
  }

  .item-title {
    font-size: 12px;
  }

  .item-artist {
    font-size: 10px;
  }

  .item-duration {
    font-size: 11px;
  }

  .player-controls-bar {
    padding: 10px 15px;
  }

  .controls-wrapper {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .center-controls {
    width: 100%;
  }

  .progress-container {
    max-width: 100%;
    gap: 8px;
  }

  .time-display {
    font-size: 11px;
    min-width: 35px;
  }

  .mini-track-info {
    justify-content: center;
  }

  .mini-thumbnail {
    width: 40px;
    height: 40px;
  }

  .mini-title {
    font-size: 12px;
  }

  .mini-artist {
    font-size: 10px;
  }

  .playback-controls {
    gap: 10px;
    margin-bottom: 8px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
  }

  .control-btn svg {
    width: 16px;
    height: 16px;
  }

  .play-btn {
    width: 40px;
    height: 40px;
  }

  .play-btn svg {
    width: 20px;
    height: 20px;
  }

  .volume-controls {
    justify-content: center;
    gap: 8px;
  }

  .volume-btn {
    width: 32px;
    height: 32px;
  }

  .volume-btn svg {
    width: 18px;
    height: 18px;
  }

  .volume-slider-container {
    width: 70px;
  }
}
</style>

