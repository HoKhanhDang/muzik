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
    default: 16,
  },
  color: {
    type: String,
    default: 'currentColor',
  },
})

const iconPath = computed(() => getSvgIconPath(props.name))
const iconSize = computed(() => typeof props.size === 'number' ? `${props.size}px` : props.size)
</script>

<template>
  <svg
    :width="iconSize"
    :height="iconSize"
    viewBox="0 0 24 24"
    :fill="color"
    xmlns="http://www.w3.org/2000/svg"
    class="svg-icon"
  >
    <path :d="iconPath" />
  </svg>
</template>

<style scoped>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>

