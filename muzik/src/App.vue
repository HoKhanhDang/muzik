<script setup>
import { ref, onMounted, computed } from 'vue'

// Database integration
const videos = ref([])
const videoIds = ref([])
const currentVideoIndex = ref(0)
const player = ref(null)
const isPlayerReady = ref(false)
const showAddForm = ref(false)
const loading = ref(false)
const volume = ref(50)
const isMuted = ref(false)
const showVolumeSlider = ref(false)
const activeTab = ref('playlist')
const instantPlayUrl = ref('')
const draggedIndex = ref(null)
const draggedOverIndex = ref(null)

// Form data for adding new videos
const newVideo = ref({
  title: '',
  video_id: '',
  youtube_url: '',
  thumbnail_url: '',
  duration: '',
})

// API functions
const API_BASE = 'http://localhost:3001/api'

const fetchVideos = async () => {
  try {
    loading.value = true
    const response = await fetch(`${API_BASE}/videos`)
    const data = await response.json()
    videos.value = data
    videoIds.value = data.map((video) => video.video_id)

    // Initialize player if we have videos
    if (videoIds.value.length > 0 && window.YT) {
      initializePlayer()
    }
  } catch (error) {
    console.error('Error fetching videos:', error)
  } finally {
    loading.value = false
  }
}

const fetchVideoInfo = async (videoId) => {
  try {
    // Method 1: Try to fetch from YouTube oEmbed API (no API key needed)
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

    const response = await fetch(oEmbedUrl)
    if (response.ok) {
      const data = await response.json()
      return {
        title: data.title || `Video ${videoId}`,
        thumbnail_url: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: null,
      }
    }
  } catch (error) {
    console.log('Could not fetch video info from oEmbed:', error)
  }

  try {
    // Method 2: Try alternative approach using CORS proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url='
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

    const response = await fetch(`${proxyUrl}${encodeURIComponent(youtubeUrl)}`)
    if (response.ok) {
      const html = await response.text()

      // Extract title from HTML meta tags
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : `Video ${videoId}`

      return {
        title: title,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: null,
      }
    }
  } catch (error) {
    console.log('Could not fetch video info from HTML:', error)
  }

  // Fallback: return basic info with thumbnail
  return {
    title: `Video ${videoId}`,
    thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    duration: null,
  }
}

const addVideo = async () => {
  try {
    loading.value = true

    // Extract video ID if URL is provided
    let videoId = newVideo.value.video_id
    if (newVideo.value.youtube_url && !videoId) {
      const regex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      const match = newVideo.value.youtube_url.match(regex)
      if (match) {
        videoId = match[1]
        newVideo.value.video_id = videoId
      }
    }

    // If no title provided, try to fetch it automatically
    if (!newVideo.value.title && videoId) {
      const videoInfo = await fetchVideoInfo(videoId)
      newVideo.value.title = videoInfo.title
      if (videoInfo.thumbnail_url) {
        newVideo.value.thumbnail_url = videoInfo.thumbnail_url
      }
    }

    const response = await fetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newVideo.value),
    })

    if (response.ok) {
      await fetchVideos() // Refresh the list
      resetForm()
      showAddForm.value = false
    } else {
      const error = await response.json()
      alert(`Error: ${error.error}`)
    }
  } catch (error) {
    console.error('Error adding video:', error)
    alert('Error adding video')
  } finally {
    loading.value = false
  }
}

