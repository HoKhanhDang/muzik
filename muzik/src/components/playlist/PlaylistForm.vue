<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit', 'cancel'])

const form = ref({
  name: '',
  description: '',
  type: 'video',
})

const loading = ref(false)

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    alert('Please enter a playlist name')
    return
  }

  loading.value = true
  try {
    await emit('submit', {
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      type: form.value.type,
    })
    // Reset form
    form.value = {
      name: '',
      description: '',
      type: 'video',
    }
  } catch (error) {
    console.error('Error in form submit:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  form.value = {
    name: '',
    description: '',
    type: 'video',
  }
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="playlist-form">
    <div class="form-group">
      <label for="name">Playlist Name *</label>
      <input
        id="name"
        v-model="form.name"
        type="text"
        placeholder="Enter playlist name"
        required
        :disabled="loading"
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="form.description"
        placeholder="Enter playlist description (optional)"
        rows="3"
        :disabled="loading"
        class="form-textarea"
      ></textarea>
    </div>

    <div class="form-group">
      <label for="type">Playlist Type *</label>
      <select
        id="type"
        v-model="form.type"
        required
        :disabled="loading"
        class="form-select"
      >
        <option value="film">🎬 Film</option>
        <option value="video">🎥 Video</option>
      </select>
    </div>

    <div class="form-actions">
      <button type="button" @click="handleCancel" class="cancel-btn" :disabled="loading">
        Cancel
      </button>
      <button type="submit" class="submit-btn" :disabled="loading || !form.name.trim()">
        <span v-if="loading">Creating...</span>
        <span v-else>Create Playlist</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
.playlist-form {
  background: rgba(42, 42, 42, 0.6);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #ccc;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  background-color: #1a1a1a;
  border: 1.5px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #4ecdc4;
  box-shadow: 0 0 0 4px rgba(78, 205, 196, 0.1);
  background-color: #1f1f1f;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #666;
}

.form-input:disabled,
.form-textarea:disabled,
.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-select {
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ccc;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
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
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(78, 205, 196, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}
</style>

