<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import VideoPlayer from './components/video/VideoPlayer.vue'
import InstantPlayTab from './components/video/InstantPlayTab.vue'
import YouTubeTab from './components/video/YouTubeTab.vue'
import PlaylistTab from './components/playlist/PlaylistTab.vue'
import MoviesTab from './components/video/MoviesTab.vue'
import LoginPage from './components/auth/LoginPage.vue'
import { DEFAULT_ROUTE, ROUTES, isValidRoute } from './constants/routes.js'
import { videoService, authService } from './services/index.js'
import { eventBus } from './utils/eventBus.js'

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
const activeTab = ref(DEFAULT_ROUTE)
const instantPlayUrl = ref('')
const draggedIndex = ref(null)
const draggedOverIndex = ref(null)
const instantPlayHistory = ref([])
const addingToPlaylist = ref(null) // Track which video is being added
const showSidebar = ref(true) // Toggle sidebar visibility
const isAuthenticated = ref(false)
const currentUser = ref(null)
const showProfileModal = ref(false)
const audioOnlyMode = ref(false) // Audio-only mode toggle
const isPlaying = ref(false) // Track player state

// Form data for adding new videos
const newVideo = ref({
  title: '',
  video_id: '',
  youtube_url: '',
  thumbnail_url: '',
  duration: '',
})

// Track YouTube API readiness
const youtubeApiReady = ref(false)

const fetchVideos = async () => {
  try {
    loading.value = true
    const data = await videoService.getAll()
    videos.value = data
    videoIds.value = data.map((video) => video.video_id)

    // Check if we can initialize player now
    checkAndInitializePlayer()
  } catch (error) {
    console.error('Error fetching videos:', error.message)
    // Allow instant play even if fetch fails
    checkAndInitializePlayer()
  } finally {
    loading.value = false
  }
}

// Check if both YouTube API and videos are ready, then initialize
const checkAndInitializePlayer = () => {
  console.log('Checking player initialization:', {
    youtubeApiReady: youtubeApiReady.value,
    ytExists: !!window.YT,
    videoCount: videoIds.value.length,
    playerExists: !!player.value,
  })

  if (
    youtubeApiReady.value &&
    window.YT &&
    window.YT.Player &&
    videoIds.value.length > 0 &&
    !player.value
  ) {
    // Wait a tick to ensure the DOM element exists
    setTimeout(() => {
      const playerElement = document.getElementById('player')
      if (playerElement) {
        console.log('Initializing player with', videoIds.value.length, 'videos')
        initializePlayer()
      } else {
        console.warn('Player element not found in DOM')
      }
    }, 100)
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
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
      const match = newVideo.value.youtube_url.match(regex)
      if (match) {
        videoId = match[1]
        newVideo.value.video_id = videoId
      }
    }

    // Check if video ID is provided
    if (!videoId) {
      alert('Please provide a valid YouTube URL or Video ID')
      return
    }

    // Check if video already exists in the list
    const videoExists = videos.value.some((video) => video.video_id === videoId)
    if (videoExists) {
      alert('This video is already in your playlist!')
      return
    }

    // If no title provided, try to fetch it automatically
    if (!newVideo.value.title && videoId) {
      const videoInfo = await fetchVideoInfo(videoId)
      newVideo.value.title = videoInfo.title
      if (videoInfo.thumbnail_url) {
        newVideo.value.thumbnail_url = videoInfo.thumbnail_url
      }
    }

    await videoService.create(newVideo.value)
    await fetchVideos() // Refresh the list
    resetForm()
    showAddForm.value = false
  } catch (error) {
    console.error('Error adding video:', error)
    alert(`Error: ${error.message || 'Error adding video'}`)
  } finally {
    loading.value = false
  }
}

