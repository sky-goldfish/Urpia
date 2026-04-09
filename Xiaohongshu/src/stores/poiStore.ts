import { defineStore } from 'pinia'
import { ref } from 'vue'

// POI基础信息接口
export interface POIInfo {
  id: string
  name: string
  coordinates: [number, number]
  address?: string
  description?: string
  category?: string
  thumbnail?: string
}

// POI室内数据接口
export interface POIIndoorData {
  id: string
  name: string
  currentArea: string
  areas: string[]
  hotspots: Hotspot[]
  assets: AssetManifest
  navigation: NavigationData
}

// 交互热点接口
export interface Hotspot {
  id: string
  name: string
  x: number
  y: number
  z?: number
  icon?: string
  type: 'info' | 'action' | 'portal'
  data?: any
}

// 资产清单接口
export interface AssetManifest {
  textures: string[]
  models: string[]
  audio: string[]
  data: string[]
}

// 导航数据接口
export interface NavigationData {
  entryPoint: [number, number, number]
  exitPoints: [number, number, number][]
  waypoints: Waypoint[]
}

export interface Waypoint {
  id: string
  position: [number, number, number]
  connectedTo: string[]
}

export const usePOIStore = defineStore('poi', () => {
  // 状态
  const currentPOI = ref<POIInfo | null>(null)
  const indoorDataCache = ref<Map<string, POIIndoorData>>(new Map())
  const isLoading = ref(false)
  
  // 模拟POI数据库
  const poiDatabase: Record<string, POIInfo> = {
    'poi-1': {
      id: 'poi-1',
      name: '人民广场',
      coordinates: [121.4737, 31.2304],
      address: '上海市黄浦区人民广场',
      description: '上海市中心最大的公共广场',
      category: 'landmark'
    },
    'poi-2': {
      id: 'poi-2',
      name: '外滩',
      coordinates: [121.4878, 31.2356],
      address: '上海市黄浦区外滩',
      description: '上海著名的历史文化街区',
      category: 'landmark'
    },
    'poi-3': {
      id: 'poi-3',
      name: '静安寺',
      coordinates: [121.4453, 31.2165],
      address: '上海市静安区南京西路',
      description: '上海著名的佛教寺庙',
      category: 'temple'
    }
  }
  
  // 获取POI基础信息
  const getPOIInfo = (id: string): POIInfo | null => {
    return poiDatabase[id] || null
  }
  
  // 获取POI室内场景数据
  const getPOIIndoorData = async (id: string): Promise<POIIndoorData> => {
    isLoading.value = true
    
    // 检查缓存
    if (indoorDataCache.value.has(id)) {
      isLoading.value = false
      return indoorDataCache.value.get(id)!
    }
    
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const poiInfo = getPOIInfo(id)
    
    // 生成模拟室内数据
    const indoorData: POIIndoorData = {
      id,
      name: poiInfo?.name || '未知地点',
      currentArea: '主厅',
      areas: ['主厅', '侧厅', '走廊', '出口'],
      hotspots: [
        {
          id: 'hotspot-1',
          name: '信息点',
          x: 30,
          y: 40,
          type: 'info',
          icon: 'ℹ️'
        },
        {
          id: 'hotspot-2',
          name: '互动点',
          x: 60,
          y: 50,
          type: 'action',
          icon: '✋'
        },
        {
          id: 'hotspot-3',
          name: '传送点',
          x: 80,
          y: 30,
          type: 'portal',
          icon: '🚪'
        }
      ],
      assets: {
        textures: [
          'floor_diffuse.jpg',
          'wall_normal.jpg',
          'ceiling_roughness.jpg'
        ],
        models: [
          'room_main.glb',
          'furniture_set.glb'
        ],
        audio: [
          'ambient.mp3'
        ],
        data: [
          'hotspots.json',
          'navigation.json'
        ]
      },
      navigation: {
        entryPoint: [0, 0, 0],
        exitPoints: [[10, 0, 10]],
        waypoints: [
          {
            id: 'wp-1',
            position: [0, 0, 0],
            connectedTo: ['wp-2']
          },
          {
            id: 'wp-2',
            position: [5, 0, 5],
            connectedTo: ['wp-1', 'wp-3']
          },
          {
            id: 'wp-3',
            position: [10, 0, 10],
            connectedTo: ['wp-2']
          }
        ]
      }
    }
    
    // 缓存数据
    indoorDataCache.value.set(id, indoorData)
    isLoading.value = false
    
    return indoorData
  }
  
  // 设置当前POI
  const setCurrentPOI = (poi: POIInfo | null) => {
    currentPOI.value = poi
  }
  
  // 清除缓存
  const clearCache = () => {
    indoorDataCache.value.clear()
  }
  
  return {
    currentPOI,
    isLoading,
    getPOIInfo,
    getPOIIndoorData,
    setCurrentPOI,
    clearCache
  }
})
