<script setup>
import { watch } from 'vue'

const props = defineProps({
  playlists: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['view', 'delete'])

// Helper function to get items count
const getItemsCount = (playlist) => {
  if (playlist.items_count !== undefined && playlist.items_count !== null) {
    return Number(playlist.items_count)
  }
  if (playlist.items && Array.isArray(playlist.items)) {
    return playlist.items.length
  }
  return 0
}

// Debug: log playlists data (can be removed in production)
watch(() => props.playlists, (newVal) => {
  if (newVal && newVal.length > 0) {
    console.log('PlaylistList received playlists:', newVal)
    newVal.forEach(p => {
      const count = getItemsCount(p)
      console.log(`Playlist ${p.id} (${p.name}): items_count = ${count}`)
    })
  }
}, { immediate: true, deep: true })

const handleView = (playlist) => {
  emit('view', playlist)
}

const handleDelete = (id, event) => {
  event.stopPropagation()
  emit('delete', id)
}
</script>

<template>
  <div class="playlist-list">
    <div v-for="playlist in playlists" :key="playlist.id" class="playlist-card" @click="handleView(playlist)">
      <div class="playlist-info">
        <div class="playlist-icon">{{ playlist.type === 'film' ? '🎬' : '🎥' }}</div>
        <div class="playlist-details">
          <h4 class="playlist-name">{{ playlist.name }}</h4>
          <p v-if="playlist.description" class="playlist-description">{{ playlist.description }}</p>
          <div class="playlist-meta">
            <span class="playlist-type">{{ playlist.type === 'film' ? 'Film' : 'Video' }} Playlist</span>
            <span class="playlist-count">{{ getItemsCount(playlist) }} items</span>
          </div>
        </div>
      </div>
      <div class="playlist-actions">
        <button
          @click.stop="handleDelete(playlist.id, $event)"
          class="delete-btn"
          title="Delete playlist"
        >
          ✖
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.playlist-card {
  background: linear-gradient(135deg, rgba(42, 42, 42, 0.95), rgba(58, 58, 58, 0.95));
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.playlist-card:hover {
  border-color: #4ecdc4;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(78, 205, 196, 0.3);
  background: linear-gradient(135deg, rgba(52, 52, 52, 0.95), rgba(68, 68, 68, 0.95));
}

.playlist-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.playlist-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.playlist-details {
  flex: 1;
  min-width: 0;
}

.playlist-name {
  color: #fff;
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-description {
  color: #aaa;
  margin: 0 0 8px 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.playlist-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
}

.playlist-type {
  color: #4ecdc4;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  background: rgba(78, 205, 196, 0.1);
  border-radius: 4px;
}

.playlist-count {
  color: #888;
  font-size: 12px;
}

.playlist-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.delete-btn {
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
  opacity: 0.7;
}

.delete-btn:hover {
  background: rgba(255, 107, 107, 0.3);
  border-color: #ff6b6b;
  opacity: 1;
  transform: scale(1.1);
}
</style>

