<script setup>
defineProps({
  instantPlayUrl: String,
  videoIds: Array,
  isMuted: Boolean,
  instantPlayHistory: Array,
  addingToPlaylist: String,
  isInPlaylist: Function,
})

defineEmits([
  'update:instantPlayUrl',
  'instant-play',
  'play-previous',
  'play-next',
  'toggle-mute',
  'play-from-history',
  'clear-history',
  'add-from-history',
])
</script>

<template>
  <div class="tab-content instant-play-tab">
    <h3>⚡ Instant Play</h3>
    <p class="tab-description">Play any YouTube video instantly without adding to playlist</p>

    <div class="instant-play-form">
      <div class="form-group">
        <label>YouTube URL or Video ID:</label>
        <div class="instant-input-group">
          <input
            :value="instantPlayUrl"
            @input="$emit('update:instantPlayUrl', $event.target.value)"
            @keyup.enter="$emit('instant-play')"
            placeholder="https://youtube.com/watch?v=... or Video ID"
          />
          <button @click="$emit('instant-play')" :disabled="!instantPlayUrl" class="play-btn">
            ▶️ Play Now
          </button>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h4>Quick Actions:</h4>
      <div class="quick-buttons">
        <button
          @click="$emit('play-previous')"
          :disabled="videoIds.length <= 1"
          class="quick-btn"
        >
          ⏮️ Previous
        </button>
        <button @click="$emit('play-next')" :disabled="videoIds.length <= 1" class="quick-btn">
          ⏭️ Next
        </button>
        <button @click="$emit('toggle-mute')" class="quick-btn">
          {{ isMuted ? '🔇' : '🔊' }} {{ isMuted ? 'Unmute' : 'Mute' }}
        </button>
      </div>
    </div>

    <HistorySection
      v-if="instantPlayHistory.length > 0"
      :instant-play-history="instantPlayHistory"
      :adding-to-playlist="addingToPlaylist"
      :is-in-playlist="isInPlaylist"
      @play-from-history="$emit('play-from-history', $event)"
      @clear-history="$emit('clear-history')"
      @add-from-history="$emit('add-from-history', $event)"
    />
  </div>
</template>

<script>
import HistorySection from '../history/HistorySection.vue'

export default {
  components: {
    HistorySection,
  },
}
</script>

<style scoped>
.tab-content {
  animation: fadeIn 0.3s ease-in-out;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 14px;
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

/* Tablet (768px - 1023px) */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .instant-play-tab h3 {
    font-size: 16px;
  }

  .tab-description {
    font-size: 12px;
  }

  .instant-play-form {
    padding: 10px;
  }

  .instant-input-group {
    gap: 8px;
  }

  .instant-input-group input {
    padding: 10px;
    font-size: 13px;
  }

  .play-btn {
    padding: 10px 16px;
    font-size: 13px;
  }

  .quick-actions {
    padding: 10px;
  }

  .quick-actions h4 {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .quick-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 90px;
  }
}

/* Mobile (< 768px) */
@media screen and (max-width: 767px) {
  .instant-play-tab h3 {
    font-size: 16px;
    margin-bottom: 6px;
  }

  .tab-description {
    font-size: 11px;
    margin-bottom: 12px;
  }

  .instant-play-form {
    padding: 8px;
    margin-bottom: 10px;
  }

  .form-group label {
    font-size: 12px;
    margin-bottom: 6px;
  }

  .instant-input-group {
    flex-direction: column;
    gap: 8px;
  }

  .instant-input-group input {
    padding: 10px;
    font-size: 12px;
    width: 100%;
  }

  .play-btn {
    padding: 10px;
    font-size: 12px;
    width: 100%;
  }

  .quick-actions {
    padding: 10px;
    margin-bottom: 10px;
  }

  .quick-actions h4 {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .quick-buttons {
    gap: 8px;
  }

  .quick-btn {
    padding: 8px 10px;
    font-size: 11px;
    min-width: 80px;
    flex: 1 1 calc(50% - 4px);
  }
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
</style>
