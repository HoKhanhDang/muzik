<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { playlistService, filmService, videoService } from '../../services/index.js'

const props = defineProps({
  playlist: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'delete', 'play-item', 'play-all'])

const loading = ref(false)
const showAddForm = ref(false)
const availableItems = ref([])
const searchQuery = ref('')

const items = computed(() => {
  if (!props.playlist || !props.playlist.items) return []
  return Array.isArray(props.playlist.items) ? props.playlist.items : []
})

const filteredAvailableItems = computed(() => {
  if (!searchQuery.value.trim()) return availableItems.value
  const query = searchQuery.value.toLowerCase()
  return availableItems.value.filter(item => {
    const title = (item.title || item.film_title || item.video_title || '').toLowerCase()
    const director = (item.director || '').toLowerCase()
    return title.includes(query) || director.includes(query)
  })
})

const fetchAvailableItems = async () => {
  if (!props.playlist || !props.playlist.type) {
    console.error('Playlist type is missing')
    return
  }
  try {
    loading.value = true
    if (props.playlist.type === 'film') {
      const filmList = await filmService.getAll()
      availableItems.value = filmList.map(f => ({
        ...f,
        item_id: f.id,
        item_type: 'film',
        title: f.title,
      }))
    } else {
      const videoList = await videoService.getAll()
      availableItems.value = videoList.map(v => ({
        ...v,
        item_id: v.id,
        item_type: 'video',
        title: v.title,
      }))
    }
  } catch (error) {
    console.error('Error fetching available items:', error)
    alert(`Error: ${error.message || 'Failed to load items'}`)
  } finally {
    loading.value = false
  }
}

const handleAddItem = async (item) => {
  if (!props.playlist || !props.playlist.id || !item || !item.item_id) {
    alert('Invalid data. Please try again.')
    return
  }
  
  // Check if video ID is already in playlist (more efficient check)
  const videoId = extractVideoIdFromItem(item)
  if (videoId && isVideoIdInPlaylist(videoId)) {
    alert('This video is already in the playlist!')
    return
  }
  
  // Also check by item ID for safety
  if (isItemInPlaylist(item.item_id)) {
    alert('This item is already in the playlist!')
    return
  }
  
  try {
    loading.value = true
    const data = props.playlist.type === 'film'
      ? { film_id: item.item_id }
      : { video_id: item.item_id }
    
    await playlistService.addItem(props.playlist.id, data)
    emit('updated')
    showAddForm.value = false
    searchQuery.value = ''
  } catch (error) {
    console.error('Error adding item:', error)
    alert(`Error: ${error.message || 'Failed to add item'}`)
  } finally {
    loading.value = false
  }
}

const handleRemoveItem = async (itemId) => {
  if (!confirm('Remove this item from playlist?')) return

  if (!props.playlist || !props.playlist.id || !itemId) {
    alert('Invalid data. Please try again.')
    return
  }

  try {
    loading.value = true
    await playlistService.removeItem(props.playlist.id, itemId)
    emit('updated')
  } catch (error) {
    console.error('Error removing item:', error)
    alert(`Error: ${error.message || 'Failed to remove item'}`)
  } finally {
    loading.value = false
  }
}

const handleDeletePlaylist = () => {
  emit('delete', props.playlist.id)
}

const handlePlayAll = () => {
  if (items.value.length === 0) {
    alert('This playlist is empty!')
    return
  }
  
  // Extract all video IDs from playlist items
  const extractedVideoIds = []
  const extractedTitles = []
  
  for (const item of items.value) {
    let videoId = null
    
    if (props.playlist.type === 'video' && item.video_id) {
      videoId = item.video_id
    } else if (props.playlist.type === 'film') {
      if (item.film_video_url) {
        const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
        const match = item.film_video_url.match(regex)
        if (match) {
          videoId = match[1]
        }
      } else if (item.video_url) {
        const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
        const match = item.video_url.match(regex)
        if (match) {
          videoId = match[1]
        }
      }
    }
    
    if (videoId) {
      extractedVideoIds.push(videoId)
      const title = item.film_title || item.video_title || `Video ${videoId}`
      extractedTitles.push(title)
    }
  }
  
  if (extractedVideoIds.length === 0) {
    alert('No valid video IDs found in this playlist')
    return
  }
  
  emit('play-all', {
    playlist: {
      videoIds: extractedVideoIds,
      titles: extractedTitles,
      currentIndex: 0
    }
  })
}