const deleteVideo = async (id) => {
  if (!confirm('Are you sure you want to delete this video?')) return

  try {
    loading.value = true
    await videoService.delete(id)
    await fetchVideos() // Refresh the list
  } catch (error) {
    console.error('Error deleting video:', error)
    alert(`Error: ${error.message || 'Error deleting video'}`)
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
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
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
  console.log('YouTube API is now ready')
  youtubeApiReady.value = true
  checkAndInitializePlayer()
}

const initializePlayer = () => {
  if (!videoIds.value.length) {
    console.log('Cannot initialize: no videos')
    return
  }

  if (!window.YT || !window.YT.Player) {
    console.error('YouTube API not loaded')
    return
  }

  const videoId = videoIds.value[currentVideoIndex.value]

  if (!videoId) {
    console.error('Invalid video ID at index:', currentVideoIndex.value)
    return
  }

  // Destroy existing player if it exists
  if (player.value && typeof player.value.destroy === 'function') {
    try {
      console.log('Destroying existing player before reinitializing...')
      player.value.destroy()
      player.value = null
      isPlayerReady.value = false
    } catch (error) {
      console.warn('Error destroying existing player:', error)
      player.value = null
      isPlayerReady.value = false
    }
  }

  console.log('Initializing YouTube player with video:', videoId)

  try {
    player.value = new window.YT.Player('player', {
      height: audioOnlyMode.value ? '1' : '100%',
      width: audioOnlyMode.value ? '1' : '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0, // Don't autoplay - browser restrictions
        controls: audioOnlyMode.value ? 0 : 1, // Hide controls in audio-only mode
        loop: 0,
        modestbranding: 0,
        rel: 1,
        showinfo: 1,
        enablejsapi: 1,
        vq: audioOnlyMode.value ? 'tiny' : 'default', // Set quality based on mode
      },
      events: {
        onReady: (event) => {
          console.log('Player ready!')
          isPlayerReady.value = true
          event.target.setVolume(volume.value)
          // Set quality based on audio-only mode
          if (audioOnlyMode.value) {
            event.target.setPlaybackQuality('small')
          }
          // Try to play - will fail gracefully if autoplay blocked
          try {
            event.target.playVideo()
            isPlaying.value = true
          } catch (error) {
            console.log('Autoplay blocked, user needs to click play:', error)
          }
        },
        onStateChange: handlePlayerStateChange,
        onError: (event) => {
          console.error('Player error:', event.data)
          if (event.data === 5) {
            console.error('HTML5 player error - video may be unavailable')
          } else if (event.data === 101 || event.data === 150) {
            console.error('Video not allowed in embedded player')
          }
        },
      },
    })
  } catch (error) {
    console.error('Failed to create player:', error)
  }
}

const playNextVideo = () => {
  if (videoIds.value.length === 0) return
  currentVideoIndex.value = (currentVideoIndex.value + 1) % videoIds.value.length
  
  if (player.value && isPlayerReady.value && typeof player.value.loadVideoById === 'function') {
    try {
      player.value.loadVideoById(videoIds.value[currentVideoIndex.value])
      console.log('Playing next video:', videoIds.value[currentVideoIndex.value])
    } catch (error) {
      console.error('Error loading next video:', error)
      initializePlayer()
    }
  } else {
    console.warn('Player not ready for next video, reinitializing...')
    initializePlayer()
  }
}

const playPreviousVideo = () => {
  if (videoIds.value.length === 0) return
  currentVideoIndex.value =
    currentVideoIndex.value === 0 ? videoIds.value.length - 1 : currentVideoIndex.value - 1
  
  if (player.value && isPlayerReady.value && typeof player.value.loadVideoById === 'function') {
    try {
      player.value.loadVideoById(videoIds.value[currentVideoIndex.value])
      console.log('Playing previous video:', videoIds.value[currentVideoIndex.value])
    } catch (error) {
      console.error('Error loading previous video:', error)
      initializePlayer()
    }
  } else {
    console.warn('Player not ready for previous video, reinitializing...')
    initializePlayer()
  }
}

