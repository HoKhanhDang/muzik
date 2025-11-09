<script setup>
import { ref } from 'vue'
import { videoService } from '../../services/videoService.js'
import HistorySection from '../history/HistorySection.vue'
import PlayerControls from './PlayerControls.vue'

const props = defineProps({
  instantPlayUrl: String,
  videoIds: Array,
  isMuted: Boolean,
  instantPlayHistory: Array,
  addingToPlaylist: String,
  isInPlaylist: Function,
  currentVideo: Object,
  volume: Number,
  showVolumeSlider: Boolean,
})

const emit = defineEmits([
  'update:instantPlayUrl',
  'instant-play',
  'play-previous',
  'play-next',
  'toggle-mute',
  'play-from-history',
  'clear-history',
  'add-from-history',
  'adjust-volume',
  'set-volume',
  'toggle-volume-slider',
])

// Handle double-click to paste from clipboard
const handleDoubleClickPaste = async (event) => {
  // Focus the input first
  event.target.focus()
  
  try {
    // Use Clipboard API to read clipboard content
    // Note: This requires HTTPS or localhost, and user may need to grant permission
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        emit('update:instantPlayUrl', text.trim())
        // Select all text after pasting for easy editing
        setTimeout(() => {
          event.target.select()
        }, 10)
      }
    } else {
      console.warn('Clipboard API not available')
      // Fallback: Focus input and show message
      event.target.select()
      alert('Clipboard access not available. Please use Ctrl+V (Cmd+V on Mac) to paste.')
    }
  } catch (error) {
    console.warn('Failed to read clipboard:', error)
    // If permission denied or other error, focus input for manual paste
    event.target.select()
    // Optionally show a user-friendly message
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      alert('Clipboard access denied. Please allow clipboard access or use Ctrl+V (Cmd+V on Mac) to paste.')
    }
  }
}

// Search functionality
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const searchError = ref('')
const viewMode = ref('search') // 'search' or 'instant'

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  searching.value = true
  searchError.value = ''
  searchResults.value = []
  
  // Ensure viewMode is 'search' to display results
  viewMode.value = 'search'
  
  try {
    const results = await videoService.searchYouTube(searchQuery.value, 20)
    searchResults.value = results
  } catch (error) {
    searchError.value = 'Unable to search. Please try again or check API key.'
    console.error('Search error:', error)
  } finally {
    searching.value = false
  }
}

const handleAddToPlaylist = async (video) => {
  try {
    await videoService.create({
      title: video.title,
      video_id: video.videoId,
      youtube_url: `https://www.youtube.com/watch?v=${video.videoId}`,
      thumbnail_url: video.thumbnail
    })
    alert('Video added to playlist!')
  } catch (error) {
    alert('Error adding video: ' + (error.message || 'Unknown error'))
  }
}

const handlePlayNow = (video) => {
  const url = `https://www.youtube.com/watch?v=${video.videoId}`
  emit('update:instantPlayUrl', url)
  // Use setTimeout to ensure the url is updated before emitting instant-play
  setTimeout(() => {
    emit('instant-play')
  }, 100)
}

const handleSwitchToInstant = () => {
  viewMode.value = 'instant'
  searchResults.value = []
  searchError.value = ''
}
</script>

<template>
  <div class="tab-content youtube-tab">
    <!-- Player Controls -->
    <PlayerControls
      v-if="currentVideo"
      :current-video="currentVideo"
      :video-ids="videoIds"
      :volume="volume"
      :is-muted="isMuted"
      :show-volume-slider="showVolumeSlider"
      @play-previous="$emit('play-previous')"
      @play-next="$emit('play-next')"
      @toggle-mute="$emit('toggle-mute')"
      @adjust-volume="$emit('adjust-volume', $event)"
      @set-volume="$emit('set-volume', $event)"
      @toggle-volume-slider="$emit('toggle-volume-slider')"
    />

    <!-- Mode Switcher -->
    <div class="mode-switcher">
      <button
        @click="viewMode = 'search'"
        :class="{ active: viewMode === 'search' }"
        class="mode-btn"
      >
        🔍 Search
      </button>
      <button
        @click="handleSwitchToInstant"
        :class="{ active: viewMode === 'instant' }"
        class="mode-btn"
      >
        ⚡ Instant Play
      </button>
    </div>

    <!-- Search Mode -->
    <div v-if="viewMode === 'search'" class="search-mode">
      <h3>🔍 Search YouTube Videos</h3>
      <p class="tab-description">Search and play videos from YouTube instantly</p>

      <div class="search-section">
        <div class="search-box">
          <input
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="Enter search keywords..."
            class="search-input"
            :disabled="searching"
          />
          <button @click="handleSearch" :disabled="searching || !searchQuery.trim()" class="search-btn">
            {{ searching ? 'Searching...' : '🔍 Search' }}
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="results-section">
        <h4 class="results-header">Search Results ({{ searchResults.length }})</h4>
        <div class="video-grid">
          <div v-for="video in searchResults" :key="video.videoId" class="video-card">
            <img :src="video.thumbnail" :alt="video.title" class="thumbnail" />
            <div class="video-info">
              <h4 class="video-title" :title="video.title">{{ video.title }}</h4>
              <p class="channel-name">{{ video.channelTitle }}</p>
              <div class="video-actions">
                <button @click="handlePlayNow(video)" class="btn-play">
                  ▶️ Play Now
                </button>
                <button @click="handleAddToPlaylist(video)" class="btn-add">
                  ➕ Add to Playlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Error -->
      <div v-if="searchError" class="error-message">
        {{ searchError }}
      </div>

      <!-- Empty State -->
      <div v-if="!searching && searchResults.length === 0 && !searchError && searchQuery" class="empty-state">
        <p>No videos found. Try different keywords.</p>
      </div>
    </div>

    <!-- Instant Play Mode -->
    <div v-if="viewMode === 'instant'" class="instant-mode">
      <h3>⚡ Instant Play</h3>
      <p class="tab-description">Play any YouTube video instantly without adding to playlist</p>

      <div class="instant-play-form">
        <div class="form-group">
          <label>YouTube URL or Video ID:</label>
          <span class="help-text">💡 Double-click to paste from clipboard</span>
          <div class="instant-input-group">
            <input
              :value="instantPlayUrl"
              @input="$emit('update:instantPlayUrl', $event.target.value)"
              @keyup.enter="$emit('instant-play')"
              @dblclick="handleDoubleClickPaste"
              placeholder="https://youtube.com/watch?v=... or Video ID"
              title="Double-click to paste from clipboard"
            />
            <button @click="$emit('instant-play')" :disabled="!instantPlayUrl" class="play-btn">
              ▶️ Play Now
            </button>
          </div>
        </div>
      </div>

      <HistorySection
        v-if="instantPlayHistory.length > 0"
        :instant-play-history="instantPlayHistory"
        :adding-to-playlist="addingToPlaylist"
        :is-in-playlist="isInPlaylist"
        @play-from-history="$emit('play-from-history', $event)"
        @clear-history="$emit('clear-history')"
        @add-from-history="$emit('add-from-history', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  animation: fadeIn 0.3s ease-in-out;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #4a4a4a #2a2a2a;
}