const deleteVideo = async (id) => {
  if (!confirm('Are you sure you want to delete this video?')) return

  try {
    loading.value = true
    const response = await fetch(`${API_BASE}/videos/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      await fetchVideos() // Refresh the list
    } else {
      const error = await response.json()
      alert(`Error: ${error.error}`)
    }
  } catch (error) {
    console.error('Error deleting video:', error)
    alert('Error deleting video')
  } finally {
    loading.value = false
  }
}

const fetchVideoDetails = async () => {
  if (!newVideo.value.youtube_url && !newVideo.value.video_id) {
    alert('Please enter a YouTube URL or Video ID first')
    return
  }

  try {
    loading.value = true

    // Extract video ID if URL is provided
    let videoId = newVideo.value.video_id
    if (newVideo.value.youtube_url && !videoId) {
      const regex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      const match = newVideo.value.youtube_url.match(regex)
      if (match) {
        videoId = match[1]
        newVideo.value.video_id = videoId
      }
    }

    if (videoId) {
      const videoInfo = await fetchVideoInfo(videoId)
      newVideo.value.title = videoInfo.title
      if (videoInfo.thumbnail_url) {
        newVideo.value.thumbnail_url = videoInfo.thumbnail_url
      }
    }
  } catch (error) {
    console.error('Error fetching video details:', error)
    alert('Could not fetch video details')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  newVideo.value = {
    title: '',
    video_id: '',
    youtube_url: '',
    thumbnail_url: '',
    duration: '',
  }
}

// YouTube API callback
window.onYouTubeIframeAPIReady = () => {
  if (videoIds.value.length > 0) {
    initializePlayer()
  }
}

const initializePlayer = () => {
  if (!videoIds.value.length) return

  player.value = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: videoIds.value[currentVideoIndex.value],
    playerVars: {
      autoplay: 1,
      controls: 1, // Hide controls for cleaner look
      loop: 0,
      modestbranding: 0,
      rel: 1,
      showinfo: 1,
    },
    events: {
      onReady: (event) => {
        isPlayerReady.value = true
        event.target.playVideo()
        event.target.setVolume(volume.value)
      },
      onStateChange: (event) => {
        // When video ends, play next video
        if (event.data === YT.PlayerState.ENDED) {
          playNextVideo()
        }
      },
    },
  })
}

const playNextVideo = () => {
  if (videoIds.value.length === 0) return
  currentVideoIndex.value = (currentVideoIndex.value + 1) % videoIds.value.length
  if (player.value && isPlayerReady.value) {
    player.value.loadVideoById(videoIds.value[currentVideoIndex.value])
  }
}

const playPreviousVideo = () => {
  if (videoIds.value.length === 0) return
  currentVideoIndex.value =
    currentVideoIndex.value === 0 ? videoIds.value.length - 1 : currentVideoIndex.value - 1
  if (player.value && isPlayerReady.value) {
    player.value.loadVideoById(videoIds.value[currentVideoIndex.value])
  }
}

const playVideoAtIndex = (index) => {
  if (videoIds.value.length === 0) return
  currentVideoIndex.value = index
  if (player.value && isPlayerReady.value) {
    player.value.loadVideoById(videoIds.value[currentVideoIndex.value])
  }
}

const toggleMute = () => {
  if (player.value && isPlayerReady.value) {
    if (player.value.isMuted()) {
      player.value.unMute()
      isMuted.value = false
    } else {
      player.value.mute()
      isMuted.value = true
    }
  }
}

const setVolume = (newVolume) => {
  volume.value = newVolume
  if (player.value && isPlayerReady.value) {
    player.value.setVolume(newVolume)
    if (newVolume > 0) {
      isMuted.value = false
    }
  }
}

const adjustVolume = (change) => {
  const newVolume = Math.max(0, Math.min(100, volume.value + change))
  setVolume(newVolume)
}

const toggleVolumeSlider = () => {
  showVolumeSlider.value = !showVolumeSlider.value
}

// Drag & Drop functions
const handleDragStart = (event, index) => {
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/html', event.target.outerHTML)
  event.target.style.opacity = '0.5'
}

const handleDragEnd = (event) => {
  event.target.style.opacity = '1'
  draggedIndex.value = null
  draggedOverIndex.value = null
}

const handleDragOver = (event, index) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  draggedOverIndex.value = index
}

const handleDragLeave = () => {
  draggedOverIndex.value = null
}

const handleDrop = async (event, dropIndex) => {
  event.preventDefault()
  
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    return
  }
  
  try {
    loading.value = true
    
    // Create new order array
    const newOrder = [...videos.value]
    const draggedItem = newOrder[draggedIndex.value]
    
    // Remove dragged item
    newOrder.splice(draggedIndex.value, 1)
    
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedItem)
    
    // Update current video index if needed
    if (currentVideoIndex.value === draggedIndex.value) {
      currentVideoIndex.value = dropIndex
    } else if (draggedIndex.value < currentVideoIndex.value && dropIndex >= currentVideoIndex.value) {
      currentVideoIndex.value--
    } else if (draggedIndex.value > currentVideoIndex.value && dropIndex <= currentVideoIndex.value) {
      currentVideoIndex.value++
    }
    
    // Update videos array
    videos.value = newOrder
    videoIds.value = newOrder.map(video => video.video_id)
    
    // Update player if it's ready
    if (player.value && isPlayerReady.value) {
      player.value.loadVideoById(videoIds.value[currentVideoIndex.value])
    }
    
  } catch (error) {
    console.error('Error reordering videos:', error)
    alert('Error reordering videos')
  } finally {
    loading.value = false
  }
}

const moveVideoToTop = async (videoIndex) => {
  if (videoIndex === 0) return // Already at top
  
  try {
    loading.value = true
    
    // Create new order array
    const newOrder = [...videos.value]
    const videoToMove = newOrder[videoIndex]
    
    // Remove video from current position
    newOrder.splice(videoIndex, 1)
    
    // Insert at the beginning
    newOrder.unshift(videoToMove)
    
    // Update current video index
    if (currentVideoIndex.value === videoIndex) {
      currentVideoIndex.value = 0
    } else if (currentVideoIndex.value < videoIndex) {
      currentVideoIndex.value++
    }
    
    // Update videos array
    videos.value = newOrder
    videoIds.value = newOrder.map(video => video.video_id)
    
    // Update player if it's ready
    if (player.value && isPlayerReady.value) {
      player.value.loadVideoById(videoIds.value[currentVideoIndex.value])
    }
    
  } catch (error) {
    console.error('Error moving video to top:', error)
    alert('Error moving video to top')
  } finally {
    loading.value = false
  }
}

const instantPlay = async () => {
  if (!instantPlayUrl.value) {
    alert('Please enter a YouTube URL or Video ID')
    return
  }
  
  try {
    // Extract video ID from URL
    let videoId = instantPlayUrl.value
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = instantPlayUrl.value.match(regex)
    if (match) {
      videoId = match[1]
    }
    
    // Play instantly without adding to playlist
    if (player.value && isPlayerReady.value) {
      player.value.loadVideoById(videoId)
    } else {
      // If player not ready, initialize with this video
      if (window.YT) {
        player.value = new YT.Player('player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            loop: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 1
          },
          events: {
            onReady: (event) => {
              isPlayerReady.value = true
              event.target.playVideo()
              event.target.setVolume(volume.value)
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.ENDED) {
                // Don't auto-next for instant play
              }
            }
          }
        })
      }
    }
    
    instantPlayUrl.value = ''
  } catch (error) {
    console.error('Error playing video:', error)
    alert('Could not play video')
  }
}

// Computed properties
const currentVideo = computed(() => {
  return videos.value[currentVideoIndex.value] || null
})

onMounted(async () => {
  // Load YouTube API
  if (!window.YT) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
  }

  // Fetch videos from database
  await fetchVideos()
})
</script>

<template>
  <header class="app-header">
    <h1>🎵 Muzikkkk</h1>
    
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        @click="activeTab = 'instant'" 
        :class="{ active: activeTab === 'instant' }"
        class="tab-btn"
      >
        ⚡ Instant Play
      </button>
      <button 
        @click="activeTab = 'playlist'" 
        :class="{ active: activeTab === 'playlist' }"
        class="tab-btn"
      >
        📋 Playlist
      </button>
    </div>
  </header>
  <main>
    <div id="video-container">
      <div id="player" v-if="videoIds.length > 0"></div>
      <div v-else class="no-videos">
        <h2>No Videos Found</h2>
        <p>Add some videos to start playing!</p>
      </div>
    </div>

    <div id="list-container">

      <!-- Instant Play Tab -->
      <div v-if="activeTab === 'instant'" class="tab-content instant-play-tab">
        <h3>⚡ Instant Play</h3>
        <p class="tab-description">Play any YouTube video instantly without adding to playlist</p>
        
        <div class="instant-play-form">
          <div class="form-group">
            <label>YouTube URL or Video ID:</label>
            <div class="instant-input-group">
              <input 
                v-model="instantPlayUrl" 
                placeholder="https://youtube.com/watch?v=... or Video ID"
                @keyup.enter="instantPlay"
              />
              <button @click="instantPlay" :disabled="!instantPlayUrl" class="play-btn">
                ▶️ Play Now
              </button>
            </div>
          </div>
        </div>
        
        <div class="quick-actions">
          <h4>Quick Actions:</h4>
          <div class="quick-buttons">
            <button @click="playPreviousVideo" :disabled="videoIds.length <= 1" class="quick-btn">
              ⏮️ Previous
            </button>
            <button @click="playNextVideo" :disabled="videoIds.length <= 1" class="quick-btn">
              ⏭️ Next
            </button>
            <button @click="toggleMute" class="quick-btn">
              {{ isMuted ? '🔇' : '🔊' }} {{ isMuted ? 'Unmute' : 'Mute' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Playlist Tab -->
      <div v-if="activeTab === 'playlist'" class="tab-content playlist-tab">
        <div class="playlist-header">
          <h3>📋 Your Playlist</h3>
          <button @click="showAddForm = !showAddForm" class="add-btn">
            {{ showAddForm ? 'Cancel' : '+ Add Video' }}
          </button>
        </div>

      <!-- Add Video Form -->
      <div v-if="showAddForm" class="add-form">
        <h3>Add New Video</h3>

        <div class="form-group">
          <label>YouTube URL:</label>
          <input v-model="newVideo.youtube_url" placeholder="https://youtube.com/watch?v=..." />
        </div>

        <div class="form-group">
          <label>OR Video ID:</label>
          <input v-model="newVideo.video_id" placeholder="XbLemOwzdxk" />
        </div>

        <div class="form-group">
          <label>Title:</label>
          <div class="title-input-group">
            <input v-model="newVideo.title" placeholder="Video title (auto-filled)" />
            <button @click="fetchVideoDetails" :disabled="loading" class="fetch-btn">
              {{ loading ? '⏳' : '🔍' }} Fetch
            </button>
          </div>
        </div>

        <div v-if="newVideo.thumbnail_url" class="form-group">
          <label>Thumbnail Preview:</label>
          <img :src="newVideo.thumbnail_url" class="thumbnail-preview" />
        </div>

        <div class="form-group">
          <label>Duration (optional):</label>
          <input v-model="newVideo.duration" placeholder="3:45" />
        </div>

        <div class="form-actions">
          <button @click="addVideo" :disabled="loading" class="save-btn">
            {{ loading ? 'Adding...' : 'Add Video' }}
          </button>
          <button
            @click="
              resetForm(),
              showAddForm = false
            "
            class="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Player Info -->
      <div v-if="currentVideo" class="playlist-info">
        <h3>Now Playing:</h3>
        <p class="current-title">{{ currentVideo.title }}</p>
        <p class="current-id">ID: {{ currentVideo.video_id }}</p>
        <div class="controls">
          <button
            @click="playPreviousVideo"
            :disabled="videoIds.length <= 1"
            class="control-btn prev-btn"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <div class="volume-controls">
            <button @click="adjustVolume(-10)" class="control-btn volume-btn">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
              </svg>
            </button>

            <button @click="toggleMute" class="control-btn mute-btn" :class="{ muted: isMuted }">
              <svg v-if="!isMuted" class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                />
              </svg>
              <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                />
              </svg>
            </button>

            <button @click="adjustVolume(10)" class="control-btn volume-btn">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                />
              </svg>
            </button>

            <div class="volume-slider-container">
              <button @click="toggleVolumeSlider" class="control-btn volume-slider-btn">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                  />
                </svg>
                <span class="volume-text">{{ volume }}%</span>
              </button>

              <div v-if="showVolumeSlider" class="volume-slider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  v-model="volume"
                  @input="setVolume(volume)"
                  class="slider"
                />
              </div>
            </div>
          </div>

          <button
            @click="playNextVideo"
            :disabled="videoIds.length <= 1"
            class="control-btn next-btn"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Playlist -->
      <div class="playlist">
        <h3>Your Videos ({{ videos.length }})</h3>
        <div v-if="loading" class="loading">Loading...</div>
        <ul v-else-if="videos.length > 0">
          <li
            v-for="(video, index) in videos"
            :key="video.id"
            :class="{ 
              active: index === currentVideoIndex,
              'drag-over': draggedOverIndex === index,
              'dragging': draggedIndex === index
            }"
            @click="playVideoAtIndex(index)"
            draggable="true"
            @dragstart="handleDragStart($event, index)"
            @dragend="handleDragEnd"
            @dragover="handleDragOver($event, index)"
            @dragleave="handleDragLeave"
            @drop="handleDrop($event, index)"
          >
            <div class="video-item">
              <div class="drag-handle">⋮⋮</div>
              <div class="video-info">
                <span class="video-title">{{ video.title }}</span>
                <span class="video-id">{{ video.video_id }}</span>
              </div>
              <div class="video-actions">
                <button 
                  @click.stop="moveVideoToTop(index)" 
                  :disabled="index === 0"
                  class="move-to-top-btn"
                  title="Move to Top"
                >
                  ⬆️
                </button>
                <button @click.stop="deleteVideo(video.id)" class="delete-btn">🗑️</button>
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="empty-playlist">
          <p>No videos yet. Add your first video!</p>
        </div>
      </div>
      
      </div> <!-- End Playlist Tab -->
    </div>
  </main>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  padding: 15px 20px;
  border-bottom: 2px solid #4ecdc4;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  height: 100px;
}

.app-header h1 {
  margin: 0 0 10px 0;
  color: #4ecdc4;
  font-size: 24px;
  text-align: center;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
main {
  width: 100vw;
  height: calc(100vh - 100px);
  overflow: hidden;
  margin-top: 100px;
  background-color: white;
  color: white;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  gap: 15px;
  padding: 15px;
  font-family: 'Arial', sans-serif;
}

#video-container {
  width: 70%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

#player {
  width: 100%;
  height: 100%;
}

.no-videos {
  text-align: center;
  color: #666;
}

.no-videos h2 {
  margin-bottom: 10px;
  color: #888;
}

#list-container {
  width: 30%;
  height: 100%;
  background-color: #2a2a2a;
  border-radius: 10px;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}


.tab-navigation {
  display: flex;
  background-color: #3a3a3a;
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 15px;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  color: #ccc;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tab-btn:hover {
  background-color: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
}

.tab-btn.active {
  background: linear-gradient(145deg, #4ecdc4, #45b7aa);
  color: white;
  box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Instant Play Tab Styles */
.instant-play-tab h3 {
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

.instant-play-form {
  background-color: #3a3a3a;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
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

/* Playlist Tab Styles */
.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.playlist-header h3 {
  color: #4ecdc4;
  margin: 0;
  font-size: 18px;
}

.add-btn {
  background-color: #4ecdc4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.add-btn:hover {
  background-color: #45b7aa;
}

.add-form {
  background-color: #3a3a3a;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
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

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #2a2a2a;
  color: white;
  font-size: 14px;
}

.form-group input:focus {
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

.playlist-info {
  margin-bottom: 20px;
  text-align: center;
  background-color: #3a3a3a;
  padding: 15px;
  border-radius: 8px;
}

.playlist-info h3 {
  margin-top: 0;
  color: #4ecdc4;
}

.current-title {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b6b;
  margin: 10px 0 5px 0;
}

.current-id {
  font-size: 12px;
  color: #888;
  margin: 0 0 15px 0;
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.volume-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

.control-btn {
  position: relative;
  background: linear-gradient(145deg, #2a2a2a, #3a3a3a);
  color: #ffffff;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(145deg, #4ecdc4, #45b7aa);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.control-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 8px 25px rgba(78, 205, 196, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.95);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.control-btn:disabled {
  background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
  color: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.control-btn:disabled::before {
  display: none;
}

.btn-icon {
  width: 20px;
  height: 20px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.control-btn:hover:not(:disabled) .btn-icon {
  transform: scale(1.1);
}

/* Specific button styles */
.prev-btn:hover:not(:disabled) .btn-icon {
  transform: scale(1.1) translateX(-1px);
}

.next-btn:hover:not(:disabled) .btn-icon {
  transform: scale(1.1) translateX(1px);
}

.mute-btn:hover:not(:disabled) .btn-icon {
  transform: scale(1.1) rotate(5deg);
}

.mute-btn.muted {
  background: linear-gradient(145deg, #ff6b6b, #ff5252);
}

.mute-btn.muted::before {
  background: linear-gradient(145deg, #ff5252, #e53935);
}

.volume-btn {
  width: 40px;
  height: 40px;
}

.volume-btn .btn-icon {
  width: 16px;
  height: 16px;
}

.volume-slider-container {
  position: relative;
}

.volume-slider-btn {
  width: auto;
  min-width: 60px;
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-text {
  font-size: 12px;
  font-weight: bold;
  color: #4ecdc4;
}

.volume-slider {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  padding: 15px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.volume-slider::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(0, 0, 0, 0.9);
}

.slider {
  width: 120px;
  height: 6px;
  border-radius: 3px;
  background: #333;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(145deg, #4ecdc4, #45b7aa);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(145deg, #4ecdc4, #45b7aa);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
}

/* Pulse animation for active state */
.control-btn:focus {
  outline: none;
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0% {
    box-shadow:
      0 4px 15px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 0 0 rgba(78, 205, 196, 0.7);
  }
  70% {
    box-shadow:
      0 4px 15px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 0 10px rgba(78, 205, 196, 0);
  }
  100% {
    box-shadow:
      0 4px 15px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 0 0 rgba(78, 205, 196, 0);
  }
}

.playlist {
  flex: 1;
  overflow-y: auto;
}

.playlist h3 {
  color: #4ecdc4;
  margin-bottom: 15px;
}

.loading,
.empty-playlist {
  text-align: center;
  color: #888;
  padding: 20px;
}

.playlist ul {
  list-style: none;
  padding: 0;
}

.playlist li {
  margin: 5px 0;
  background-color: #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  position: relative;
}

.playlist li:hover {
  background-color: #4a4a4a;
  transform: translateX(5px);
}

.playlist li.active {
  background-color: #ff6b6b;
  color: white;
}

.playlist li.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.playlist li.drag-over {
  background-color: #4ecdc4;
  border: 2px dashed #45b7aa;
  transform: scale(1.02);
}

.drag-handle {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
  font-size: 12px;
  cursor: grab;
  user-select: none;
  padding: 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

.playlist li:hover .drag-handle {
  color: #4ecdc4;
}

.video-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px 12px 30px;
  position: relative;
}

.video-info {
  flex: 1;
}

.video-title {
  display: block;
  font-weight: bold;
  margin-bottom: 4px;
}

.video-id {
  display: block;
  font-size: 12px;
  color: #888;
}

.video-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.playlist li:hover .video-actions {
  opacity: 1;
}

.move-to-top-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  box-shadow: 
    0 4px 15px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  font-weight: 600;
  letter-spacing: 0.5px;
  min-width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.move-to-top-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.move-to-top-btn:hover:not(:disabled)::before {
  left: 100%;
}

.move-to-top-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 8px 25px rgba(102, 126, 234, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.move-to-top-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 
    0 2px 10px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.move-to-top-btn:disabled {
  background: linear-gradient(135deg, #555 0%, #444 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  opacity: 0.6;
}

.delete-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  box-shadow: 
    0 4px 15px rgba(255, 107, 107, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  font-weight: 600;
  letter-spacing: 0.5px;
  min-width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.delete-btn:hover::before {
  left: 100%;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #ee5a52 0%, #ff6b6b 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 8px 25px rgba(255, 107, 107, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.delete-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 
    0 2px 10px rgba(255, 107, 107, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Scrollbar styling */
#list-container::-webkit-scrollbar {
  width: 8px;
}

#list-container::-webkit-scrollbar-track {
  background: #1a1a1a;
}

#list-container::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

#list-container::-webkit-scrollbar-thumb:hover {
  background: #6a6a6a;
}
</style>