const playVideoAtIndex = (index) => {
  if (videoIds.value.length === 0) return
  currentVideoIndex.value = index
  
  // Validate player exists and has the method
  if (player.value && isPlayerReady.value && typeof player.value.loadVideoById === 'function') {
    try {
      player.value.loadVideoById(videoIds.value[currentVideoIndex.value])
      console.log('Loading video at index:', index, 'videoId:', videoIds.value[currentVideoIndex.value])
    } catch (error) {
      console.error('Error loading video:', error)
      // Try to reinitialize player
      initializePlayer()
    }
  } else {
    console.warn('Player not ready, attempting to initialize...', {
      hasPlayer: !!player.value,
      isReady: isPlayerReady.value,
      hasMethod: player.value ? typeof player.value.loadVideoById : 'no player'
    })
    // Try to initialize player if not ready
    if (window.YT && window.YT.Player) {
      initializePlayer()
    }
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

const togglePlay = () => {
  if (!player.value || !isPlayerReady.value) {
    console.warn('Player not ready')
    return
  }

  try {
    const playerState = player.value.getPlayerState()
    
    if (playerState === window.YT.PlayerState.PLAYING) {
      player.value.pauseVideo()
      isPlaying.value = false
    } else {
      player.value.playVideo()
      isPlaying.value = true
    }
  } catch (error) {
    console.error('Error toggling play/pause:', error)
  }
}

// Helper function for consistent state change handling
const handlePlayerStateChange = (event) => {
  if (event.data === window.YT.PlayerState.PLAYING) {
    isPlaying.value = true
  } else if (event.data === window.YT.PlayerState.PAUSED) {
    isPlaying.value = false
  } else if (event.data === window.YT.PlayerState.ENDED) {
    isPlaying.value = false
    playNextVideo()
  }
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
    } else if (
      draggedIndex.value < currentVideoIndex.value &&
      dropIndex >= currentVideoIndex.value
    ) {
      currentVideoIndex.value--
    } else if (
      draggedIndex.value > currentVideoIndex.value &&
      dropIndex <= currentVideoIndex.value
    ) {
      currentVideoIndex.value++
    }

    // Update videos array
    videos.value = newOrder
    videoIds.value = newOrder.map((video) => video.video_id)

    // Player will continue playing current video without interruption
    // currentVideoIndex has been updated to reflect new position
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
    videoIds.value = newOrder.map((video) => video.video_id)

    // Player will continue playing current video without interruption
    // currentVideoIndex has been updated to reflect new position
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
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = instantPlayUrl.value.match(regex)
    if (match) {
      videoId = match[1]
    }

    // Add to history (only if not already in history)
    if (!instantPlayHistory.value.some((h) => h.video_id === videoId)) {
      // Try to fetch video title
      let title = videoId
      try {
        const videoInfo = await fetchVideoInfo(videoId)
        title = videoInfo.title || videoId
      } catch (error) {
        console.log('Could not fetch title for history:', error)
      }

      const historyItem = {
        video_id: videoId,
        title: title,
        url: instantPlayUrl.value,
        played_at: new Date().toISOString(),
      }
      instantPlayHistory.value.unshift(historyItem)

      // Keep only last 50 items
      if (instantPlayHistory.value.length > 50) {
        instantPlayHistory.value = instantPlayHistory.value.slice(0, 50)
      }
    }

    // Play instantly without adding to playlist
    if (player.value && isPlayerReady.value) {
      player.value.loadVideoById(videoId)
    } else {
      // If player not ready, initialize with this video
      if (window.YT) {
        player.value = new window.YT.Player('player', {
          height: audioOnlyMode.value ? '1' : '100%',
          width: audioOnlyMode.value ? '1' : '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: audioOnlyMode.value ? 0 : 1,
            loop: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 1,
            vq: audioOnlyMode.value ? 'tiny' : 'default',
          },
          events: {
            onReady: (event) => {
              isPlayerReady.value = true
              event.target.setVolume(volume.value)
              if (audioOnlyMode.value) {
                event.target.setPlaybackQuality('small')
              }
              event.target.playVideo()
              isPlaying.value = true
            },
            onStateChange: (event) => {
              // Update playing state
              if (event.data === window.YT.PlayerState.PLAYING) {
                isPlaying.value = true
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                isPlaying.value = false
              } else if (event.data === window.YT.PlayerState.ENDED) {
                isPlaying.value = false
                // Don't auto-next for instant play
              }
            },
          },
        })
      }
    }

    instantPlayUrl.value = ''
  } catch (error) {
    console.error('Error playing video:', error)
    alert('Could not play video')
  }
}

const playFromHistory = (videoId) => {
  if (player.value && isPlayerReady.value) {
    player.value.loadVideoById(videoId)
  }
}