const handlePlayItem = (item, index) => {
  // Extract all video IDs from playlist items
  const extractedVideoIds = []
  const extractedTitles = []
  
  for (const playlistItem of items.value) {
    let videoId = null
    
    if (props.playlist.type === 'video' && playlistItem.video_id) {
      videoId = playlistItem.video_id
    } else if (props.playlist.type === 'film') {
      if (playlistItem.film_video_url) {
        const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
        const match = playlistItem.film_video_url.match(regex)
        if (match) {
          videoId = match[1]
        }
      } else if (playlistItem.video_url) {
        const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
        const match = playlistItem.video_url.match(regex)
        if (match) {
          videoId = match[1]
        }
      }
    }
    
    if (videoId) {
      extractedVideoIds.push(videoId)
      const title = playlistItem.film_title || playlistItem.video_title || `Video ${videoId}`
      extractedTitles.push(title)
    }
  }
  
  if (extractedVideoIds.length === 0) {
    alert('No valid video IDs found in this playlist')
    return
  }
  
  const currentVideoId = extractedVideoIds[index]
  if (!currentVideoId) {
    alert('Cannot extract video ID from this item')
    return
  }
  
  emit('play-item', { 
    videoId: currentVideoId, 
    title: extractedTitles[index],
    playlist: {
      videoIds: extractedVideoIds,
      titles: extractedTitles,
      currentIndex: index
    }
  })
}

const isItemInPlaylist = (itemId) => {
  return items.value.some(item => 
    item.film_id === itemId || item.video_id === itemId
  )
}

const extractVideoIdFromItem = (item) => {
  if (!item) return null
  
  // For video type: use video_id directly
  if (item.video_id) {
    return item.video_id
  }
  
  // For film type: extract from video URL
  if (item.film_video_url) {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = item.film_video_url.match(regex)
    if (match) {
      return match[1]
    }
  }
  
  // Fallback for legacy video_url
  if (item.video_url) {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = item.video_url.match(regex)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

const isVideoIdInPlaylist = (videoId) => {
  if (!videoId) return false
  
  return items.value.some(item => {
    // Check direct video_id
    if (item.video_id === videoId) {
      return true
    }
    
    // Check film_video_url
    if (item.film_video_url) {
      const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
      const match = item.film_video_url.match(regex)
      if (match && match[1] === videoId) {
        return true
      }
    }
    
    // Check legacy video_url
    if (item.video_url) {
      const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
      const match = item.video_url.match(regex)
      if (match && match[1] === videoId) {
        return true
      }
    }
    
    return false
  })
}

const isItemAlreadyInPlaylist = (item) => {
  // Extract video ID from the item to be checked
  const itemVideoId = extractVideoIdFromItem(item)
  
  // If we have a video ID, check by video ID first (more reliable)
  if (itemVideoId && isVideoIdInPlaylist(itemVideoId)) {
    return true
  }
  
  // Also check by item ID for safety
  if (item.item_id && isItemInPlaylist(item.item_id)) {
    return true
  }
  
  return false
}

watch(() => showAddForm.value, (newVal) => {
  if (newVal) {
    fetchAvailableItems()
  }
})

onMounted(() => {
  if (showAddForm.value) {
    fetchAvailableItems()
  }
})
</script>

<template>
  <div class="playlist-detail">
    <div class="detail-header">
      <div class="playlist-info-header">
        <div class="playlist-icon-large">{{ playlist?.type === 'film' ? '🎬' : '🎥' }}</div>
        <div>
          <h3>{{ playlist?.name || 'Unnamed Playlist' }}</h3>
          <p v-if="playlist?.description" class="playlist-description-text">{{ playlist.description }}</p>
          <div class="playlist-stats">
            <span class="stat">{{ items.length }} items</span>
            <span class="stat-divider">•</span>
            <span class="stat">{{ playlist?.type === 'film' ? 'Film' : 'Video' }} Playlist</span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button @click="handlePlayAll" class="play-all-btn" :disabled="items.length === 0">
          ▶️ Play All
        </button>
        <button @click="showAddForm = !showAddForm" class="add-item-btn">
          {{ showAddForm ? '✖ Cancel' : '➕ Add Items' }}
        </button>
        <button @click="handleDeletePlaylist" class="delete-playlist-btn">🗑️ Delete</button>
      </div>
    </div>

    <div v-if="showAddForm" class="add-items-section">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search items..."
          class="search-input"
        />
      </div>
      <div v-if="loading" class="loading">Loading available items...</div>
      <div v-else-if="filteredAvailableItems.length === 0" class="empty-state">
        <p>No {{ playlist?.type === 'film' ? 'film' : 'video' }} items available.</p>
      </div>
      <div v-else class="available-items">
        <div
          v-for="item in filteredAvailableItems"
          :key="`${item.item_type}-${item.item_id}`"
          class="available-item-card"
          :class="{ 'in-playlist': isItemAlreadyInPlaylist(item) }"
        >
          <div class="item-thumbnail">
            <img
              v-if="item.thumbnail_url || item.film_thumbnail || item.video_thumbnail"
              :src="item.thumbnail_url || item.film_thumbnail || item.video_thumbnail"
              :alt="item.title"
              @error="$event.target.style.display = 'none'"
            />
            <div v-else class="placeholder-thumbnail">
              {{ playlist?.type === 'film' ? '🎬' : '🎥' }}
            </div>
          </div>
          <div class="item-info">
            <h4 class="item-title">{{ item.title }}</h4>
            <p v-if="item.director" class="item-artist">{{ item.director }}</p>
            <p v-if="item.video_id" class="item-id">Video ID: {{ item.video_id }}</p>
          </div>
          <button
            v-if="!isItemAlreadyInPlaylist(item)"
            @click="handleAddItem(item)"
            class="add-item-small-btn"
            :disabled="loading"
          >
            ➕
          </button>
          <span v-else class="in-playlist-badge">✓ Added</span>
        </div>
      </div>
    </div>

    <div class="playlist-items-section">
      <h4 class="section-title">Playlist Items ({{ items.length }})</h4>
      <div v-if="loading && items.length === 0" class="loading">Loading items...</div>
      <div v-else-if="items.length === 0" class="empty-state">
        <p>No items in this playlist yet. Add some items!</p>
      </div>
      <div v-else class="playlist-items">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="playlist-item-card"
        >
          <div class="item-number">{{ index + 1 }}</div>
          <div class="item-thumbnail-small">
            <img
              v-if="item.film_thumbnail || item.video_thumbnail"
              :src="item.film_thumbnail || item.video_thumbnail"
              :alt="item.film_title || item.video_title"
              @error="$event.target.style.display = 'none'"
            />
            <div v-else class="placeholder-thumbnail-small">
              {{ playlist?.type === 'film' ? '🎬' : '🎥' }}
            </div>
          </div>
          <div class="item-details">
            <h5 class="item-title-small">{{ item.film_title || item.video_title }}</h5>
            <p v-if="item.director" class="item-artist-small">{{ item.director }}</p>
            <p v-if="item.video_id || item.film_video_url || item.video_url" class="item-id-small">
              Video ID: {{ item.video_id || (item.film_video_url || item.video_url || '').match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1] || 'N/A' }}
            </p>
          </div>
          <div class="item-actions">
            <button @click="handlePlayItem(item, index)" class="play-item-btn" title="Play this video">
              ▶️
            </button>
            <button @click="handleRemoveItem(item.id)" class="remove-item-btn" title="Remove from playlist">
              ✖
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  background: rgba(42, 42, 42, 0.6);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.playlist-info-header {
  display: flex;
  gap: 16px;
  flex: 1;
}

.playlist-icon-large {
  font-size: 48px;
  flex-shrink: 0;
}

.playlist-info-header h3 {
  color: #fff;
  margin: 0 0 8px 0;
  font-size: 22px;
}

.playlist-description-text {
  color: #aaa;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.playlist-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.stat {
  color: #888;
}

.stat-divider {
  color: #666;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.play-all-btn,
.add-item-btn,
.delete-playlist-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.play-all-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.play-all-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff5252 0%, #ff6b6b 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
}

.play-all-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.add-item-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.add-item-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-2px);
}

