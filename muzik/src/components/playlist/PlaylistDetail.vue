<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { playlistService, filmService, videoService } from '../../services/index.js'
import Icon from '../common/Icon.vue'

const props = defineProps({
  playlist: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated', 'delete', 'play-item', 'play-all'])

const loading = ref(false)
const showAddForm = ref(false)
const newVideo = ref({
  youtube_url: '',
  title: '',
  thumbnail_url: ''
})

const items = computed(() => {
  if (!props.playlist || !props.playlist.items) return []
  return Array.isArray(props.playlist.items) ? props.playlist.items : []
})

const extractVideoId = (url) => {
  if (!url) return null
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

const fetchVideoDetails = async () => {
  const videoId = extractVideoId(newVideo.value.youtube_url)
  if (!videoId) {
    alert('Invalid YouTube URL')
    return
  }

  try {
    loading.value = true
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
    const data = await response.json()
    
    if (data.title) {
      newVideo.value.title = data.title
      newVideo.value.thumbnail_url = data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    } else {
      throw new Error('Could not fetch video details')
    }
  } catch (error) {
    console.error('Error fetching video details:', error)
    alert(`Error: ${error.message || 'Failed to fetch video details'}`)
  } finally {
    loading.value = false
  }
}

const handleDoubleClickPasteUrl = async (event) => {
  event.target.focus()
  
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        const url = text.trim()
        newVideo.value.youtube_url = url
        
        setTimeout(() => {
          event.target.select()
        }, 10)
        
        setTimeout(() => {
          fetchVideoDetails()
        }, 100)
      }
    } else {
      console.warn('Clipboard API not available')
      event.target.select()
      alert('Clipboard access not available. Please use Ctrl+V (Cmd+V on Mac) to paste.')
    }
  } catch (error) {
    console.warn('Failed to read clipboard:', error)
    event.target.select()
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      alert('Clipboard access denied. Please allow clipboard access or use Ctrl+V (Cmd+V on Mac) to paste.')
    }
  }
}

const handleAddVideo = async () => {
  if (!newVideo.value.youtube_url || !newVideo.value.title) {
    alert('Please provide YouTube URL and title')
    return
  }

  const videoId = extractVideoId(newVideo.value.youtube_url)
  if (!videoId) {
    alert('Invalid YouTube URL')
    return
  }

  if (isVideoIdInPlaylist(videoId)) {
    alert('This video is already in the playlist!')
    return
  }

  try {
    loading.value = true
    
    // Create video first if it's a video playlist
    if (props.playlist.type === 'video') {
      const videoData = {
        video_id: videoId,
        title: newVideo.value.title,
        thumbnail_url: newVideo.value.thumbnail_url
      }
      // Create video in database (returns database ID)
      await videoService.create(videoData)
      
      // Add to playlist using YouTube video ID, not database ID
      await playlistService.addItem(props.playlist.id, { video_id: videoId })
    } else {
      // For film playlists, create film with video URL
      const filmData = {
        title: newVideo.value.title,
        video_url: newVideo.value.youtube_url,
        thumbnail_url: newVideo.value.thumbnail_url
      }
      const createdFilm = await filmService.create(filmData)
      // For films, we use database ID as foreign key
      await playlistService.addItem(props.playlist.id, { film_id: createdFilm.id })
    }
    
    emit('updated')
    showAddForm.value = false
    newVideo.value = { youtube_url: '', title: '', thumbnail_url: '' }
  } catch (error) {
    console.error('Error adding video:', error)
    alert(`Error: ${error.message || 'Failed to add video'}`)
  } finally {
    loading.value = false
  }
}

const handleCancelAdd = () => {
  showAddForm.value = false
  newVideo.value = { youtube_url: '', title: '', thumbnail_url: '' }
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
</script>

<template>
  <div class="playlist-detail">
    <div class="detail-header">
      <div class="playlist-info-section">
        <div class="playlist-info-header">
          <div class="playlist-icon-large">
            <Icon :name="playlist?.type === 'film' ? 'film_playlists' : 'video_playlists'" :size="48" />
          </div>
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
      </div>
      <div class="header-actions">
        <button @click="handlePlayAll" class="play-all-btn" :disabled="items.length === 0">
          <Icon name="play" :size="16" icon-class="btn-icon" />
          <span>Play All</span>
        </button>
        <button @click="showAddForm = !showAddForm" class="add-item-btn">
          <Icon :name="showAddForm ? 'cancel' : 'add'" :size="16" icon-class="btn-icon" />
          <span>{{ showAddForm ? 'Cancel' : 'Add Items' }}</span>
        </button>
        <button @click="handleDeletePlaylist" class="delete-playlist-btn">
          <Icon name="delete" :size="16" icon-class="btn-icon" />
          <span>Delete</span>
        </button>
      </div>
    </div>

    <div v-if="showAddForm" class="add-items-section">
      <div class="add-form">
        <h3>Add New Video</h3>

        <div class="form-group">
          <label>YouTube URL:</label>
          <span class="help-text">💡 Double-click to paste from clipboard</span>
          <input
            v-model="newVideo.youtube_url"
            @dblclick="handleDoubleClickPasteUrl"
            placeholder="https://youtube.com/watch?v=..."
            title="Double-click to paste from clipboard"
            class="url-input"
          />
        </div>

        <div class="form-group">
          <label>Title:</label>
          <div class="title-input-group">
            <input
              v-model="newVideo.title"
              placeholder="Video title (auto-filled)"
              class="title-input"
            />
            <button @click="fetchVideoDetails" :disabled="loading" class="fetch-btn">
              {{ loading ? '⏳' : '🔍' }} Fetch
            </button>
          </div>
        </div>

        <div v-if="newVideo.thumbnail_url" class="form-group">
          <label>Thumbnail Preview:</label>
          <img :src="newVideo.thumbnail_url" class="thumbnail-preview" />
        </div>

        <div class="form-actions">
          <button @click="handleAddVideo" :disabled="loading" class="save-btn">
            {{ loading ? 'Adding...' : 'Add Video' }}
          </button>
          <button @click="handleCancelAdd" class="cancel-btn">Cancel</button>
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
              <Icon :name="playlist?.type === 'film' ? 'film_playlists' : 'video_playlists'" :size="24" />
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
              <Icon name="play" :size="16" />
            </button>
            <button @click="handleRemoveItem(item.id)" class="remove-item-btn" title="Remove from playlist">
              <Icon name="cancel" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
}

