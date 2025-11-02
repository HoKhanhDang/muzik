<script setup>
import { ref, onMounted, computed } from 'vue'
import { playlistService } from '../../services/index.js'
import PlaylistList from './PlaylistList.vue'
import PlaylistForm from './PlaylistForm.vue'
import PlaylistDetail from './PlaylistDetail.vue'

const emit = defineEmits(['play-item', 'play-all'])

const handlePlayItem = (data) => {
  console.log('PlaylistManager received play-item event:', data)
  emit('play-item', data)
}

const handlePlayAll = (data) => {
  console.log('PlaylistManager received play-all event:', data)
  emit('play-all', data)
}

const playlists = ref([])
const loading = ref(false)
const showCreateForm = ref(false)
const selectedPlaylist = ref(null)
const viewMode = ref('list') // 'list' | 'detail' | 'create'

const filmPlaylists = computed(() => playlists.value.filter(p => p.type === 'film'))
const videoPlaylists = computed(() => playlists.value.filter(p => p.type === 'video'))

const fetchPlaylists = async () => {
  try {
    loading.value = true
    const data = await playlistService.getAll()
    console.log('Fetched playlists data:', data) // Debug log
    playlists.value = (data || []).map(p => {
      console.log('Playlist item:', p, 'items_count:', p.items_count, 'type:', typeof p.items_count) // Debug log
      return {
        ...p,
        items_count: Number(p.items_count || 0) // Ensure it's a number
      }
    })
    console.log('Processed playlists:', playlists.value) // Debug log
  } catch (error) {
    console.error('Error fetching playlists:', error)
    alert(`Error: ${error.message || 'Failed to load playlists'}`)
  } finally {
    loading.value = false
  }
}

const handleCreatePlaylist = async (playlistData) => {
  try {
    console.log('Creating playlist:', playlistData)
    loading.value = true
    await playlistService.create(playlistData)
    await fetchPlaylists()
    showCreateForm.value = false
    viewMode.value = 'list'
  } catch (error) {
    console.error('Error creating playlist:', error)
    alert(`Error: ${error.message || 'Failed to create playlist'}`)
  } finally {
    loading.value = false
  }
}

const handleDeletePlaylist = async (id) => {
  if (!confirm('Are you sure you want to delete this playlist?')) return

  try {
    loading.value = true
    await playlistService.delete(id)
    await fetchPlaylists()
    if (selectedPlaylist.value?.id === id) {
      selectedPlaylist.value = null
      viewMode.value = 'list'
    }
  } catch (error) {
    console.error('Error deleting playlist:', error)
    alert(`Error: ${error.message || 'Failed to delete playlist'}`)
  } finally {
    loading.value = false
  }
}

const handleViewPlaylist = async (playlist) => {
  if (!playlist || !playlist.id) {
    alert('Invalid playlist data')
    return
  }
  try {
    loading.value = true
    const fullPlaylist = await playlistService.getById(playlist.id)
    if (!fullPlaylist) {
      alert('Playlist not found')
      return
    }
    selectedPlaylist.value = fullPlaylist
    viewMode.value = 'detail'
  } catch (error) {
    console.error('Error fetching playlist details:', error)
    alert(`Error: ${error.message || 'Failed to load playlist'}`)
    viewMode.value = 'list'
    selectedPlaylist.value = null
  } finally {
    loading.value = false
  }
}

const handleBackToList = () => {
  viewMode.value = 'list'
  selectedPlaylist.value = null
}

const handleShowCreateForm = () => {
  showCreateForm.value = true
  viewMode.value = 'create'
}

const handleCancelCreate = () => {
  showCreateForm.value = false
  viewMode.value = 'list'
}

const handlePlaylistUpdated = async () => {
  try {
    if (selectedPlaylist.value && selectedPlaylist.value.id) {
      await handleViewPlaylist({ id: selectedPlaylist.value.id })
    } else {
      await fetchPlaylists()
    }
  } catch (error) {
    console.error('Error updating playlist view:', error)
    await fetchPlaylists()
  }
}

onMounted(() => {
  fetchPlaylists()
})
</script>

<template>
  <div class="playlist-manager">
    <div v-if="viewMode === 'list'" class="playlist-list-view">
      <div class="manager-header">
        <h2>My Playlists</h2>
        <button @click="handleShowCreateForm" class="create-btn">➕ Create Playlist</button>
      </div>

      <div v-if="loading && playlists.length === 0" class="loading">Loading playlists...</div>

      <div v-else-if="playlists.length === 0" class="empty-state">
        <p>No playlists yet. Create your first playlist!</p>
      </div>

      <div v-else class="playlists-container">
        <div v-if="filmPlaylists.length > 0" class="playlist-section">
          <h3 class="section-title">🎬 Film Playlists ({{ filmPlaylists.length }})</h3>
          <PlaylistList
            :playlists="filmPlaylists"
            @view="handleViewPlaylist"
            @delete="handleDeletePlaylist"
          />
        </div>

        <div v-if="videoPlaylists.length > 0" class="playlist-section">
          <h3 class="section-title">🎥 Video Playlists ({{ videoPlaylists.length }})</h3>
          <PlaylistList
            :playlists="videoPlaylists"
            @view="handleViewPlaylist"
            @delete="handleDeletePlaylist"
          />
        </div>
      </div>
    </div>

    <div v-else-if="viewMode === 'create'" class="playlist-create-view">
      <div class="view-header">
        <button @click="handleCancelCreate" class="back-btn">← Back</button>
        <h2>Create New Playlist</h2>
      </div>
      <PlaylistForm @submit="handleCreatePlaylist" @cancel="handleCancelCreate" />
    </div>

    <div v-else-if="viewMode === 'detail' && selectedPlaylist" class="playlist-detail-view">
      <div class="view-header">
        <button @click="handleBackToList" class="back-btn">← Back to Playlists</button>
        <h2>{{ selectedPlaylist.name }}</h2>
      </div>
      <PlaylistDetail
        :playlist="selectedPlaylist"
        @updated="handlePlaylistUpdated"
        @delete="handleDeletePlaylist"
        @play-item="handlePlayItem"
        @play-all="handlePlayAll"
      />
    </div>
  </div>
</template>

<style scoped>
.playlist-manager {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(78, 205, 196, 0.3);
}

.manager-header h2 {
  color: #4ecdc4;
  margin: 0;
  font-size: 24px;
}

.create-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.create-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(78, 205, 196, 0.4);
}

.view-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(78, 205, 196, 0.3);
}

.view-header h2 {
  color: #4ecdc4;
  margin: 0;
  font-size: 24px;
}

.back-btn {
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid rgba(78, 205, 196, 0.4);
  color: #4ecdc4;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(78, 205, 196, 0.3);
  border-color: #4ecdc4;
}

.loading,
.empty-state {
  text-align: center;
  color: #888;
  padding: 40px 20px;
}

.playlists-container {
  flex: 1;
  overflow-y: auto;
}

.playlist-section {
  margin-bottom: 30px;
}

.section-title {
  color: #4ecdc4;
  font-size: 18px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(78, 205, 196, 0.2);
}

.playlist-list-view,
.playlist-create-view,
.playlist-detail-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

