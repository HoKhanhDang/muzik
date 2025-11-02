<script setup>
import { ref } from 'vue'
import PlaylistManager from './PlaylistManager.vue'
import PlayerControls from '../video/PlayerControls.vue'
import AddVideoForm from '../video/AddVideoForm.vue'
import VideoListItem from '../video/VideoListItem.vue'
import AddToPlaylistDialog from './AddToPlaylistDialog.vue'

defineProps({
  currentVideo: Object,
  videoIds: Array,
  volume: Number,
  isMuted: Boolean,
  showVolumeSlider: Boolean,
  showAddForm: Boolean,
  newVideo: Object,
  loading: Boolean,
  videos: Array,
  currentVideoIndex: Number,
  draggedIndex: Number,
  draggedOverIndex: Number,
})

defineEmits([
  'play-previous',
  'play-next',
  'toggle-mute',
  'adjust-volume',
  'set-volume',
  'toggle-volume-slider',
  'toggle-add-form',
  'update:newVideo',
  'add-video',
  'fetch-details',
  'cancel-add',
  'play-video',
  'delete-video',
  'move-to-top',
  'drag-start',
  'drag-end',
  'drag-over',
  'drag-leave',
  'drop',
  'play-item',
  'play-all',
])

const isCompactMode = ref(false)
const isPlayerControlsVisible = ref(true)
const viewMode = ref('videos') // 'videos' | 'playlists'
const showAddToPlaylistDialog = ref(false)
const selectedVideo = ref(null)

const handleToggleCompactMode = () => {
  isCompactMode.value = !isCompactMode.value
}

const handleVisibilityChanged = (isVisible) => {
  isPlayerControlsVisible.value = isVisible
}

const handleSwitchView = (mode) => {
  viewMode.value = mode
}

const handleAddToPlaylist = (video) => {
  selectedVideo.value = video
  showAddToPlaylistDialog.value = true
}

const handleCloseDialog = () => {
  showAddToPlaylistDialog.value = false
  selectedVideo.value = null
}

const handleVideoAdded = (data) => {
  alert(`Đã thêm "${selectedVideo.value?.title}" vào playlist "${data.playlistName}"`)
  handleCloseDialog()
}
</script>

<template>
  <div class="tab-content playlist-tab">
    <div class="view-switcher">
      <button
        @click="handleSwitchView('videos')"
        :class="{ active: viewMode === 'videos' }"
        class="switch-btn"
      >
        🎬 Videos
      </button>
      <button
        @click="handleSwitchView('playlists')"
        :class="{ active: viewMode === 'playlists' }"
        class="switch-btn"
      >
        📋 Playlists
      </button>
    </div>

    <div v-if="viewMode === 'videos'" class="videos-view">
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
        @visibility-changed="handleVisibilityChanged"
      />

      <div v-show="!currentVideo || isPlayerControlsVisible" class="add-video-section">
        <button @click="$emit('toggle-add-form')" class="add-btn">
          {{ showAddForm ? '✖ Cancel' : '➕ Add Video' }}
        </button>
      </div>

      <AddVideoForm
        v-if="showAddForm"
        :new-video="newVideo"
        :loading="loading"
        @update:newVideo="$emit('update:newVideo', $event)"
        @add-video="$emit('add-video')"
        @fetch-details="$emit('fetch-details')"
        @cancel="$emit('cancel-add')"
      />

      <div class="playlist">
        <div class="playlist-header">
          <h3>Your Videos ({{ videos.length }})</h3>
          <button @click="handleToggleCompactMode" class="compact-toggle-btn" :title="isCompactMode ? 'Expand View' : 'Compact View'">
            {{ isCompactMode ? '📋' : '📄' }}
          </button>
        </div>
        <div v-if="loading" class="loading">Loading...</div>
        <ul v-else-if="videos.length > 0" :class="{ compact: isCompactMode }">
          <VideoListItem
            v-for="(video, index) in videos"
            :key="video.id"
            :video="video"
            :index="index"
            :current-video-index="currentVideoIndex"
            :dragged-index="draggedIndex"
            :dragged-over-index="draggedOverIndex"
            :is-compact="isCompactMode"
            @play-video="$emit('play-video', $event)"
            @delete-video="$emit('delete-video', $event)"
            @move-to-top="$emit('move-to-top', $event)"
            @add-to-playlist="handleAddToPlaylist"
            @drag-start="(event, idx) => $emit('drag-start', event, idx)"
            @drag-end="$emit('drag-end', $event)"
            @drag-over="(event, idx) => $emit('drag-over', event, idx)"
            @drag-leave="$emit('drag-leave', $event)"
            @drop="(event, idx) => $emit('drop', event, idx)"
          />
        </ul>
        <div v-else class="empty-playlist">
          <p>No videos yet. Add your first video!</p>
        </div>
      </div>
    </div>

    <div v-else-if="viewMode === 'playlists'" class="playlists-view">
      <PlaylistManager 
        @play-item="$emit('play-item', $event)" 
        @play-all="$emit('play-all', $event)" 
      />
    </div>

    <AddToPlaylistDialog
      :video="selectedVideo"
      :show="showAddToPlaylistDialog"
      @close="handleCloseDialog"
      @added="handleVideoAdded"
    />
  </div>
</template>

<style scoped>
.tab-content {
  animation: fadeIn 0.3s ease-in-out;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.view-switcher {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(78, 205, 196, 0.2);
}

.switch-btn {
  background: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.2);
  color: #888;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  flex: 1;
}

.switch-btn:hover {
  background: rgba(78, 205, 196, 0.2);
  border-color: rgba(78, 205, 196, 0.4);
  color: #ccc;
}

.switch-btn.active {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  border-color: #4ecdc4;
  color: white;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.videos-view,
.playlists-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.add-video-section {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.add-video-section .add-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  width: 100%;
  max-width: 300px;
}

.add-video-section .add-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(78, 205, 196, 0.4);
}

.add-video-section .add-btn:active {
  transform: translateY(0);
}

.playlist {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.playlist::-webkit-scrollbar {
  display: none;
}

.playlist h3 {
  color: #4ecdc4;
  margin-bottom: 15px;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.playlist-header h3 {
  margin-bottom: 0;
}

.compact-toggle-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.compact-toggle-btn:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.compact-toggle-btn:active {
  transform: translateY(0);
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
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.playlist ul::-webkit-scrollbar {
  display: none;
}

/* Tablet (768px - 1023px) */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .view-switcher {
    gap: 8px;
    margin-bottom: 15px;
    padding-bottom: 12px;
  }

  .switch-btn {
    padding: 8px 16px;
    font-size: 13px;
  }

  .add-video-section .add-btn {
    padding: 10px 20px;
    font-size: 13px;
    max-width: 280px;
  }

  .playlist-header h3 {
    font-size: 16px;
  }

  .compact-toggle-btn {
    padding: 6px 10px;
    font-size: 14px;
  }
}

/* Mobile (< 768px) */
@media screen and (max-width: 767px) {
  .view-switcher {
    gap: 6px;
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .switch-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .add-video-section {
    margin-bottom: 12px;
  }

  .add-video-section .add-btn {
    padding: 10px 16px;
    font-size: 12px;
    max-width: 100%;
  }

  .playlist-header {
    margin-bottom: 12px;
  }

  .playlist-header h3 {
    font-size: 15px;
  }

  .compact-toggle-btn {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>
