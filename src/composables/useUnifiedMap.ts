import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import type { MapProvider } from './useMapProvider'

// 统一的地图实例类型
export type UnifiedMapInstance = any

// 统一的标记类型
export interface UnifiedMarker {
  id: string
  position: [number, number]
  element?: HTMLElement
  data?: unknown
}

// 统一的地图配置
export interface UnifiedMapConfig {
  center: [number, number]
  zoom: number
  pitch?: number
  bearing?: number
  container: string | HTMLElement
}

// 统一的地图操作接口
export interface UnifiedMapActions {
  // 基础操作
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setPitch: (pitch: number) => void
  setBearing: (bearing: number) => void
  easeTo: (options: { center?: [number, number]; zoom?: number; duration?: number }) => void
  flyTo: (options: { center?: [number, number]; zoom?: number }) => void
  
  // 标记操作
  addMarker: (marker: UnifiedMarker) => void
  removeMarker: (id: string) => void
  clearMarkers: () => void
  
  // 事件监听
  onClick: (callback: (e: { lng: number; lat: number }) => void) => void
  onZoom: (callback: () => void) => void
  onMove: (callback: () => void) => void
  
  // 获取状态
  getCenter: () => [number, number]
  getZoom: () => number
  getBounds: () => { north: number; south: number; east: number; west: number }
  project: (position: [number, number]) => { x: number; y: number }
  
  // 3D 模型支持
  add3DModel: (options: {
    id: string
    url: string
    position: [number, number]
    scale?: number
    rotation?: number
  }) => Promise<void>
  remove3DModel: (id: string) => void
}