.detail-header {
  background: linear-gradient(135deg, rgba(42, 42, 42, 0.95), rgba(58, 58, 58, 0.95));
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.playlist-info-section {
  width: 100%;
}

.playlist-info-header {
  display: flex;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.playlist-icon-large {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4ecdc4;
}

.playlist-info-header > div {
  flex: 1;
  min-width: 0;
}

.playlist-info-header h3 {
  color: #fff;
  margin: 0 0 6px 0;
  font-size: 24px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-description-text {
  color: #aaa;
  margin: 0 0 10px 0;
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.playlist-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex-wrap: wrap;
}

.stat {
  color: #bbb;
  font-weight: 500;
}

.stat-divider {
  color: #666;
  margin: 0 2px;
}

.header-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba(78, 205, 196, 0.2);
}

.play-all-btn,
.add-item-btn,
.delete-playlist-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.play-all-btn .btn-icon,
.add-item-btn .btn-icon,
.delete-playlist-btn .btn-icon {
  flex-shrink: 0;
}

.play-all-btn::before,
.add-item-btn::before,
.delete-playlist-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.play-all-btn:hover::before,
.add-item-btn:hover::before,
.delete-playlist-btn:hover::before {
  left: 100%;
}

.play-all-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.play-all-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ee5a52 0%, #ff6b6b 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(255, 107, 107, 0.4);
}

.play-all-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(255, 107, 107, 0.3);
}

.play-all-btn:disabled {
  background: linear-gradient(135deg, #555 0%, #444 100%);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.add-item-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
}

.add-item-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(78, 205, 196, 0.4);
}

.add-item-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(78, 205, 196, 0.3);
}

.delete-playlist-btn {
  background: rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.4);
  color: #ff6b6b;
  box-shadow: 0 1px 4px rgba(255, 107, 107, 0.2);
}

.delete-playlist-btn:hover {
  background: rgba(255, 107, 107, 0.25);
  border-color: #ff6b6b;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  color: #ff5252;
}

.delete-playlist-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(255, 107, 107, 0.2);
}

/* Tablet (768px - 1023px) */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .detail-header {
    padding: 18px 20px;
    gap: 14px;
  }

  .playlist-icon-large {
    font-size: 42px;
  }

  .playlist-info-header h3 {
    font-size: 22px;
  }

  .header-actions {
    gap: 8px;
    padding-top: 12px;
  }

  .play-all-btn,
  .add-item-btn,
  .delete-playlist-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
}

/* Mobile (< 768px) */
@media screen and (max-width: 767px) {
  .detail-header {
    padding: 16px;
    gap: 12px;
    border-radius: 12px;
  }

  .playlist-info-header {
    gap: 12px;
  }

  .playlist-icon-large {
    font-size: 36px;
  }

  .playlist-info-header h3 {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .playlist-description-text {
    font-size: 13px;
    margin-bottom: 8px;
  }

  .playlist-stats {
    font-size: 12px;
    gap: 6px;
  }

  .header-actions {
    gap: 6px;
    padding-top: 10px;
    flex-direction: column;
  }

  .play-all-btn,
  .add-item-btn,
  .delete-playlist-btn {
    padding: 8px 12px;
    font-size: 12px;
    width: 100%;
  }
}

.add-items-section {
  background: rgba(42, 42, 42, 0.4);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  padding: 20px;
  flex-shrink: 0;
}

.add-form {
  background-color: #3a3a3a;
  padding: 20px;
  border-radius: 8px;
}

.add-form h3 {
  margin-top: 0;
  color: #4ecdc4;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #ccc;
  font-size: 14px;
}

.help-text {
  display: block;
  margin-bottom: 6px;
  color: #888;
  font-size: 12px;
  font-style: italic;
  line-height: 1.4;
}

.url-input,
.title-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #2a2a2a;
  color: white;
  font-size: 14px;
}

.url-input:focus,
.title-input:focus {
  outline: none;
  border-color: #4ecdc4;
}

.title-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.title-input-group input {
  flex: 1;
}

.fetch-btn {
  background-color: #4ecdc4;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: background-color 0.3s;
}

.fetch-btn:hover:not(:disabled) {
  background-color: #45b7aa;
}

.fetch-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.thumbnail-preview {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 8px;
  border: 2px solid #4ecdc4;
  margin-top: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.save-btn {
  background-color: #4ecdc4;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #45b7aa;
}

.save-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #666;
  color: white;
}

.cancel-btn:hover {
  background-color: #777;
}

.playlist-items-section {
  padding: 20px;
  background: rgba(42, 42, 42, 0.4);
  border-radius: 12px;
  flex-shrink: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
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