const playPlaylistItem = (data) => {
  console.log('Playing playlist item:', data)
  
  if (!data || !data.videoId) {
    alert('Invalid video data')
    return
  }
  
  const { videoId, playlist } = data
  
  // If playlist data is provided, set up playlist playback
  if (playlist && playlist.videoIds && playlist.videoIds.length > 0) {
    console.log('Setting up playlist playback:', playlist)
    
    // Update videos and videoIds with playlist data
    videos.value = playlist.videoIds.map((vid, idx) => ({
      id: idx,
      video_id: vid,
      title: playlist.titles[idx] || `Playlist Item ${idx + 1}`,
    }))
    videoIds.value = playlist.videoIds
    currentVideoIndex.value = playlist.currentIndex
    
    // Switch to playlist tab if not already there
    if (activeTab.value !== ROUTES.PLAYLIST) {
      activeTab.value = ROUTES.PLAYLIST
    }
    
    // Play the video
    const playVideo = () => {
      if (player.value && isPlayerReady.value) {
        console.log('Using existing player, loading video:', videoId)
        player.value.loadVideoById(videoId)
        player.value.playVideo().catch(() => {
          console.log('Autoplay blocked, user needs to click play')
        })
      } else {
        // Initialize new player
        console.log('Initializing new player with video:', videoId)
        initPlaylistPlayer(videoId)
      }
    }
    
    // Wait for YouTube API and DOM
    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        const playerElement = document.getElementById('player')
        if (playerElement) {
          playVideo()
        } else {
          setTimeout(initPlayer, 100)
        }
      } else {
        setTimeout(initPlayer, 100)
      }
    }
    initPlayer()
  } else {
    // Just play single video without playlist
    if (player.value && isPlayerReady.value) {
      player.value.loadVideoById(videoId)
    } else {
      if (window.YT && window.YT.Player) {
        player.value = new window.YT.Player('player', {
          height: audioOnlyMode.value ? '1' : '100%',
          width: audioOnlyMode.value ? '1' : '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: audioOnlyMode.value ? 0 : 1,
            loop: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 1,
            enablejsapi: 1,
            vq: audioOnlyMode.value ? 'tiny' : 'default',
          },
          events: {
            onReady: (event) => {
              isPlayerReady.value = true
              event.target.setVolume(volume.value)
              if (audioOnlyMode.value) {
                event.target.setPlaybackQuality('small')
              }
              event.target.playVideo().then(() => {
                isPlaying.value = true
              }).catch(() => {
                console.log('Autoplay blocked, user needs to click play')
              })
            },
            onStateChange: (event) => {
              // Update playing state
              if (event.data === window.YT.PlayerState.PLAYING) {
                isPlaying.value = true
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                isPlaying.value = false
              } else if (event.data === window.YT.PlayerState.ENDED) {
                isPlaying.value = false
                // Don't auto-next for single video
              }
            },
          },
        })
      }
    }
  }
}

const initPlaylistPlayer = (videoId) => {
  try {
    // Destroy existing player if it exists
    if (player.value) {
      try {
        player.value.destroy?.()
      } catch (e) {
        console.warn('Error destroying old player:', e)
      }
      player.value = null
      isPlayerReady.value = false
    }
    
    // Create new player
    player.value = new window.YT.Player('player', {
      height: audioOnlyMode.value ? '1' : '100%',
      width: audioOnlyMode.value ? '1' : '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: audioOnlyMode.value ? 0 : 1,
        loop: 0,
        modestbranding: 0,
        rel: 0,
        showinfo: 1,
        enablejsapi: 1,
        vq: audioOnlyMode.value ? 'tiny' : 'default',
      },
      events: {
        onReady: (event) => {
          console.log('Playlist player ready!')
          isPlayerReady.value = true
          event.target.setVolume(volume.value)
          if (audioOnlyMode.value) {
            event.target.setPlaybackQuality('small')
          }
          event.target.playVideo().then(() => {
            isPlaying.value = true
          }).catch(() => {
            console.log('Autoplay blocked, user needs to click play')
          })
        },
        onStateChange: handlePlayerStateChange,
        onError: (event) => {
          console.error('Player error:', event.data)
        },
      },
    })
  } catch (error) {
    console.error('Failed to create player:', error)
    alert('Failed to initialize video player. Please try again.')
  }
}

