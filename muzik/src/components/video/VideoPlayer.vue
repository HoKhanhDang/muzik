<script setup>
defineProps({
  loading: Boolean,
  videoIds: Array,
  showSidebar: Boolean,
})
</script>

<template>
  <div id="video-container" :class="{ 'full-width': !showSidebar }">
    <div v-if="loading && videoIds.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your playlist...</p>
    </div>
    <div v-else-if="videoIds.length > 0" id="player"></div>
    <div v-else class="no-videos">
      <h2>No Videos Found</h2>
      <p>Add some videos to start playing!</p>
    </div>
  </div>
</template>

<style scoped>
#video-container {
  width: 70%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  flex: 1;
  min-width: 0;
}

#video-container.full-width {
  width: 100%;
}

/* Large Desktop (>= 1440px) */
@media screen and (min-width: 1440px) {
  #video-container {
    width: 72%;
  }

  #video-container.full-width {
    width: 100%;
  }
}

/* Tablet (768px - 1023px) */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  #video-container {
    width: 65%;
  }

  #video-container.full-width {
    width: 100%;
  }
}

/* Mobile (< 768px) */
@media screen and (max-width: 767px) {
  #video-container {
    width: 100%;
    height: 60vh;
    min-height: 300px;
  }

  #video-container.full-width {
    width: 100%;
  }
}

#player {
  width: 100%;
  height: 100%;
}

.no-videos {
  text-align: center;
  color: #666;
}

.no-videos h2 {
  margin-bottom: 10px;
  color: #888;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-size: 18px;
  padding: 40px;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #4ecdc4;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
