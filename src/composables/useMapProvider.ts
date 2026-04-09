import { ref, computed, type Ref } from 'vue'

export type MapProvider = 'mapbox' | 'amap'

// 简化的中国边界判断（矩形范围）
// 中国大致范围：经度 73-135，纬度 3-54
const isInChinaRough = (lng: number, lat: number): boolean => {
  return lng >= 73 && lng <= 135 && lat >= 3 && lat <= 54
}

// 更精确的坐标判断（排除一些海外领土和边境地区）
const isInChinaPrecise = (lng: number, lat: number): boolean => {
  // 中国大陆主要区域
  const inMainland = lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54
  
  // 台湾地区
  const inTaiwan = lng >= 119 && lng <= 122 && lat >= 21 && lat <= 26
  
  // 南海诸岛（简化判断）
  const inSouthSea = lng >= 109 && lng <= 118 && lat >= 3 && lat <= 21
  
  return inMainland || inTaiwan || inSouthSea
}

// 根据坐标判断地图提供商
export const detectMapProvider = (lng: number, lat: number): MapProvider => {
  return isInChinaPrecise(lng, lat) ? 'amap' : 'mapbox'
}

// 根据 IP 地址判断是否在中国
const detectByIpAddress = async (): Promise<void> => {
  try {
    // 使用免费的 IP 地理位置 API
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) throw new Error('IP 检测失败')
    
    const data = await response.json()
    const countryCode = data.country_code
    
    // 如果 IP 地址不在中国，切换到 Mapbox
    if (countryCode !== 'CN') {
      currentProvider.value = 'mapbox'
    }
  } catch (error) {
    console.warn('[useMapProvider] IP 地址检测失败:', error)
    throw error
  }
}

// 获取当前位置的地图提供商
export const useMapProvider = () => {
  // 默认使用高德地图，检测到境外时自动切换到 Mapbox
  const currentProvider: Ref<MapProvider> = ref('amap')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 根据 GPS 坐标检测
  const detectByCoordinates = (lng: number, lat: number) => {
    currentProvider.value = detectMapProvider(lng, lat)
    return currentProvider.value
  }

  // 使用浏览器 Geolocation API 自动检测
  const detectByGeolocation = (): Promise<MapProvider> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        error.value = '浏览器不支持地理定位'
        reject(new Error('浏览器不支持地理定位'))
        return
      }

      isLoading.value = true
      error.value = null

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords
          const provider = detectByCoordinates(longitude, latitude)
          isLoading.value = false
          resolve(provider)
        },
        (err) => {
          isLoading.value = false
          error.value = `获取位置失败: ${err.message}`
          // GPS 失败时尝试 IP 地址检测
          detectByIpAddress().then(() => {
            resolve(currentProvider.value)
          }).catch(() => {
            // 如果 IP 检测也失败，默认使用高德地图
            currentProvider.value = 'amap'
            resolve(currentProvider.value)
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )
    })
  }

  // 手动设置提供商
  const setProvider = (provider: MapProvider) => {
    currentProvider.value = provider
  }

  // 切换提供商
  const toggleProvider = () => {
    currentProvider.value = currentProvider.value === 'mapbox' ? 'amap' : 'mapbox'
  }

  // 计算属性
  const isMapbox = computed(() => currentProvider.value === 'mapbox')
  const isAmap = computed(() => currentProvider.value === 'amap')

  return {
    currentProvider,
    isLoading,
    error,
    isMapbox,
    isAmap,
    detectByCoordinates,
    detectByGeolocation,
    setProvider,
    toggleProvider,
  }
}

// 坐标系转换工具
export const coordinateUtils = {
  // WGS84 转 GCJ-02（火星坐标系）- 简化的转换算法
  wgs84ToGcj02: (lng: number, lat: number): [number, number] => {
    // 如果在中国境外，直接返回原坐标
    if (!isInChinaRough(lng, lat)) {
      return [lng, lat]
    }
    
    // 简化的偏移算法（实际项目中可以使用更精确的库）
    const pi = 3.14159265358979324
    const a = 6378245.0
    const ee = 0.00669342162296594323
    
    let dLat = transformLat(lng - 105.0, lat - 35.0)
    let dLng = transformLng(lng - 105.0, lat - 35.0)
    
    const radLat = lat / 180.0 * pi
    let magic = Math.sin(radLat)
    magic = 1 - ee * magic * magic
    const sqrtMagic = Math.sqrt(magic)
    
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)
    
    const gcjLat = lat + dLat
    const gcjLng = lng + dLng
    
    return [gcjLng, gcjLat]
  },

  // GCJ-02 转 WGS84
  gcj02ToWgs84: (lng: number, lat: number): [number, number] => {
    // 如果在中国境外，直接返回原坐标
    if (!isInChinaRough(lng, lat)) {
      return [lng, lat]
    }
    
    const [gcjLng, gcjLat] = coordinateUtils.wgs84ToGcj02(lng, lat)
    const wgsLng = lng * 2 - gcjLng
    const wgsLat = lat * 2 - gcjLat
    
    return [wgsLng, wgsLat]
  },
}

// 辅助函数
function transformLat(lng: number, lat: number): number {
  const pi = 3.14159265358979324
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * pi) + 20.0 * Math.sin(2.0 * lng * pi)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * pi) + 40.0 * Math.sin(lat / 3.0 * pi)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * pi) + 320 * Math.sin(lat * pi / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLng(lng: number, lat: number): number {
  const pi = 3.14159265358979324
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * pi) + 20.0 * Math.sin(2.0 * lng * pi)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * pi) + 40.0 * Math.sin(lng / 3.0 * pi)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * pi) + 300.0 * Math.sin(lng / 30.0 * pi)) * 2.0 / 3.0
  return ret
}
