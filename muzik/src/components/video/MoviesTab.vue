<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const movies = ref([])
const searchQuery = ref('')
const selectedMovie = ref(null)

const filteredMovies = computed(() => {
  if (!searchQuery.value) return movies.value
  return movies.value.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const handleSearch = () => {
  // TODO: Implement movie search functionality
  console.log('Searching for:', searchQuery.value)
}

const handleSelectMovie = (movie) => {
  selectedMovie.value = movie
  // TODO: Implement movie playback
  console.log('Selected movie:', movie)
}

defineExpose({
  movies,
  searchQuery,
  selectedMovie,
})
</script>

<template>
  <div class="movies-tab">
    <div class="movies-header">
      <h2 class="tab-title">🎥 Xem Phim</h2>
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm phim..."
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="search-btn">🔍</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Đang tải...</div>

    <div v-else-if="filteredMovies.length === 0" class="empty-state">
      <p>Chưa có phim nào. Hãy thêm phim mới!</p>
    </div>

    <div v-else class="movies-grid">
      <div
        v-for="movie in filteredMovies"
        :key="movie.id"
        class="movie-card"
        @click="handleSelectMovie(movie)"
      >
        <div class="movie-thumbnail">
          <img
            :src="movie.thumbnail_url || '/placeholder-movie.jpg'"
            :alt="movie.title"
            class="thumbnail-img"
          />
        </div>
        <div class="movie-info">
          <h3 class="movie-title">{{ movie.title }}</h3>
          <p v-if="movie.duration" class="movie-duration">{{ movie.duration }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.movies-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
}

.movies-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tab-title {
  color: #4ecdc4;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.search-container {
  display: flex;
  gap: 10px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  background-color: #3a3a3a;
  border: 1px solid #4a4a4a;
  border-radius: 8px;
  color: white;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #4ecdc4;
}

.search-btn {
  padding: 10px 20px;
  background: linear-gradient(145deg, #4ecdc4, #45b7aa);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #ccc;
  text-align: center;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  overflow-y: auto;
  flex: 1;
}

.movie-card {
  background-color: #3a3a3a;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.movie-thumbnail {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: #2a2a2a;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.movie-info {
  padding: 10px;
}

.movie-title {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 5px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movie-duration {
  color: #ccc;
  font-size: 12px;
  margin: 0;
}

@media (max-width: 768px) {
  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
