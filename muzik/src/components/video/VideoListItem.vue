<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  video: Object,
  index: Number,
  currentVideoIndex: Number,
  draggedIndex: Number,
  draggedOverIndex: Number,
  isCompact: Boolean,
})

defineEmits([
  'play-video',
  'delete-video',
  'move-to-top',
  'add-to-playlist',
  'drag-start',
  'drag-end',
  'drag-over',
  'drag-leave',
  'drop',
])

const thumbnailError = ref(false)

const getThumbnailUrl = computed(() => {
  if (props.video?.thumbnail_url) {
    return props.video.thumbnail_url
  }
  if (props.video?.video_id) {
    return `https://img.youtube.com/vi/${props.video.video_id}/mqdefault.jpg`
  }
  return null
})

const handleThumbnailError = () => {
  thumbnailError.value = true
}

watch(
  () => props.video?.video_id,
  () => {
    thumbnailError.value = false
  },
)
</script>

<template>
  <li
    :class="{
      active: index === currentVideoIndex,
      'drag-over': draggedOverIndex === index,
      dragging: draggedIndex === index,
      compact: isCompact,
    }"
    @click="$emit('play-video', index)"
    draggable="true"
    @dragstart="$emit('drag-start', $event, index)"
    @dragend="$emit('drag-end', $event)"
    @dragover="$emit('drag-over', $event, index)"
    @dragleave="$emit('drag-leave', $event)"
    @drop="$emit('drop', $event, index)"
  >
    <div class="video-item">
      <div v-if="!isCompact" class="drag-handle">⋮⋮</div>
      <div v-if="!isCompact" class="video-thumbnail">
        <img
          v-if="getThumbnailUrl"
          :src="getThumbnailUrl"
          :alt="video.title"
          @error="handleThumbnailError"
        />
        <div v-show="!getThumbnailUrl || thumbnailError" class="placeholder-thumbnail">🎥</div>
      </div>
      <div class="video-info">
        <span class="video-title">{{ video.title }}</span>
      </div>
      <div v-if="!isCompact" class="video-actions">
        <button
          @click.stop="$emit('add-to-playlist', video)"
          class="add-to-playlist-btn"
          title="Add to Playlist"
        >
          ➕
        </button>
        <button
          @click.stop="$emit('move-to-top', index)"
          :disabled="index === 0"
          class="move-to-top-btn"
          title="Move to Top"
        >
          ⬆️
        </button>
        <button @click.stop="$emit('delete-video', video.id)" class="delete-btn">🗑️</button>
      </div>
    </div>
  </li>
</template>

<style scoped>
li {
  margin: 5px 0;
  background-color: #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  position: relative;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

li::-webkit-scrollbar {
  display: none;
}

li.compact {
  margin: 3px 0;
}

li:hover {
  background-color: #4a4a4a;
  transform: translateX(5px);
}

li.active {
  background-color: #ff6b6b;
  color: white;
}

li.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

li.drag-over {
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

li:hover .drag-handle {
  color: #4ecdc4;
}

.video-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px 12px 30px;
  position: relative;
  gap: 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  min-height: 60px;
}

li.compact .video-item {
  padding: 8px 12px;
  min-height: auto;
  gap: 0;
}

.video-thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #666;
  background-color: #1a1a1a;
}

.video-thumbnail img + .placeholder-thumbnail {
  display: none;
}

.video-item::-webkit-scrollbar {
  display: none;
}


li.compact .video-thumbnail {
  width: 60px;
  height: 45px;
}

li.compact .placeholder-thumbnail {
  font-size: 18px;
}

.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.video-info::-webkit-scrollbar {
  display: none;
}

li.compact .video-info {
  flex: 1;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  min-width: 0;
}

li.compact .video-info::-webkit-scrollbar {
  display: none;
}

.video-title {
  display: block;
  font-weight: bold;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  word-break: break-word;
}

li.compact .video-title {
  margin-bottom: 0;
  flex: 1;
  min-width: 0;
  max-width: 100%;
  font-size: 13px;
  font-weight: 500;
}

.video-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}

li:hover .video-actions {
  opacity: 1;
}

/* Tablet và mobile: hiển thị actions luôn */
@media (max-width: 1024px) {
  .video-actions {
    opacity: 1;
  }
}

/* Tablet specific adjustments (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .video-item {
    padding: 10px 10px 10px 28px;
    gap: 10px;
  }

  li.compact .video-item {
    padding: 6px 10px;
  }

  .video-thumbnail {
    width: 70px;
    height: 52px;
  }

  li.compact .video-thumbnail {
    width: 55px;
    height: 41px;
  }

  .video-info {
    flex: 1 1 auto;
    min-width: 200px;
  }

  .video-title {
    font-size: 14px;
    line-height: 1.4;
  }

  .video-actions {
    gap: 4px;
  }

  .add-to-playlist-btn,
  .move-to-top-btn,
  .delete-btn {
    min-width: 36px;
    height: 28px;
    padding: 6px 8px;
    font-size: 11px;
  }
}

/* Mobile adjustments (< 768px) */
@media (max-width: 767px) {
  .video-item {
    padding: 8px 8px 8px 26px;
    gap: 8px;
    min-height: 56px;
  }

  li.compact .video-item {
    padding: 6px 8px;
    min-height: auto;
  }

  .video-thumbnail {
    width: 60px;
    height: 45px;
  }

  li.compact .video-thumbnail {
    width: 50px;
    height: 37px;
  }

  .placeholder-thumbnail {
    font-size: 20px;
  }

  li.compact .placeholder-thumbnail {
    font-size: 16px;
  }

  .video-title {
    font-size: 12px;
    margin-bottom: 2px;
  }

  .add-to-playlist-btn,
  .move-to-top-btn,
  .delete-btn {
    min-width: 32px;
    height: 26px;
    padding: 4px 6px;
    font-size: 10px;
  }

  .drag-handle {
    left: 6px;
    font-size: 11px;
  }
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

.add-to-playlist-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  box-shadow:
    0 4px 15px rgba(78, 205, 196, 0.3),
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

.add-to-playlist-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.add-to-playlist-btn:hover::before {
  left: 100%;
}

.add-to-playlist-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 8px 25px rgba(78, 205, 196, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.add-to-playlist-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow:
    0 2px 10px rgba(78, 205, 196, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
</style>
