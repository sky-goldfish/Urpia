export const MAP_CONFIG = {
  AMAP_KEY: import.meta.env.VITE_AMAP_KEY || '',
  AMAP_SECURITY_JS_CODE: import.meta.env.VITE_AMAP_SECURITY_JS_CODE || '',
  DEFAULT_CENTER: [121.4737, 31.2304] as [number, number],
  DEFAULT_ZOOM: 14,
  DEFAULT_VIEW_MODE: '2D' as const,
}

export const assertMapConfig = () => {
  if (!MAP_CONFIG.AMAP_KEY || !MAP_CONFIG.AMAP_SECURITY_JS_CODE) {
    throw new Error('AMap config is incomplete. Please check VITE_AMAP_KEY and VITE_AMAP_SECURITY_JS_CODE.')
  }
}