const playPlaylistAll = (data) => {
  console.log('Playing entire playlist:', data)
  
  if (!data || !data.playlist) {
    alert('Invalid playlist data')
    return
  }
  
  const { playlist } = data
  const { videoIds, titles, currentIndex = 0 } = playlist
  
  if (!videoIds || videoIds.length === 0) {
    alert('No valid video IDs found in this playlist')
    return
  }
  
  // Update videos and videoIds with playlist data
  videos.value = videoIds.map((vid, idx) => ({
    id: idx,
    video_id: vid,
    title: titles[idx] || `Playlist Item ${idx + 1}`,
  }))
  videoIds.value = videoIds
  currentVideoIndex.value = currentIndex
  
  // Switch to playlist tab if not already there
  if (activeTab.value !== ROUTES.PLAYLIST) {
    activeTab.value = ROUTES.PLAYLIST
  }
  
  // Play the first video
  const firstVideoId = videoIds[currentIndex]
  const playVideo = () => {
    if (player.value && isPlayerReady.value) {
      console.log('Using existing player, loading video:', firstVideoId)
      player.value.loadVideoById(firstVideoId)
      player.value.playVideo().catch(() => {
        console.log('Autoplay blocked, user needs to click play')
      })
    } else {
      // Initialize new player
      console.log('Initializing new player with video:', firstVideoId)
      initPlaylistPlayer(firstVideoId)
    }
  }
  
  // Wait for YouTube API and DOM
  const initPlayer = () => {
    if (window.YT && window.YT.Player) {
      const playerElement = document.getElementById('player')
      if (playerElement) {
        playVideo()
      } else {
        setTimeout(initPlayer, 100)
      }
    } else {
      setTimeout(initPlayer, 100)
    }
  }
  initPlayer()
}

const clearHistory = () => {
  if (confirm('Clear all instant play history?')) {
    instantPlayHistory.value = []
  }
}

const addFromHistory = async (videoId) => {
  try {
    addingToPlaylist.value = videoId

    // Check if video already exists in playlist
    if (videos.value.some((v) => v.video_id === videoId)) {
      alert('This video is already in your playlist!')
      return
    }

    // Fetch video info from YouTube
    const videoInfo = await fetchVideoInfo(videoId)

    // Prepare video data
    const videoData = {
      title: videoInfo.title || videoId,
      video_id: videoId,
      youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail_url:
        videoInfo.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      duration: videoInfo.duration || '',
    }

    // Add to database
    await videoService.create(videoData)
    await fetchVideos() // Refresh the list
    alert('✅ Video added to playlist!')
  } catch (error) {
    console.error('Error adding video from history:', error)
    alert(`Error: ${error.message || 'Error adding video to playlist'}`)
  } finally {
    addingToPlaylist.value = null
  }
}

const isInPlaylist = (videoId) => {
  return videos.value.some((v) => v.video_id === videoId)
}

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const handleChangeTab = (tab) => {
  if (isValidRoute(tab)) {
    activeTab.value = tab
    
    // Exit audio mode when switching away from playlist tab
    if (tab !== ROUTES.PLAYLIST && audioOnlyMode.value) {
      audioOnlyMode.value = false
      showSidebar.value = true
    }
  } else {
    activeTab.value = DEFAULT_ROUTE
  }
}

const handleUpdateNewVideo = (updatedVideo) => {
  newVideo.value = updatedVideo
}

const handleCancelAdd = () => {
  resetForm()
  showAddForm.value = false
}

const handleToggleAddForm = () => {
  showAddForm.value = !showAddForm.value
}

const toggleAudioOnlyMode = () => {
  audioOnlyMode.value = !audioOnlyMode.value
  
  // When entering audio mode, hide sidebar
  if (audioOnlyMode.value) {
    showSidebar.value = false
  }
  
  // Reinitialize player with new settings
  if (player.value && isPlayerReady.value && videoIds.value.length > 0) {
    const currentTime = player.value.getCurrentTime()
    const playerState = player.value.getPlayerState()
    const wasPlaying = playerState === window.YT.PlayerState.PLAYING
    
    // Destroy and recreate player
    try {
      player.value.destroy()
    } catch (e) {
      console.warn('Error destroying player:', e)
    }
    
    player.value = null
    isPlayerReady.value = false
    
    // Reinitialize after a brief delay
    setTimeout(() => {
      initializePlayer()
      
      // Wait for player to be ready, then restore playback
      const checkReady = setInterval(() => {
        if (isPlayerReady.value && player.value) {
          clearInterval(checkReady)
          
          // Seek to saved position
          try {
            player.value.seekTo(currentTime, true)
            if (wasPlaying) {
              player.value.playVideo()
            }
          } catch (e) {
            console.warn('Error restoring playback:', e)
          }
        }
      }, 100)
    }, 100)
  }
}

