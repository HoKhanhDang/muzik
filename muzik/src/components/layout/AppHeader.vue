<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { NAVIGATION_ITEMS, ROUTES } from '../../constants/routes.js'
import { getSvgIconPath } from '../../constants/icons.js'

const props = defineProps({
  showSidebar: Boolean,
  activeTab: String,
  audioOnlyMode: Boolean,
})

const emit = defineEmits(['toggle-sidebar', 'change-tab', 'profile', 'signout', 'toggle-audio-mode'])

const isPlaylistTab = computed(() => props.activeTab === ROUTES.PLAYLIST)

const showProfileMenu = ref(false)

const handleToggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const handleClickOutside = (event) => {
  const profileMenu = event.target.closest('.profile-menu-container')
  if (!profileMenu && showProfileMenu.value) {
    showProfileMenu.value = false
  }
}

const handleProfile = () => {
  showProfileMenu.value = false
  emit('profile')
}

const handleSignOut = () => {
  showProfileMenu.value = false
  emit('signout')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="app-header">
    <div class="app-header-logo">
      <button @click="$emit('toggle-sidebar')" class="sidebar-toggle-btn">
        <span class="burger-icon">☰</span>
      </button>
      <div class="app-header-title">MUZIK</div>
    </div>

    <div v-show="showSidebar" class="tab-navigation">
      <button
        v-for="item in NAVIGATION_ITEMS"
        :key="item.id"
        @click="$emit('change-tab', item.id)"
        :class="{ active: activeTab === item.id }"
        class="tab-btn"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
          <path :d="getSvgIconPath(item.icon)" />
        </svg>
        <span>{{ item.label }}</span>
      </button>
    </div>

    <div class="header-actions">
      <button
        @click="$emit('toggle-audio-mode')"
        class="audio-mode-btn"
        :class="{ active: audioOnlyMode, disabled: !isPlaylistTab }"
        :disabled="!isPlaylistTab"
        :title="!isPlaylistTab ? 'Only available in Playlist tab' : (audioOnlyMode ? 'Switch to Video Mode' : 'Switch to Audio Only Mode')"
      >
        <svg v-if="!audioOnlyMode" class="audio-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
        </svg>
        <svg v-else class="audio-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
        <span class="audio-label">{{ audioOnlyMode ? 'Video Mode' : 'Audio Mode' }}</span>
      </button>

      <div class="profile-menu-container">
        <button @click.stop="handleToggleProfileMenu" class="profile-toggle-btn">
          <svg class="profile-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <svg v-if="showProfileMenu" class="chevron-icon" viewBox="0 0 24 24" fill="#4ecdc4">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
          <svg v-else class="chevron-icon" viewBox="0 0 24 24" fill="#4ecdc4">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
          </svg>
        </button>

        <div v-show="showProfileMenu" class="profile-dropdown">
          <button @click="handleProfile" class="profile-menu-item">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span>Profile</span>
          </button>
          <div class="profile-menu-divider"></div>
          <button @click="handleSignOut" class="profile-menu-item signout">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  padding: 8px 16px;
  border-bottom: 2px solid #4ecdc4;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.app-header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: 0;
}

.app-header-title {
  color: #4ecdc4;
  font-size: 22px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
  display: flex;
  align-items: center;
}

.sidebar-toggle-btn {
  background: none;
  border: none;
  color: #ccc;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  line-height: 1;
  padding: 0;
}

/* Large Desktop (>= 1440px) */
@media screen and (min-width: 1440px) {
  .app-header {
    padding: 10px 20px;
    gap: 16px;
    height: 70px;
  }

  .app-header-title {
    font-size: 26px;
  }

  .sidebar-toggle-btn {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }

  .tab-navigation {
    max-width: 750px;
  }

  .tab-btn {
    padding: 8px 14px;
    font-size: 13px;
    gap: 5px;
  }

  .audio-mode-btn {
    height: 44px;
    padding: 0 14px;
    gap: 8px;
    font-size: 13px;
  }

  .audio-icon {
    width: 20px;
    height: 20px;
  }

  .profile-toggle-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  .profile-icon {
    width: 18px;
    height: 18px;
  }

  .chevron-icon {
    width: 16px;
    height: 16px;
  }
}

