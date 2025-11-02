<script setup>
defineProps({
  newVideo: Object,
  loading: Boolean,
})

defineEmits(['update:newVideo', 'add-video', 'fetch-details', 'cancel'])
</script>

<template>
  <div class="add-form">
    <h3>Add New Video</h3>

    <div class="form-group">
      <label>YouTube URL:</label>
      <input
        :value="newVideo.youtube_url"
        @input="$emit('update:newVideo', { ...newVideo, youtube_url: $event.target.value })"
        placeholder="https://youtube.com/watch?v=..."
      />
    </div>

    <div class="form-group">
      <label>OR Video ID:</label>
      <input
        :value="newVideo.video_id"
        @input="$emit('update:newVideo', { ...newVideo, video_id: $event.target.value })"
        placeholder="XbLemOwzdxk"
      />
    </div>

    <div class="form-group">
      <label>Title:</label>
      <div class="title-input-group">
        <input
          :value="newVideo.title"
          @input="$emit('update:newVideo', { ...newVideo, title: $event.target.value })"
          placeholder="Video title (auto-filled)"
        />
        <button @click="$emit('fetch-details')" :disabled="loading" class="fetch-btn">
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
      <input
        :value="newVideo.duration"
        @input="$emit('update:newVideo', { ...newVideo, duration: $event.target.value })"
        placeholder="3:45"
      />
    </div>

    <div class="form-actions">
      <button @click="$emit('add-video')" :disabled="loading" class="save-btn">
        {{ loading ? 'Adding...' : 'Add Video' }}
      </button>
      <button @click="$emit('cancel')" class="cancel-btn">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
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
</style>