// Authentication handlers
const handleLoginSuccess = (user) => {
  isAuthenticated.value = true
  currentUser.value = user
}

const handleSignOut = () => {
  authService.logout()
  
  // Reset all state variables
  isAuthenticated.value = false
  currentUser.value = null
  showProfileModal.value = false
  
  // Reset video states
  videos.value = []
  videoIds.value = []
  currentVideoIndex.value = 0
  
  // Reset player states
  player.value = null
  isPlayerReady.value = false
  
  // Reset UI states
  showAddForm.value = false
  loading.value = false
  volume.value = 50
  isMuted.value = false
  showVolumeSlider.value = false
  activeTab.value = DEFAULT_ROUTE
  instantPlayUrl.value = ''
  draggedIndex.value = null
  draggedOverIndex.value = null
  instantPlayHistory.value = []
  addingToPlaylist.value = null
  showSidebar.value = true
  youtubeApiReady.value = false
  
  // Reset form data
  newVideo.value = {
    title: '',
    video_id: '',
    youtube_url: '',
    thumbnail_url: '',
    duration: '',
  }
}

const handleProfile = () => {
  showProfileModal.value = true
}

const checkAuthentication = () => {
  const storedUser = localStorage.getItem('user')
  const storedAuth = localStorage.getItem('isAuthenticated')
  
  if (storedAuth === 'true' && storedUser) {
    try {
      currentUser.value = JSON.parse(storedUser)
      isAuthenticated.value = true
    } catch (e) {
      console.error('Error parsing user data:', e)
      handleSignOut()
    }
  }
}

// Computed properties
const currentVideo = computed(() => {
  // If we have videos in playlist, return current one
  if (videos.value.length > 0 && videos.value[currentVideoIndex.value]) {
    return videos.value[currentVideoIndex.value]
  }
  
  // If no videos but we have instant play history, return the last played
  if (instantPlayHistory.value.length > 0) {
    return {
      title: instantPlayHistory.value[0].title,
      video_id: instantPlayHistory.value[0].video_id,
    }
  }
  
  return null
})

// Watch for authentication changes and fetch videos when user logs in
watch(isAuthenticated, async (authenticated) => {
  if (authenticated) {
    // User just logged in, fetch videos
    await fetchVideos()
  }
})

// Watch for tab changes and fetch videos when switching to playlist tab
watch(activeTab, async (newTab) => {
  if (newTab === ROUTES.PLAYLIST && isAuthenticated.value) {
    await fetchVideos()
  }
})

const handleAuthError = () => {
  handleSignOut()
}

const loadYouTubeAPI = async () => {
  // Check if already loaded
  if (window.YT) {
    console.log('YouTube API already loaded')
    youtubeApiReady.value = true
    return
  }

  // Get configuration
  const useProxy = import.meta.env.VITE_USE_PROXY === 'true' || import.meta.env.VITE_USE_PROXY === '1'
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  
  const proxyUrl = `${apiBase}/proxy/youtube-api`
  const directUrl = 'https://www.youtube.com/iframe_api'

  // Try loading with proxy first if enabled, otherwise try direct
  const tryLoad = (url, method) => {
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script')
      tag.src = url
      
      tag.onload = () => {
        console.log(`YouTube API loaded successfully via ${method}`)
        resolve()
      }
      
      tag.onerror = (error) => {
        console.error(`Failed to load YouTube API via ${method}:`, error)
        reject(error)
      }

      // Clean up any existing tag first
      const existingTag = document.querySelector('script[src*="youtube.com/iframe_api"], script[src*="/proxy/youtube-api"]')
      if (existingTag) {
        existingTag.remove()
      }

      const firstScriptTag = document.getElementsByTagName('script')[0]
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      } else {
        document.head.appendChild(tag)
      }
    })
  }

  // Try loading: proxy first if enabled, then direct as fallback
  try {
    if (useProxy) {
      console.log('Attempting to load YouTube API through proxy...')
      try {
        await tryLoad(proxyUrl, 'proxy')
      } catch (proxyError) {
        console.warn('Proxy loading failed, trying direct connection...', proxyError)
        await tryLoad(directUrl, 'direct')
      }
    } else {
      console.log('Loading YouTube API directly...')
      await tryLoad(directUrl, 'direct')
    }
  } catch (error) {
    console.error('Failed to load YouTube API after all attempts:', error)
    // Still try to proceed - player might work if API loads later
  }
}