/* Desktop (1024px - 1439px) */
@media screen and (min-width: 1024px) and (max-width: 1439px) {
  .app-header {
    padding: 8px 16px;
    gap: 12px;
    height: 60px;
  }

  .app-header-title {
    font-size: 22px;
  }

  .sidebar-toggle-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .tab-navigation {
    max-width: 650px;
    padding: 3px;
  }

  .tab-btn {
    padding: 7px 12px;
    font-size: 12px;
    gap: 4px;
  }

  .audio-mode-btn {
    height: 40px;
    padding: 0 12px;
    gap: 7px;
    font-size: 12px;
  }

  .audio-icon {
    width: 18px;
    height: 18px;
  }

  .profile-toggle-btn {
    padding: 7px 12px;
    font-size: 12px;
  }

  .profile-icon {
    width: 16px;
    height: 16px;
  }

  .chevron-icon {
    width: 14px;
    height: 14px;
  }
}

/* Tablet (768px - 1023px) */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .app-header {
    height: 55px;
    padding: 8px 12px;
    gap: 10px;
  }

  .app-header-logo {
    gap: 8px;
  }

  .app-header-title {
    font-size: 20px;
  }

  .sidebar-toggle-btn {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }

  .tab-navigation {
    max-width: 420px;
    padding: 2px;
    gap: 1px;
  }

  .tab-btn {
    padding: 6px 8px;
    font-size: 11px;
    gap: 3px;
    min-width: auto;
  }

  .tab-btn span:last-child {
    display: none;
  }

  .header-actions {
    gap: 8px;
  }

  .audio-mode-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    gap: 0;
  }

  .audio-label {
    display: none;
  }

  .audio-icon {
    width: 18px;
    height: 18px;
  }

  .profile-toggle-btn {
    padding: 6px 8px;
    font-size: 11px;
    gap: 5px;
  }

  .profile-icon {
    width: 16px;
    height: 16px;
  }

  .chevron-icon {
    width: 12px;
    height: 12px;
  }
}

/* Mobile (< 768px) */
@media screen and (max-width: 767px) {
  .app-header {
    height: 50px;
    padding: 6px 8px;
    gap: 6px;
  }

  .app-header-logo {
    gap: 6px;
  }

  .app-header-title {
    font-size: 18px;
  }

  .sidebar-toggle-btn {
    width: 34px;
    height: 34px;
    font-size: 16px;
  }

  .tab-navigation {
    max-width: none;
    padding: 2px;
    gap: 1px;
    overflow-x: auto;
    flex: 1 1 auto;
  }

  .tab-btn {
    padding: 5px 7px;
    font-size: 10px;
    min-width: 60px;
    gap: 2px;
  }

  .tab-btn span:last-child {
    display: none;
  }

  .tab-icon {
    width: 18px;
    height: 18px;
  }

  .header-actions {
    gap: 6px;
  }

  .audio-mode-btn {
    width: 34px;
    height: 34px;
    padding: 0;
    gap: 0;
  }

  .audio-label {
    display: none;
  }

  .audio-icon {
    width: 16px;
    height: 16px;
  }

  .profile-toggle-btn {
    padding: 5px 7px;
    font-size: 10px;
    gap: 3px;
  }

  .profile-icon {
    width: 14px;
    height: 14px;
  }

  .chevron-icon {
    width: 10px;
    height: 10px;
  }
}

.sidebar-toggle-btn .burger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  line-height: 1;
  margin: 0;
  padding: 0;
}

.sidebar-toggle-btn:hover {
  background: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
  transform: translateY(-2px);
}

.sidebar-toggle-btn:hover .burger-icon {
  transform: scale(1.2) rotate(90deg);
}

.sidebar-toggle-btn:active {
  transform: translateY(0);
}

