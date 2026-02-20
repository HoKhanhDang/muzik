<script setup>
import AudioModeView from '../audio/AudioModeView.vue'

defineProps({
  loading: Boolean,
  videoIds: Array,
  showSidebar: Boolean,
  audioOnlyMode: Boolean,
  isPlayerReady: Boolean,
  currentVideo: Object,
  videos: Array,
  currentVideoIndex: Number,
  volume: Number,
  isMuted: Boolean,
  isPlaying: Boolean,
  currentTime: Number,
  duration: Number,
  // Player resilience props
  playerError: Object,      // { code, message, videoId }
  isBuffering: Boolean,
  bufferingDuration: Number, // seconds of continuous buffering
})

defineEmits([
  'play-video',
  'play-next',
  'play-previous',
  'toggle-mute',
  'set-volume',
  'toggle-play',
  'seek',
  // Player resilience emits
  'skip-video',
  'retry-video',
  'reduce-quality',
])
</script>

<template>
  <div id="video-container" :class="{ 'full-width': !showSidebar, 'audio-only': audioOnlyMode }">
    <!-- Player element - always present in DOM but hidden in audio mode -->
    <div class="player-wrapper" :class="{ 'hidden-player': audioOnlyMode }">
      <div id="player"></div>
      
      <!-- Overlays for video mode -->
      <div v-if="!audioOnlyMode" class="overlay-container">
        <!-- Player Error state -->
        <div v-if="playerError" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">Can't Play This Video</h3>
          <p class="error-message">{{ playerError.message }}</p>
          <p class="error-video-id">Video: {{ playerError.videoId }}</p>
          <p class="error-auto-skip">Auto-skipping in 3s...</p>
          <div class="error-actions">
            <button @click="$emit('retry-video')" class="error-btn retry-btn">
              <span>🔄</span> Retry
            </button>
            <button @click="$emit('skip-video')" class="error-btn skip-btn">
              <span>⏭️</span> Skip Now
            </button>
          </div>
        </div>

        <!-- Buffering state (only show when buffering > 3 seconds to avoid flicker) -->
        <div v-else-if="isBuffering && bufferingDuration > 3" class="buffering-state">
          <div class="spinner"></div>
          <p class="buffering-text">Buffering... {{ bufferingDuration }}s</p>
          <p v-if="bufferingDuration >= 15" class="buffering-warning">⚠️ Slow network detected</p>
          <button
            v-if="bufferingDuration >= 15"
            @click="$emit('reduce-quality')"
            class="reduce-quality-btn"
          >
            📉 Reduce Quality
          </button>
        </div>

        <!-- Loading state -->
        <div v-else-if="loading && videoIds.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Loading your playlist...</p>
        </div>
        
        <!-- No videos message -->
        <div v-else-if="!loading && videoIds.length === 0 && !isPlayerReady" class="no-videos">
          <h2>No Videos Found</h2>
          <p>Add some videos to start playing!</p>
        </div>
      </div>
    </div>

    <!-- Audio Mode View -->
    <AudioModeView
      v-if="audioOnlyMode"
      :current-video="currentVideo"
      :videos="videos"
      :current-video-index="currentVideoIndex"
      :volume="volume"
      :is-muted="isMuted"
      :is-player-ready="isPlayerReady"
      :is-playing="isPlaying"
      :current-time="currentTime"
      :duration="duration"
      @play-video="$emit('play-video', $event)"
      @play-next="$emit('play-next')"
      @play-previous="$emit('play-previous')"
      @toggle-mute="$emit('toggle-mute')"
      @set-volume="$emit('set-volume', $event)"
      @toggle-play="$emit('toggle-play')"
      @seek="$emit('seek', $event)"
    />
  </div>
</template>

<style scoped>
#video-container {
  width: 70%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  flex: 1;
  min-width: 0;
}

#video-container.full-width {
  width: 100%;
}

/* Large Desktop (>= 1440px) */
@media screen and (min-width: 1440px) {
  #video-container {
    width: 72%;
  }

  #video-container.full-width {
    width: 100%;
  }
}

/* Tablet (768px - 1023px) */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  #video-container {
    width: 65%;
  }

  #video-container.full-width {
    width: 100%;
  }
}

