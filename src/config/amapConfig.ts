// 高德地图配置
export const AMAP_CONFIG = {
  // 高德地图 JS API Key
  KEY: import.meta.env.VITE_AMAP_KEY || '',
  // 安全密钥（JSAPI Loader 2.0 需要）
  SECURITY_CONFIG: import.meta.env.VITE_AMAP_SECURITY_JS_CODE || '',
  // 高德地图版本
  VERSION: '2.0',
  // 默认配置
  DEFAULT_CENTER: [121.6017, 31.2048] as [number, number],
  DEFAULT_ZOOM: 14,
  DEFAULT_PITCH: 55,
  DEFAULT_ROTATION: -12,
  // 地图样式
  MAP_STYLE: 'amap://styles/whitemap', // 支持 3D 的样式
}

// 验证高德地图配置
export const assertAmapConfig = () => {
  if (!AMAP_CONFIG.KEY) {
    throw new Error('高德地图配置不完整。请检查 VITE_AMAP_KEY 环境变量。')
  }
}

// 高德地图插件列表
export const AMAP_PLUGINS = [
  'AMap.ControlBar',      // 控制条
  'AMap.Scale',           // 比例尺
  'AMap.ToolBar',         // 工具条
  'AMap.Geolocation',     // 定位
]
