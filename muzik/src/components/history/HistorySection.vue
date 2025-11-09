<script setup>
import SvgIcon from '../common/SvgIcon.vue'

defineProps({
  instantPlayHistory: Array,
  addingToPlaylist: String,
  isInPlaylist: Function,
})

defineEmits(['play-from-history', 'clear-history', 'add-from-history'])
</script>

<template>
  <div class="history-section" v-if="instantPlayHistory.length > 0">
    <div class="history-header">
      <h4 class="history-heading">
        <SvgIcon name="history" :size="16" />
        <span>History</span>
      </h4>
      <button @click="$emit('clear-history')" class="clear-history-btn">
        <SvgIcon name="delete" :size="14" />
        <span>Clear</span>
      </button>
    </div>
    <div class="history-list">
      <div
        v-for="(item, index) in instantPlayHistory"
        :key="index"
        class="history-item"
      >
        <div class="history-thumbnail" @click="$emit('play-from-history', item.video_id)">
          <img
            :src="`https://img.youtube.com/vi/${item.video_id}/mqdefault.jpg`"
            alt="Thumbnail"
          />
          <div class="play-overlay">
            <SvgIcon name="play" :size="24" color="white" />
          </div>
        </div>
        <div class="history-info" @click="$emit('play-from-history', item.video_id)">
          <p class="history-title">{{ item.title || item.video_id }}</p>
          <p class="history-time">{{ new Date(item.played_at).toLocaleString() }}</p>
        </div>
        <div class="history-actions">
          <button
            v-if="!isInPlaylist(item.video_id) && addingToPlaylist !== item.video_id"
            @click.stop="$emit('add-from-history', item.video_id)"
            class="history-add-btn"
            title="Add to Playlist"
          >
            <SvgIcon name="add" :size="18" />
          </button>
          <div
            v-else-if="addingToPlaylist === item.video_id"
            class="adding-spinner"
            title="Adding to playlist..."
          >
            <div class="spinner-icon">⏳</div>
          </div>
          <span v-else class="in-playlist-badge" title="Already in playlist">
            <SvgIcon name="check" :size="18" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-section {
  margin-top: 20px;
  background-color: #3a3a3a;
  border-radius: 8px;
  padding: 15px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.history-header h4 {
  color: #4ecdc4;
  margin: 0;
  font-size: 16px;
}

.history-heading {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-history-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-history-btn:hover {
  background: linear-gradient(135deg, #ee5a52 0%, #ff6b6b 100%);
  transform: translateY(-2px);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background-color: #2a2a2a;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.history-item:hover {
  background-color: #3a3a3a;
}

.history-thumbnail {
  position: relative;
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-thumbnail:hover {
  transform: scale(1.05);
}

.history-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.history-thumbnail:hover .play-overlay {
  opacity: 1;
}

.play-overlay .svg-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.history-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.history-title {
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.history-time {
  color: #888;
  font-size: 12px;
  margin: 0;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-add-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.history-add-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.history-add-btn:active {
  transform: scale(0.95);
}

.in-playlist-badge {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
  padding: 8px;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(81, 207, 102, 0.3);
}

.adding-spinner {
  background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
  padding: 8px;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.spinner-icon {
  font-size: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #6a6a6a;
}
</style>
