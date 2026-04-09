import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStoreById, type IndoorFixedCamera, type StoreCatalogItem } from '../config/storeCatalog'

// POI基础信息接口
export interface POIInfo {
  id: string
  name: string
  coordinates: [number, number]
  address?: string
  description?: string
  category?: string
  thumbnail?: string
  tier?: string
  canEnter?: boolean
  signboardModelUrl?: string
  exteriorModelUrl?: string
  interiorModelUrl?: string
  fixedIndoorCamera?: IndoorFixedCamera
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
  canEnter: boolean
  primaryModelUrl?: string
  fixedCamera?: IndoorFixedCamera
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
  
  const toPOIInfo = (store: StoreCatalogItem): POIInfo => ({
    id: store.id,
    name: store.name,
    coordinates: store.coordinates,
    address: store.address,
    description: store.tier === 'premium' ? '可进入的高等级店家空间' : '地图中的普通店家外饰点位',
    category: store.tier,
    tier: store.tier,
    canEnter: store.canEnter,
    signboardModelUrl: store.signboardModelUrl,
    exteriorModelUrl: store.exteriorModelUrl,
    interiorModelUrl: store.interiorModelUrl,
    fixedIndoorCamera: store.fixedIndoorCamera,
  })

  // 获取POI基础信息
  const getPOIInfo = (id: string): POIInfo | null => {
    const store = getStoreById(id)
    return store ? toPOIInfo(store) : null
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
    const primaryModelUrl = poiInfo?.interiorModelUrl || poiInfo?.exteriorModelUrl || poiInfo?.signboardModelUrl
    
    const indoorData: POIIndoorData = {
      id,
      name: poiInfo?.name || '未知地点',
      currentArea: poiInfo?.canEnter ? '店内空间' : '门店外饰',
      areas: poiInfo?.canEnter ? ['店内空间'] : ['门店外饰'],
      hotspots: [],
      assets: {
        textures: [],
        models: primaryModelUrl ? [primaryModelUrl] : [],
        audio: [],
        data: [],
      },
      navigation: {
        entryPoint: [0, 0, 0],
        exitPoints: [[0, 0, 0]],
        waypoints: [],
      },
      canEnter: Boolean(poiInfo?.canEnter && poiInfo?.interiorModelUrl),
      primaryModelUrl,
      fixedCamera: poiInfo?.fixedIndoorCamera,
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
