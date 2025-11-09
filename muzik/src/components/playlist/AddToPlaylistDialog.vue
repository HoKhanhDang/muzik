<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { playlistService } from '../../services/index.js'
import Icon from '../common/Icon.vue'

const props = defineProps({
  video: Object,
  show: Boolean,
})

const emit = defineEmits(['close', 'added'])

const playlists = ref([])
const playlistItemsMap = ref({}) // Map playlist ID -> items array
const loading = ref(false)
const selectedPlaylistId = ref(null)
const adding = ref(false)

// Filter playlists by type
const videoPlaylists = computed(() => playlists.value.filter(p => p.type === 'video'))
const filmPlaylists = computed(() => playlists.value.filter(p => p.type === 'film'))
const allPlaylists = computed(() => playlists.value)
const hasPlaylists = computed(() => allPlaylists.value.length > 0)
const hasVideoPlaylists = computed(() => videoPlaylists.value.length > 0)

// Check if video is already in a playlist
const isVideoInPlaylist = (playlistId) => {
  if (!props.video || !props.video.video_id || !playlistItemsMap.value[playlistId]) {
    return false
  }
  
  const items = playlistItemsMap.value[playlistId]
  const videoId = props.video.video_id
  
  return items.some(item => {
    // Check direct video_id match
    if (item.video_id === videoId) {
      return true
    }
    // Also check if video_id from videos table matches
    return false
  })
}

const fetchPlaylists = async () => {
  try {
    loading.value = true
    playlists.value = [] // Clear old data first
    playlistItemsMap.value = {} // Clear items map
    const data = await playlistService.getAll()
    console.log('Fetched playlists:', data) // Debug log
    playlists.value = data || []
    
    // Fetch items for each video playlist to check if video is already in it
    if (props.video && props.video.video_id) {
      const videoPlaylistsData = (data || []).filter(p => p.type === 'video')
      console.log('Fetching items for video playlists to check duplicates...')
      
      for (const playlist of videoPlaylistsData) {
        try {
          const fullPlaylist = await playlistService.getById(playlist.id)
          if (fullPlaylist && fullPlaylist.items) {
            playlistItemsMap.value[playlist.id] = fullPlaylist.items
            console.log(`Playlist ${playlist.id} items:`, fullPlaylist.items)
          }
        } catch (err) {
          console.warn(`Error fetching items for playlist ${playlist.id}:`, err)
          playlistItemsMap.value[playlist.id] = []
        }
      }
    }
    
    // Log filtered video playlists for debugging
    const videoPlaylistsData = (data || []).filter(p => p.type === 'video')
    console.log('Video playlists:', videoPlaylistsData)
  } catch (error) {
    console.error('Error fetching playlists:', error)
    alert(`Error: ${error.message || 'Failed to load playlists'}`)
    playlists.value = [] // Reset on error
  } finally {
    loading.value = false
  }
}

const handleAddToPlaylist = async () => {
  if (!selectedPlaylistId.value) {
    alert('Please select a playlist')
    return
  }

  const playlist = playlists.value.find(p => p.id === selectedPlaylistId.value)
  if (!playlist) {
    alert('Playlist does not exist')
    return
  }

  // Check if video is already in playlist
  if (isVideoInPlaylist(selectedPlaylistId.value)) {
    alert('This video is already in the playlist!')
    return
  }

  try {
    adding.value = true
    
    console.log('Adding to playlist:', selectedPlaylistId.value, props.video)
    // For video playlists, use video_id
    const addData = { video_id: props.video.video_id }
    
    await playlistService.addItem(selectedPlaylistId.value, addData)
    
    emit('added', {
      playlistId: selectedPlaylistId.value,
      playlistName: playlist.name,
    })
    
    handleClose()
  } catch (error) {
    console.error('Error adding to playlist:', error)
    alert(`Error: ${error.message || 'Failed to add to playlist'}`)
  } finally {
    adding.value = false
  }
}

const handleClose = () => {
  selectedPlaylistId.value = null
  emit('close')
}

// Watch for show prop changes to fetch playlists when dialog opens
watch(() => props.show, async (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    // Reset state and fetch fresh data when dialog opens
    playlists.value = []
    selectedPlaylistId.value = null
    await fetchPlaylists()
  }
})

onMounted(() => {
  // Fetch if dialog is already shown on mount
  if (props.show) {
    fetchPlaylists()
  }
})
</script>

