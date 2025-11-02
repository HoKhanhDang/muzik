/**
 * Application Routes Configuration
 * Định nghĩa các routes và tabs cho ứng dụng
 */

export const ROUTES = {
  YOUTUBE: 'youtube',
  MOVIES: 'movies',
  PLAYLIST: 'playlist',
  INSTANT_PLAY: 'instant',
}

export const DEFAULT_ROUTE = ROUTES.PLAYLIST

export const ROUTE_CONFIG = {
  [ROUTES.YOUTUBE]: {
    id: ROUTES.YOUTUBE,
    label: 'YouTube',
    icon: '🎬',
    path: '/youtube',
    component: 'InstantPlayTab',
  },
  [ROUTES.MOVIES]: {
    id: ROUTES.MOVIES,
    label: 'Xem Phim',
    icon: '🎥',
    path: '/movies',
    component: 'MoviesTab',
  },
  [ROUTES.PLAYLIST]: {
    id: ROUTES.PLAYLIST,
    label: 'Playlist',
    icon: '📋',
    path: '/playlist',
    component: 'PlaylistTab',
  },
  [ROUTES.INSTANT_PLAY]: {
    id: ROUTES.INSTANT_PLAY,
    label: 'Instant Play',
    icon: '⚡',
    path: '/instant',
    component: 'InstantPlayTab',
  },
}

export const NAVIGATION_ITEMS = [
  ROUTE_CONFIG[ROUTES.YOUTUBE],
  ROUTE_CONFIG[ROUTES.MOVIES],
  ROUTE_CONFIG[ROUTES.PLAYLIST],
]

export const isValidRoute = (route) => {
  return Object.values(ROUTES).includes(route)
}

export const getRouteConfig = (route) => {
  return ROUTE_CONFIG[route] || ROUTE_CONFIG[DEFAULT_ROUTE]
}