/* Mobile (< 768px) */
@media screen and (max-width: 767px) {
  #video-container {
    width: 100%;
    height: 60vh;
    min-height: 300px;
  }

  #video-container.full-width {
    width: 100%;
  }
}

.player-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-wrapper.hidden-player {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  overflow: hidden !important;
  top: -9999px !important;
  left: -9999px !important;
  z-index: -1 !important;
}

.overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.overlay-container > * {
  pointer-events: auto;
}

#player {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

#player.hidden-player {
  z-index: -1 !important;
}

#player iframe {
  transition: all 0.3s ease;
}

.hidden-player {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  overflow: hidden !important;
  top: -9999px !important;
  left: -9999px !important;
  z-index: -1 !important;
}

.hidden-player iframe {
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

#video-container.audio-only {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow: hidden;
}

#video-container.audio-only::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
  top: -50%;
  left: -50%;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.audio-only-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-visualizer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  position: relative;
  z-index: 11;
}

.audio-icon {
  font-size: 120px;
  animation: pulse 2s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.8; 
  }
  50% { 
    transform: scale(1.1); 
    opacity: 1; 
  }
}

.audio-waves {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 60px;
}

.wave {
  width: 6px;
  height: 20px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 1));
  border-radius: 3px;
  animation: wave 1.2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.wave:nth-child(1) { animation-delay: 0s; }
.wave:nth-child(2) { animation-delay: 0.1s; }
.wave:nth-child(3) { animation-delay: 0.2s; }
.wave:nth-child(4) { animation-delay: 0.3s; }
.wave:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { height: 20px; }
  50% { height: 50px; }
}

.audio-mode-text {
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

.audio-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  margin: 10px 0 0 0;
  font-weight: 400;
}

/* Tablet responsive for audio mode */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .audio-icon {
    font-size: 100px;
  }
  
  .audio-mode-text {
    font-size: 20px;
  }

  .audio-hint {
    font-size: 13px;
  }
  
  .audio-waves {
    height: 50px;
  }
}

/* Mobile responsive for audio mode */
@media screen and (max-width: 767px) {
  .audio-icon {
    font-size: 80px;
  }
  
  .audio-mode-text {
    font-size: 18px;
  }

  .audio-hint {
    font-size: 12px;
  }
  
  .audio-waves {
    height: 40px;
    gap: 6px;
  }
  
  .wave {
    width: 4px;
  }
}

.no-videos {
  text-align: center;
  color: #666;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.no-videos h2 {
  margin-bottom: 10px;
  color: #888;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #888;
  font-size: 18px;
  padding: 40px;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #4ecdc4;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Player Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  text-align: center;
  padding: 40px 20px;
  animation: fadeIn 0.3s ease;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.error-title {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b6b;
  margin: 0 0 8px 0;
}

.error-message {
  font-size: 14px;
  color: #ccc;
  margin: 0 0 6px 0;
  max-width: 400px;
}

.error-video-id {
  font-size: 12px;
  color: #888;
  margin: 0 0 10px 0;
  font-family: monospace;
}

.error-auto-skip {
  font-size: 13px;
  color: #ffd43b;
  margin: 0 0 16px 0;
  animation: pulse 1s ease-in-out infinite;
}

.error-actions {
  display: flex;
  gap: 12px;
}

.error-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.retry-btn {
  background: linear-gradient(145deg, #4ecdc4, #45b7aa);
  color: white;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
}

.skip-btn {
  background: linear-gradient(145deg, #ff6b6b, #ff5252);
  color: white;
}

.skip-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

/* Buffering State */
.buffering-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  text-align: center;
  padding: 40px;
  animation: fadeIn 0.3s ease;
}

.buffering-text {
  font-size: 16px;
  color: #ccc;
  margin: 10px 0 0 0;
}

.buffering-warning {
  font-size: 14px;
  color: #ffd43b;
  margin: 8px 0;
  animation: pulse 2s ease-in-out infinite;
}

.reduce-quality-btn {
  margin-top: 12px;
  padding: 10px 20px;
  background: linear-gradient(145deg, #ffd43b, #fab005);
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reduce-quality-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 212, 59, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
