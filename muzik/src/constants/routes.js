/**
 * Application Routes Configuration
 * Defines routes and tabs for the application
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
    icon: 'youtube',
    path: '/youtube',
    component: 'YouTubeTab',
  },
  [ROUTES.MOVIES]: {
    id: ROUTES.MOVIES,
    label: 'Movies',
    icon: 'movies',
    path: '/movies',
    component: 'MoviesTab',
  },
  [ROUTES.PLAYLIST]: {
    id: ROUTES.PLAYLIST,
    label: 'Playlist',
    icon: 'playlist',
    path: '/playlist',
    component: 'PlaylistTab',
  },
  [ROUTES.INSTANT_PLAY]: {
    id: ROUTES.INSTANT_PLAY,
    label: 'Instant Play',
    icon: 'instant',
    path: '/instant',
    component: 'InstantPlayTab',
  },
}

export const NAVIGATION_ITEMS = [
  ROUTE_CONFIG[ROUTES.YOUTUBE],
  // ROUTE_CONFIG[ROUTES.MOVIES],
  ROUTE_CONFIG[ROUTES.PLAYLIST],
]

export const isValidRoute = (route) => {
  return Object.values(ROUTES).includes(route)
}

export const getRouteConfig = (route) => {
  return ROUTE_CONFIG[route] || ROUTE_CONFIG[DEFAULT_ROUTE]
}
