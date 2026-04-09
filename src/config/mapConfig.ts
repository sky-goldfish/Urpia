export const MAP_CONFIG = {
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || '',
  MAPBOX_STYLE: 'mapbox://styles/mapbox/light-v11',
  DEFAULT_CENTER: [121.6017, 31.2048] as [number, number],
  DEFAULT_ZOOM: 14,
  DEFAULT_PITCH: 55,
  DEFAULT_BEARING: -12,
}

export const assertMapConfig = () => {
  if (!MAP_CONFIG.MAPBOX_TOKEN) {
    throw new Error('Mapbox config is incomplete. Please check VITE_MAPBOX_TOKEN.')
  }
}
