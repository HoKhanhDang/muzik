<template>
  <ul class="skeleton-list">
    <li v-for="i in count" :key="i" class="skeleton-item">
      <div class="skeleton-thumbnail shimmer"></div>
      <div class="skeleton-info">
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-subtitle shimmer"></div>
      </div>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 5,
  },
})
</script>

<style scoped>
.skeleton-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 30px;
  background: #3a3a3a;
  border-radius: 5px;
  min-height: 60px;
}

.skeleton-thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 40px;
  border-radius: 6px;
  background: #2a2a2a;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.skeleton-title {
  height: 14px;
  width: 70%;
  border-radius: 4px;
  background: #2a2a2a;
}

.skeleton-subtitle {
  height: 10px;
  width: 40%;
  border-radius: 4px;
  background: #2a2a2a;
}

/* Shimmer animation */
.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Mobile */
@media (max-width: 767px) {
  .skeleton-item {
    padding: 8px 8px 8px 26px;
    min-height: 56px;
    gap: 8px;
  }

  .skeleton-thumbnail {
    width: 60px;
    height: 45px;
  }
}
</style>