.tab-content::-webkit-scrollbar {
  width: 8px;
}

.tab-content::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: #6a6a6a;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mode Switcher */
.mode-switcher {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  background-color: #3a3a3a;
  padding: 8px;
  border-radius: 8px;
}

.mode-btn {
  flex: 1;
  padding: 10px;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #555;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
}

.mode-btn:hover {
  background-color: #3a3a3a;
  border-color: #4ecdc4;
}

.mode-btn.active {
  background-color: #4ecdc4;
  border-color: #4ecdc4;
  color: #1a1a1a;
  font-weight: 600;
}

/* Search Mode */
.youtube-tab h3 {
  color: #4ecdc4;
  margin-bottom: 8px;
  font-size: 18px;
}

.tab-description {
  color: #888;
  font-size: 13px;
  margin-bottom: 15px;
  line-height: 1.3;
}

.search-section {
  background-color: #3a3a3a;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #555;
  border-radius: 8px;
  background-color: #2a2a2a;
  color: white;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #4ecdc4;
  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.2);
}

.search-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-btn {
  background: linear-gradient(145deg, #4285f4, #357ae8);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
}

.search-btn:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Search Results */
.results-section {
  margin-top: 20px;
}

.results-header {
  color: #4ecdc4;
  margin-bottom: 15px;
  font-size: 16px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.video-card {
  border: 1px solid #555;
  border-radius: 8px;
  overflow: hidden;
  background-color: #3a3a3a;
  transition: transform 0.2s, box-shadow 0.2s;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: #4ecdc4;
}

.thumbnail {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.video-info {
  padding: 12px;
}

.video-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.channel-name {
  font-size: 12px;
  color: #888;
  margin: 0 0 12px 0;
}

.video-actions {
  display: flex;
  gap: 8px;
}

.btn-play {
  flex: 1;
  padding: 8px;
  background: #ff0000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-play:hover {
  background: #cc0000;
  transform: translateY(-1px);
}

.btn-add {
  flex: 1;
  padding: 8px;
  background: #2a2a2a;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #3a3a3a;
  border-color: #4ecdc4;
}

.error-message {
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  margin-top: 15px;
  border: 1px solid #fcc;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #888;
}

/* Instant Play Mode Styles (reused from InstantPlayTab) */
.instant-play-form {
  background-color: #3a3a3a;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #ccc;
  font-size: 14px;
}

.help-text {
  display: block;
  margin-bottom: 8px;
  color: #888;
  font-size: 12px;
  font-style: italic;
  line-height: 1.4;
}

.instant-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.instant-input-group input {
  flex: 1;
  padding: 12px;
  border: 1px solid #555;
  border-radius: 8px;
  background-color: #2a2a2a;
  color: white;
  font-size: 14px;
}

.instant-input-group input:focus {
  outline: none;
  border-color: #4ecdc4;
  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.2);
}

.play-btn {
  background: linear-gradient(145deg, #ff6b6b, #ff5252);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.play-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.play-btn:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quick-actions {
  background-color: #3a3a3a;
  padding: 12px;
  border-radius: 8px;
  flex-shrink: 0;
  margin-bottom: 12px;
}

.quick-actions h4 {
  color: #4ecdc4;
  margin-bottom: 15px;
  font-size: 16px;
}

.quick-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-btn {
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #555;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 100px;
}

.quick-btn:hover:not(:disabled) {
  background-color: #4ecdc4;
  border-color: #4ecdc4;
  transform: translateY(-1px);
}

.quick-btn:disabled {
  background-color: #1a1a1a;
  color: #666;
  cursor: not-allowed;
  transform: none;
}

/* Tablet */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
  }

  .thumbnail {
    height: 160px;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .mode-switcher {
    flex-direction: column;
    gap: 8px;
  }

  .search-box {
    flex-direction: column;
  }

  .search-input,
  .search-btn {
    width: 100%;
  }

  .video-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .thumbnail {
    height: 200px;
  }

  .video-actions {
    flex-direction: column;
  }

  .btn-play,
  .btn-add {
    width: 100%;
  }
}
</style>

