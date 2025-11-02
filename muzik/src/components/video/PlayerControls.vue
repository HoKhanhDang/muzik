<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  currentVideo: Object,
  videoIds: Array,
  volume: Number,
  isMuted: Boolean,
  showVolumeSlider: Boolean,
})

const emit = defineEmits([
  'play-previous',
  'play-next',
  'toggle-mute',
  'adjust-volume',
  'set-volume',
  'toggle-volume-slider',
  'visibility-changed',
])

const isVisible = ref(true)

const handleToggleVisibility = () => {
  isVisible.value = !isVisible.value
  console.log('Toggle clicked, isVisible:', isVisible.value)
  emit('visibility-changed', isVisible.value)
}

onMounted(() => {
  emit('visibility-changed', isVisible.value)
})
</script>

<template>
  <div class="playlist-info">
    <div class="playlist-header">
      <h3>Now Playing:</h3>
      <button @click.stop="handleToggleVisibility" class="toggle-btn" :title="isVisible ? 'Hide' : 'Show'">
        <svg v-if="isVisible" class="toggle-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
        </svg>
        <svg v-else class="toggle-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
        </svg>
      </button>
    </div>
    <div v-show="isVisible" class="playlist-content">
      <p class="current-title">{{ currentVideo.title }}</p>
      <p class="current-id">ID: {{ currentVideo.video_id }}</p>
      <div class="controls">
      <button
        @click="$emit('play-previous')"
        :disabled="videoIds.length <= 1"
        class="control-btn prev-btn"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      <div class="volume-controls">
        <button @click="$emit('adjust-volume', -10)" class="control-btn volume-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
          </svg>
        </button>

        <button
          @click="$emit('toggle-mute')"
          class="control-btn mute-btn"
          :class="{ muted: isMuted }"
        >
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

        <button @click="$emit('adjust-volume', 10)" class="control-btn volume-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
            />
          </svg>
        </button>

        <div class="volume-slider-container">
          <button @click="$emit('toggle-volume-slider')" class="control-btn volume-slider-btn">
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
              :value="volume"
              @input="$emit('set-volume', Number($event.target.value))"
              class="slider"
            />
          </div>
        </div>
      </div>

      <button
        @click="$emit('play-next')"
        :disabled="videoIds.length <= 1"
        class="control-btn next-btn"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
    </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-info {
  margin-bottom: 20px;
  text-align: center;
  background-color: #3a3a3a;
  padding: 15px;
  border-radius: 8px;
  position: relative;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  min-height: 30px;
  position: relative;
  z-index: 10;
  width: 100%;
}

.playlist-info h3 {
  margin-top: 0;
  margin-bottom: 0;
  color: #4ecdc4;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: #4ecdc4;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 4px;
  position: relative;
  z-index: 11;
  min-width: 32px;
  min-height: 32px;
  flex-shrink: 0;
  pointer-events: auto;
  -webkit-user-select: none;
  user-select: none;
}

.toggle-btn:active {
  transform: scale(0.95);
}

.toggle-btn:hover {
  background-color: rgba(78, 205, 196, 0.1);
  transform: scale(1.1);
}

.toggle-icon {
  width: 20px;
  height: 20px;
}

.playlist-content {
  transition: opacity 0.3s ease;
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
</style>