<template>
  <div v-if="show" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>Add to Playlist</h3>
        <div class="header-actions">
          <button @click="fetchPlaylists" class="refresh-btn" :disabled="loading" title="Refresh list">
            🔄
          </button>
          <button @click="handleClose" class="close-btn">✖</button>
        </div>
      </div>

      <div class="dialog-body">
        <div class="video-info-section">
          <p class="video-title-text">{{ video?.title }}</p>
          <p class="video-id-text">{{ video?.video_id }}</p>
        </div>

        <div v-if="loading" class="loading">Loading playlists...</div>
        
        <div v-else-if="!hasPlaylists" class="empty-state">
          <p>You don't have any playlists yet. Create a new playlist first!</p>
          <button @click="fetchPlaylists" class="retry-btn" style="margin-top: 12px;">
            🔄 Retry
          </button>
        </div>

        <div v-else class="playlists-list">
          <div v-if="videoPlaylists.length > 0" class="playlist-group">
            <h4 class="group-title">
              <Icon name="video_playlists" :size="18" icon-class="group-icon" />
              Video Playlists (Can add videos)
            </h4>
            <div class="playlist-options">
              <label
                v-for="playlist in videoPlaylists"
                :key="playlist.id"
                class="playlist-option"
                :class="{ 
                  selected: selectedPlaylistId === playlist.id,
                  'already-in-playlist': isVideoInPlaylist(playlist.id)
                }"
              >
                <input
                  type="radio"
                  :value="playlist.id"
                  v-model="selectedPlaylistId"
                  class="radio-input"
                  :disabled="isVideoInPlaylist(playlist.id)"
                />
                <span class="playlist-name">{{ playlist.name }}</span>
                <span v-if="playlist.description" class="playlist-description">{{ playlist.description }}</span>
                <span v-if="isVideoInPlaylist(playlist.id)" class="already-added-badge" title="Video already in this playlist">
                  <Icon name="check" :size="14" icon-class="check-icon" />
                  Already Added
                </span>
              </label>
            </div>
          </div>

          <div v-if="filmPlaylists.length > 0" class="playlist-group">
            <h4 class="group-title">
              <Icon name="film_playlists" :size="18" icon-class="group-icon" />
              Film Playlists (Cannot add videos)
            </h4>
            <div class="playlist-options">
              <label
                v-for="playlist in filmPlaylists"
                :key="playlist.id"
                class="playlist-option playlist-option-disabled"
                title="Cannot add videos to film playlist"
              >
                <input
                  type="radio"
                  :value="playlist.id"
                  disabled
                  class="radio-input"
                />
                <span class="playlist-name">{{ playlist.name }}</span>
                <span v-if="playlist.description" class="playlist-description">{{ playlist.description }}</span>
                <span class="disabled-badge">🚫</span>
              </label>
            </div>
          </div>

          <div v-if="!hasVideoPlaylists && hasPlaylists" class="empty-video-playlists">
            <p class="warning-text">⚠️ You don't have any video playlists to add videos to.</p>
            <p class="info-text">Create a new video playlist (select "Video" type when creating).</p>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="handleClose" class="cancel-btn" :disabled="adding">Cancel</button>
        <button
          @click="handleAddToPlaylist"
          class="add-btn"
          :disabled="!selectedPlaylistId || adding || (selectedPlaylistId && isVideoInPlaylist(selectedPlaylistId))"
        >
          <span v-if="adding">Adding...</span>
          <span v-else-if="selectedPlaylistId && isVideoInPlaylist(selectedPlaylistId)">Already in Playlist</span>
          <span v-else>Add to Playlist</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border: 2px solid rgba(78, 205, 196, 0.3);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(78, 205, 196, 0.2);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  color: #4ecdc4;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.3);
  border-color: #ff6b6b;
  transform: rotate(90deg);
}

.refresh-btn {
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid rgba(78, 205, 196, 0.3);
  color: #4ecdc4;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.3);
  border-color: #4ecdc4;
  transform: rotate(180deg);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.video-info-section {
  background: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.video-title-text {
  margin: 0 0 8px 0;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.video-id-text {
  margin: 0;
  color: #888;
  font-size: 14px;
}

.loading,
.empty-state {
  text-align: center;
  color: #888;
  padding: 40px 20px;
}

.playlists-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.playlist-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-title {
  margin: 0;
  color: #4ecdc4;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-icon {
  flex-shrink: 0;
}

.playlist-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.playlist-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(42, 42, 42, 0.6);
  border: 2px solid rgba(78, 205, 196, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.playlist-option:hover {
  background: rgba(78, 205, 196, 0.1);
  border-color: rgba(78, 205, 196, 0.4);
  transform: translateX(4px);
}

.playlist-option.selected {
  background: rgba(78, 205, 196, 0.2);
  border-color: #4ecdc4;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.radio-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #4ecdc4;
}

.playlist-name {
  flex: 1;
  color: #fff;
  font-weight: 500;
  font-size: 15px;
}

.playlist-description {
  color: #888;
  font-size: 13px;
  font-style: italic;
}

.playlist-option-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(42, 42, 42, 0.3) !important;
  border-color: rgba(78, 205, 196, 0.1) !important;
}

.playlist-option-disabled:hover {
  transform: none !important;
  background: rgba(42, 42, 42, 0.3) !important;
  border-color: rgba(78, 205, 196, 0.1) !important;
}

.disabled-badge {
  color: #ff6b6b;
  font-size: 14px;
  margin-left: auto;
}

.playlist-option.already-in-playlist {
  opacity: 0.7;
  background: rgba(78, 205, 196, 0.1) !important;
  border-color: rgba(78, 205, 196, 0.3) !important;
}

.playlist-option.already-in-playlist:hover {
  transform: none !important;
}

.already-added-badge {
  color: #4ecdc4;
  font-size: 13px;
  font-weight: 600;
  margin-left: auto;
  padding: 4px 8px;
  background: rgba(78, 205, 196, 0.2);
  border-radius: 6px;
  border: 1px solid rgba(78, 205, 196, 0.4);
  display: flex;
  align-items: center;
  gap: 4px;
}

.already-added-badge .check-icon {
  flex-shrink: 0;
}

.empty-video-playlists {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  text-align: center;
}

.warning-text {
  color: #ffc107;
  font-weight: 600;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.info-text {
  color: #888;
  margin: 0;
  font-size: 13px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(78, 205, 196, 0.2);
  justify-content: flex-end;
}

.cancel-btn,
.add-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ccc;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.add-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.add-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(78, 205, 196, 0.4);
}

.cancel-btn:disabled,
.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.retry-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-2px);
}
</style>

