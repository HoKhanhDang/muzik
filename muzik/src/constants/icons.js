/**
 * Icon Constants
 * Centralized icon definitions for consistency across the application
 */

/**
 * SVG Icon Paths
 * All icons are defined as SVG paths for consistency
 */
export const SVG_ICONS = {
  // Navigation tabs
  YOUTUBE: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  MOVIES: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z',
  PLAYLIST: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H5v-2h9v2zm0-4H5v-2h9v2zm0-4H5V7h9v2z',
  SEARCH: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  INSTANT_PLAY: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z',
  HISTORY: 'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
  
  // Video and Playlist icons
  VIDEOS: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 9.5l-4.5-3v6l4.5-3z',
  PLAYLISTS: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z',
  VIDEO_PLAYLISTS: 'M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z',
  FILM_PLAYLISTS: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
  COMPACT_VIEW: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  EXPAND_VIEW: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z',
  
  // Action icons
  ADD: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  DELETE: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  PLAY: 'M8 5v14l11-7z',
  MOVE_UP: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  CANCEL: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  CHECK: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
}

/**
 * Get SVG icon path by icon name
 * @param {string} iconName - icon name
 * @returns {string} SVG path string
 */
export const getSvgIconPath = (iconName) => {
  const iconMap = {
    add: SVG_ICONS.ADD,
    delete: SVG_ICONS.DELETE,
    play: SVG_ICONS.PLAY,
    move_up: SVG_ICONS.MOVE_UP,
    cancel: SVG_ICONS.CANCEL,
    check: SVG_ICONS.CHECK,
    videos: SVG_ICONS.VIDEOS,
    playlists: SVG_ICONS.PLAYLISTS,
    video_playlists: SVG_ICONS.VIDEO_PLAYLISTS,
    film_playlists: SVG_ICONS.FILM_PLAYLISTS,
    compact_view: SVG_ICONS.COMPACT_VIEW,
    expand_view: SVG_ICONS.EXPAND_VIEW,
    youtube: SVG_ICONS.YOUTUBE,
    movies: SVG_ICONS.MOVIES,
    playlist: SVG_ICONS.PLAYLIST,
    search: SVG_ICONS.SEARCH,
    instant_play: SVG_ICONS.INSTANT_PLAY,
    history: SVG_ICONS.HISTORY,
  }
  const iconKey = iconName.toUpperCase().replace(/-/g, '_')
  return iconMap[iconName] || SVG_ICONS[iconKey] || ''
}

/**
 * Get SVG icon path for playlist type
 * @param {string} type - 'film' | 'video'
 * @returns {string} SVG path string
 */
export const getPlaylistIconPath = (type) => {
  return type === 'film' ? SVG_ICONS.FILM_PLAYLISTS : SVG_ICONS.VIDEO_PLAYLISTS
}

/**
 * Get SVG icon path for view mode
 * @param {string} mode - 'videos' | 'playlists'
 * @returns {string} SVG path string
 */
export const getViewIconPath = (mode) => {
  return mode === 'videos' ? SVG_ICONS.VIDEOS : SVG_ICONS.PLAYLISTS
}

/**
 * Get SVG icon path for compact mode
 * @param {boolean} isCompact
 * @returns {string} SVG path string
 */
export const getCompactModeIconPath = (isCompact) => {
  return isCompact ? SVG_ICONS.EXPAND_VIEW : SVG_ICONS.COMPACT_VIEW
}

// Legacy emoji icons (deprecated - use SVG instead)
export const ICONS = {
  VIDEOS: SVG_ICONS.VIDEOS,
  PLAYLISTS: SVG_ICONS.PLAYLISTS,
  VIDEO_PLAYLISTS: SVG_ICONS.VIDEO_PLAYLISTS,
  FILM_PLAYLISTS: SVG_ICONS.FILM_PLAYLISTS,
  COMPACT_VIEW: SVG_ICONS.COMPACT_VIEW,
  EXPAND_VIEW: SVG_ICONS.EXPAND_VIEW,
}

/**
 * Get icon for playlist type (legacy - returns SVG path)
 * @param {string} type - 'film' | 'video'
 * @returns {string} SVG path string
 */
export const getPlaylistIcon = (type) => {
  return getPlaylistIconPath(type)
}

/**
 * Get icon for view mode (legacy - returns SVG path)
 * @param {string} mode - 'videos' | 'playlists'
 * @returns {string} SVG path string
 */
export const getViewIcon = (mode) => {
  return getViewIconPath(mode)
}

/**
 * Get icon for compact mode (legacy - returns SVG path)
 * @param {boolean} isCompact
 * @returns {string} SVG path string
 */
export const getCompactModeIcon = (isCompact) => {
  return getCompactModeIconPath(isCompact)
}