onMounted(async () => {
  // Load YouTube API (with proxy support)
  await loadYouTubeAPI()

  // Listen for authentication errors (token expired, etc.)
  eventBus.on('auth-error', handleAuthError)

  // Check authentication
  checkAuthentication()
  
  // Fetch videos from database
  await fetchVideos()
})

onUnmounted(() => {
  // Clean up event listener
  eventBus.off('auth-error', handleAuthError)
})
</script>

<template>
  <LoginPage v-if="!isAuthenticated" @login-success="handleLoginSuccess" />

  <template v-else>
    <AppHeader
      :show-sidebar="showSidebar"
      :active-tab="activeTab"
      :audio-only-mode="audioOnlyMode"
      @toggle-sidebar="toggleSidebar"
      @change-tab="handleChangeTab"
      @profile="handleProfile"
      @signout="handleSignOut"
      @toggle-audio-mode="toggleAudioOnlyMode"
    />
    <main>
    <VideoPlayer 
      :loading="loading" 
      :video-ids="videoIds" 
      :show-sidebar="showSidebar" 
      :audio-only-mode="audioOnlyMode" 
      :is-player-ready="isPlayerReady"
      :current-video="currentVideo"
      :videos="videos"
      :current-video-index="currentVideoIndex"
      :volume="volume"
      :is-muted="isMuted"
      :is-playing="isPlaying"
      @play-video="playVideoAtIndex"
      @play-next="playNextVideo"
      @play-previous="playPreviousVideo"
      @toggle-mute="toggleMute"
      @set-volume="setVolume"
      @toggle-play="togglePlay"
    />

    <div v-show="showSidebar" id="list-container">
      <YouTubeTab
        v-if="activeTab === ROUTES.YOUTUBE"
        :instant-play-url="instantPlayUrl"
        :video-ids="videoIds"
        :is-muted="isMuted"
        :instant-play-history="instantPlayHistory"
        :adding-to-playlist="addingToPlaylist"
        :is-in-playlist="isInPlaylist"
        :current-video="currentVideo"
        :volume="volume"
        :show-volume-slider="showVolumeSlider"
        @update:instant-play-url="instantPlayUrl = $event"
        @instant-play="instantPlay"
        @play-previous="playPreviousVideo"
        @play-next="playNextVideo"
        @toggle-mute="toggleMute"
        @adjust-volume="adjustVolume"
        @set-volume="setVolume"
        @toggle-volume-slider="toggleVolumeSlider"
        @play-from-history="playFromHistory"
        @clear-history="clearHistory"
        @add-from-history="addFromHistory"
      />

      <InstantPlayTab
        v-if="activeTab === ROUTES.INSTANT_PLAY"
        :instant-play-url="instantPlayUrl"
        :video-ids="videoIds"
        :is-muted="isMuted"
        :instant-play-history="instantPlayHistory"
        :adding-to-playlist="addingToPlaylist"
        :is-in-playlist="isInPlaylist"
        @update:instant-play-url="instantPlayUrl = $event"
        @instant-play="instantPlay"
        @play-previous="playPreviousVideo"
        @play-next="playNextVideo"
        @toggle-mute="toggleMute"
        @play-from-history="playFromHistory"
        @clear-history="clearHistory"
        @add-from-history="addFromHistory"
      />

      <MoviesTab
        v-if="activeTab === ROUTES.MOVIES"
        :loading="loading"
      />

      <PlaylistTab
        v-if="activeTab === ROUTES.PLAYLIST"
        :current-video="currentVideo"
        :video-ids="videoIds"
        :volume="volume"
        :is-muted="isMuted"
        :show-volume-slider="showVolumeSlider"
        :show-add-form="showAddForm"
        :new-video="newVideo"
        :loading="loading"
        :videos="videos"
        :current-video-index="currentVideoIndex"
        :dragged-index="draggedIndex"
        :dragged-over-index="draggedOverIndex"
        @play-previous="playPreviousVideo"
        @play-next="playNextVideo"
        @toggle-mute="toggleMute"
        @adjust-volume="adjustVolume"
        @set-volume="setVolume"
        @toggle-volume-slider="toggleVolumeSlider"
        @toggle-add-form="handleToggleAddForm"
        @update:new-video="handleUpdateNewVideo"
        @add-video="addVideo"
        @fetch-details="fetchVideoDetails"
        @cancel-add="handleCancelAdd"
        @play-video="playVideoAtIndex"
        @delete-video="deleteVideo"
        @move-to-top="moveVideoToTop"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @drag-over="handleDragOver"
        @drag-leave="handleDragLeave"
        @drop="handleDrop"
        @play-item="playPlaylistItem"
        @play-all="playPlaylistAll"
      />
    </div>
  </main>

  <!-- Profile Modal -->
  <div v-if="showProfileModal" class="modal-overlay" @click="showProfileModal = false">
    <div class="profile-modal" @click.stop>
      <div class="modal-header">
        <h2>Profile</h2>
        <button @click="showProfileModal = false" class="close-btn">✖</button>
      </div>
      <div class="modal-body" v-if="currentUser">
        <div class="profile-info">
          <div class="info-item">
            <label>Email:</label>
            <span>{{ currentUser.email }}</span>
          </div>
          <div class="info-item" v-if="currentUser.username">
            <label>Username:</label>
            <span>{{ currentUser.username }}</span>
          </div>
          <div class="info-item" v-if="currentUser.created_at">
            <label>Member Since:</label>
            <span>{{ new Date(currentUser.created_at).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  </template>
</template>

<style scoped>
main {
  width: 100vw;
  height: calc(100vh - 60px);
  overflow: hidden;
  margin-top: 60px;
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

/* Large Desktop (>= 1440px) */
@media screen and (min-width: 1440px) {
  main {
    height: calc(100vh - 70px);
    margin-top: 70px;
  }
}

/* Desktop (1024px - 1439px) */
@media screen and (min-width: 1024px) and (max-width: 1439px) {
  main {
    height: calc(100vh - 60px);
    margin-top: 60px;
  }
}

/* Tablet (768px - 1023px) */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  main {
    height: calc(100vh - 55px);
    margin-top: 55px;
    gap: 12px;
    padding: 12px;
  }
}

/* Mobile (< 768px) */
@media screen and (max-width: 767px) {
  main {
    height: calc(100vh - 50px);
    margin-top: 50px;
    gap: 10px;
    padding: 10px;
  }
}

/* Desktop (>= 1024px) - Default */
#list-container {
  width: 30%;
  height: 100%;
  background-color: #2a2a2a;
  border-radius: 10px;
  padding: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-width: 320px;
  min-height: 0;
}

/* Large Desktop (>= 1440px) */
@media screen and (min-width: 1440px) {
  main {
    gap: 20px;
    padding: 20px;
  }

  #list-container {
    width: 28%;
    padding: 20px;
    min-width: 350px;
  }
}