// 统一的地图 composable
export const useUnifiedMap = () => {
  const mapInstance: ShallowRef<UnifiedMapInstance | null> = shallowRef(null)
  const mapProvider: Ref<MapProvider | null> = ref(null)
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 标记存储
  const markers = ref<Map<string, UnifiedMarker>>(new Map())
  
  // 3D 模型存储
  const models3D = ref<Map<string, any>>(new Map())

  // 初始化地图
  const initMap = async (
    provider: MapProvider,
    config: UnifiedMapConfig
  ): Promise<UnifiedMapActions> => {
    isLoading.value = true
    error.value = null
    mapProvider.value = provider

    try {
      if (provider === 'mapbox') {
        const actions = await initMapbox(config)
        mapInstance.value = actions
        isReady.value = true
        return actions
      } else {
        const actions = await initAmap(config)
        mapInstance.value = actions
        isReady.value = true
        return actions
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '地图初始化失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 初始化 Mapbox
  const initMapbox = async (config: UnifiedMapConfig): Promise<UnifiedMapActions> => {
    const mapboxgl = await import('mapbox-gl')
    const { MAP_CONFIG } = await import('../config/mapConfig')

    const map = new mapboxgl.default.Map({
      container: config.container,
      style: MAP_CONFIG.MAPBOX_STYLE,
      center: config.center,
      zoom: config.zoom,
      pitch: config.pitch || 0,
      bearing: config.bearing || 0,
      accessToken: MAP_CONFIG.MAPBOX_TOKEN,
    })

    return createMapboxActions(map)
  }

  // 初始化高德地图
  const initAmap = async (config: UnifiedMapConfig): Promise<UnifiedMapActions> => {
    const AMapLoaderModule = await import('@amap/amap-jsapi-loader')
    const AMapLoader = (AMapLoaderModule as any).default || AMapLoaderModule
    const { AMAP_CONFIG, AMAP_PLUGINS } = await import('../config/amapConfig')

    const AMap = await AMapLoader.load({
      key: AMAP_CONFIG.KEY,
      version: AMAP_CONFIG.VERSION,
      plugins: AMAP_PLUGINS,
    })

    const map = new AMap.Map(config.container, {
      center: config.center,
      zoom: config.zoom,
      pitch: config.pitch || 0,
      rotation: config.bearing || 0,
      viewMode: '3D',
      mapStyle: AMAP_CONFIG.MAP_STYLE,
    })

    return createAmapActions(map, AMap)
  }

  // 创建 Mapbox 操作集
  const createMapboxActions = (map: any): UnifiedMapActions => {
    const markerInstances = new Map<string, any>()

    return {
      setCenter: (center) => map.setCenter(center),
      setZoom: (zoom) => map.setZoom(zoom),
      setPitch: (pitch) => map.setPitch(pitch),
      setBearing: (bearing) => map.setBearing(bearing),
      easeTo: (options) => map.easeTo({
        center: options.center,
        zoom: options.zoom,
        duration: options.duration || 600,
      }),
      flyTo: (options) => map.flyTo({
        center: options.center,
        zoom: options.zoom,
        duration: 600,
      }),

      addMarker: async (marker) => {
        const el = marker.element || createDefaultMarker()
        const mapboxgl = await import('mapbox-gl')
        const instance = new mapboxgl.default.Marker(el)
          .setLngLat(marker.position)
          .addTo(map)
        markerInstances.set(marker.id, instance)
        markers.value.set(marker.id, marker)
      },

      removeMarker: (id) => {
        const instance = markerInstances.get(id)
        if (instance) {
          instance.remove()
          markerInstances.delete(id)
          markers.value.delete(id)
        }
      },

      clearMarkers: () => {
        markerInstances.forEach((instance) => instance.remove())
        markerInstances.clear()
        markers.value.clear()
      },

      onClick: (callback) => {
        map.on('click', (e: any) => {
          callback({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        })
      },

      onZoom: (callback) => {
        map.on('zoom', callback)
      },

      onMove: (callback) => {
        map.on('move', callback)
      },

      getCenter: () => {
        const center = map.getCenter()
        return [center.lng, center.lat]
      },

      getZoom: () => map.getZoom(),

      getBounds: () => {
        const bounds = map.getBounds()
        return {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        }
      },

      project: (position) => {
        const point = map.project(position)
        return { x: point.x, y: point.y }
      },

      add3DModel: async (options) => {
        // Mapbox 的 3D 模型添加逻辑
        // 需要在 CustomLayer 中实现
        console.log('Mapbox add3DModel:', options)
      },

      remove3DModel: (id) => {
        console.log('Mapbox remove3DModel:', id)
      },
    }
  }

  // 创建高德地图操作集
  const createAmapActions = (map: any, AMap: any): UnifiedMapActions => {
    const markerInstances = new Map<string, any>()

    return {
      setCenter: (center) => map.setCenter(center),
      setZoom: (zoom) => map.setZoom(zoom),
      setPitch: (pitch) => map.setPitch(pitch),
      setBearing: (bearing) => map.setRotation(bearing),
      easeTo: (options) => {
        if (options.center) map.setCenter(options.center)
        if (options.zoom) map.setZoom(options.zoom)
      },
      flyTo: (options) => {
        if (options.center) map.setCenter(options.center)
        if (options.zoom) map.setZoom(options.zoom)
      },

      addMarker: (marker) => {
        const instance = new AMap.Marker({
          position: marker.position,
          content: marker.element || createDefaultMarker().outerHTML,
        })
        map.add(instance)
        markerInstances.set(marker.id, instance)
        markers.value.set(marker.id, marker)
      },

      removeMarker: (id) => {
        const instance = markerInstances.get(id)
        if (instance) {
          map.remove(instance)
          markerInstances.delete(id)
          markers.value.delete(id)
        }
      },

      clearMarkers: () => {
        markerInstances.forEach((instance) => map.remove(instance))
        markerInstances.clear()
        markers.value.clear()
      },

      onClick: (callback) => {
        map.on('click', (e: any) => {
          callback({ lng: e.lnglat.lng, lat: e.lnglat.lat })
        })
      },

      onZoom: (callback) => {
        map.on('zoomchange', callback)
      },

      onMove: (callback) => {
        map.on('moveend', callback)
      },

      getCenter: () => {
        const center = map.getCenter()
        return [center.lng, center.lat]
      },

      getZoom: () => map.getZoom(),

      getBounds: () => {
        const bounds = map.getBounds()
        return {
          north: bounds.northEast.lat,
          south: bounds.southWest.lat,
          east: bounds.northEast.lng,
          west: bounds.southWest.lng,
        }
      },

      project: (position) => {
        // 高德地图没有直接的 project 方法，需要计算
        const center = map.getCenter()
        const zoom = map.getZoom()
        // 简化的投影计算
        return { x: 0, y: 0 }
      },

      add3DModel: async (options) => {
        // 高德地图的 3D 模型添加逻辑
        // 使用 AMap.GLCustomLayer 或 AMap.CustomLayer
        console.log('AMap add3DModel:', options)
      },

      remove3DModel: (id) => {
        console.log('AMap remove3DModel:', id)
      },
    }
  }

  // 创建默认标记元素
  const createDefaultMarker = (): HTMLElement => {
    const el = document.createElement('div')
    el.style.cssText = `
      width: 24px;
      height: 24px;
      background: #ff6b6b;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `
    return el
  }

  return {
    mapInstance,
    mapProvider,
    isReady,
    isLoading,
    error,
    markers,
    models3D,
    initMap,
  }
}