.delete-playlist-btn {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.4);
  color: #ff6b6b;
}

.delete-playlist-btn:hover {
  background: rgba(255, 107, 107, 0.3);
  border-color: #ff6b6b;
}

.add-items-section {
  background: rgba(42, 42, 42, 0.4);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.search-bar {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #4ecdc4;
  box-shadow: 0 0 0 4px rgba(78, 205, 196, 0.1);
}

.available-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.available-item-card {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  transition: all 0.3s ease;
}

.available-item-card:hover:not(.in-playlist) {
  border-color: #4ecdc4;
  transform: translateY(-2px);
}

.available-item-card.in-playlist {
  opacity: 0.6;
  border-color: rgba(78, 205, 196, 0.1);
}

.item-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(78, 205, 196, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-thumbnail {
  font-size: 48px;
}

.item-info {
  flex: 1;
}

.item-title {
  color: #fff;
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-artist,
.item-id {
  color: #888;
  margin: 0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-item-small-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid rgba(78, 205, 196, 0.4);
  color: #4ecdc4;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-item-small-btn:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.3);
  border-color: #4ecdc4;
  transform: scale(1.1);
}

.in-playlist-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid rgba(78, 205, 196, 0.4);
  color: #4ecdc4;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.playlist-items-section {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(42, 42, 42, 0.4);
  border-radius: 12px;
}

.section-title {
  color: #4ecdc4;
  margin: 0 0 16px 0;
  font-size: 18px;
}

.playlist-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.playlist-item-card {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.playlist-item-card:hover {
  border-color: #4ecdc4;
  background: rgba(32, 32, 32, 0.9);
}

.item-number {
  color: #4ecdc4;
  font-weight: 600;
  font-size: 16px;
  min-width: 24px;
  text-align: center;
}

.item-thumbnail-small {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(78, 205, 196, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-thumbnail-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-thumbnail-small {
  font-size: 24px;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-title-small {
  color: #fff;
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-artist-small,
.item-id-small {
  color: #888;
  margin: 0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.play-item-btn {
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid rgba(78, 205, 196, 0.4);
  color: #4ecdc4;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.play-item-btn:hover {
  background: rgba(78, 205, 196, 0.3);
  border-color: #4ecdc4;
  transform: scale(1.1);
}

.remove-item-btn {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.4);
  color: #ff6b6b;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-item-btn:hover {
  background: rgba(255, 107, 107, 0.3);
  border-color: #ff6b6b;
  transform: scale(1.1);
}

.loading,
.empty-state {
  text-align: center;
  color: #888;
  padding: 40px 20px;
}
</style>