/* Tablet (768px - 1023px) */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  main {
    gap: 12px;
    padding: 12px;
  }

  #list-container {
    width: 35%;
    min-width: 280px;
    padding: 12px;
  }
}

/* Mobile (< 768px) */
@media screen and (max-width: 767px) {
  main {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    height: calc(100vh - 80px);
    margin-top: 80px;
  }

  #list-container {
    width: 100%;
    height: auto;
    max-height: 40vh;
    min-width: auto;
    padding: 10px;
  }
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.profile-modal {
  background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(78, 205, 196, 0.2);
  animation: slideUp 0.3s ease;
}

/* Tablet responsive for modal */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .profile-modal {
    width: 85%;
    max-width: 450px;
  }

  .modal-header {
    padding: 18px 20px;
  }

  .modal-header h2 {
    font-size: 22px;
  }

  .modal-body {
    padding: 20px;
  }
}

/* Mobile responsive for modal */
@media screen and (max-width: 767px) {
  .profile-modal {
    width: 95%;
    max-width: none;
    border-radius: 12px;
  }

  .modal-header {
    padding: 15px 18px;
  }

  .modal-header h2 {
    font-size: 20px;
  }

  .modal-body {
    padding: 18px;
  }

  .info-item span {
    font-size: 14px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(78, 205, 196, 0.2);
}

.modal-header h2 {
  color: #4ecdc4;
  margin: 0;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
}

.close-btn:hover {
  background-color: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.modal-body {
  padding: 24px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item label {
  color: #888;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  color: #fff;
  font-size: 16px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