.tab-navigation {
  display: flex;
  background-color: #3a3a3a;
  border-radius: 8px;
  padding: 3px;
  flex-shrink: 1;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 600px;
  transition: all 0.3s ease;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 2px;
  scrollbar-width: thin;
  scrollbar-color: #4a4a4a #3a3a3a;
}

.tab-navigation::-webkit-scrollbar {
  height: 4px;
}

.tab-navigation::-webkit-scrollbar-track {
  background: #3a3a3a;
  border-radius: 4px;
}

.tab-navigation::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.tab-navigation::-webkit-scrollbar-thumb:hover {
  background: #6a6a6a;
}

.tab-btn {
  flex: 1;
  min-width: fit-content;
  white-space: nowrap;
  background: none;
  border: none;
  color: #ccc;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tab-btn:hover {
  background-color: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
}

.tab-btn.active {
  background: linear-gradient(145deg, #4ecdc4, #45b7aa);
  color: white;
  box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
}

.tab-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.tab-btn:hover .tab-icon {
  transform: scale(1.1);
}

.tab-btn.active .tab-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.audio-mode-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  background-size: 200% 200%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 16px rgba(102, 126, 234, 0.4),
    0 0 0 0 rgba(102, 126, 234, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;
}

.audio-mode-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.audio-mode-btn:hover::before {
  left: 100%;
}

.audio-mode-btn:hover {
  background-position: 100% 0;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 8px 24px rgba(102, 126, 234, 0.5),
    0 0 20px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.audio-mode-btn:active {
  transform: translateY(-1px) scale(0.98);
  box-shadow: 
    0 4px 12px rgba(102, 126, 234, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.audio-mode-btn.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #f093fb 100%);
  background-size: 200% 200%;
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 4px 16px rgba(240, 147, 251, 0.5),
    0 0 0 0 rgba(240, 147, 251, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 
      0 4px 16px rgba(240, 147, 251, 0.5),
      0 0 0 0 rgba(240, 147, 251, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow: 
      0 4px 16px rgba(240, 147, 251, 0.6),
      0 0 20px rgba(240, 147, 251, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}

.audio-mode-btn.active:hover {
  background-position: 100% 0;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 8px 24px rgba(240, 147, 251, 0.6),
    0 0 25px rgba(240, 147, 251, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  animation: none;
}

.audio-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.audio-label {
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.audio-mode-btn:hover .audio-icon {
  transform: scale(1.15) rotate(5deg);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.audio-mode-btn.active .audio-icon {
  animation: icon-pulse 2s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.audio-mode-btn:disabled,
.audio-mode-btn.disabled {
  background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
  transform: none !important;
}

.audio-mode-btn:disabled:hover,
.audio-mode-btn.disabled:hover {
  background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
  transform: none !important;
  box-shadow: none;
}

.audio-mode-btn:disabled .audio-icon,
.audio-mode-btn.disabled .audio-icon {
  transform: none !important;
}

.profile-menu-container {
  position: relative;
  flex-shrink: 0;
}

.profile-toggle-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  border: none;
  color: white;
  padding: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  position: relative;
  flex-shrink: 0;
}

.profile-toggle-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #4ecdc4 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(78, 205, 196, 0.4);
}

.profile-toggle-btn:active {
  transform: translateY(0);
}

.profile-icon {
  width: 20px;
  height: 20px;
}

.chevron-icon {
  width: 12px;
  height: 12px;
  transition: transform 0.3s ease;
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: white;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  min-width: 180px;
  overflow: hidden;
  z-index: 1001;
  border: 1px solid rgba(78, 205, 196, 0.2);
  animation: fadeInDown 0.3s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-menu-item {
  width: 100%;
  background: none;
  border: none;
  color: #ccc;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  font-size: 14px;
  text-align: left;
}

.profile-menu-item:hover {
  background-color: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
}

.profile-menu-item.signout {
  color: #ff6b6b;
}

.profile-menu-item.signout:hover {
  background-color: rgba(255, 107, 107, 0.1);
  color: #ff5252;
}

.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.profile-menu-divider {
  height: 1px;
  background: rgba(78, 205, 196, 0.2);
  margin: 4px 0;
}
</style>
