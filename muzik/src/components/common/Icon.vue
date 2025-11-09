<script setup>
import { computed } from 'vue'
import { getSvgIconPath } from '../../constants/icons.js'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [String, Number],
    default: 24,
  },
  iconClass: {
    type: String,
    default: '',
  },
})

const iconPath = computed(() => getSvgIconPath(props.name))
const iconSize = computed(() => {
  if (typeof props.size === 'number') {
    return `${props.size}px`
  }
  return props.size
})
</script>

<template>
  <svg
    v-if="iconPath"
    :class="['icon', iconClass]"
    :width="iconSize"
    :height="iconSize"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path :d="iconPath" />
  </svg>
</template>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>

