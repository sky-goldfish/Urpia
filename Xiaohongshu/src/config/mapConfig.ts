// 地图配置
// Mapbox Token 从环境变量读取
export const MAP_CONFIG = {
  // Mapbox Access Token (从 .env 文件读取)
  TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || '',

  // 地图样式
  STYLE: 'mapbox://styles/mapbox/light-v11',

  // 地图默认配置
  DEFAULT_CENTER: [121.4737, 31.2304] as [number, number], // 上海市中心 [经度, 纬度]
  DEFAULT_ZOOM: 14,
}

// 提示：请在 .env 文件中设置 VITE_MAPBOX_TOKEN
