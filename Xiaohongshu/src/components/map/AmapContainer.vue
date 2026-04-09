<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { AMAP_CONFIG } from '../../config/mapConfig'

interface Props {
  center?: [number, number] // [经度, 纬度]
  zoom?: number
  viewMode?: '2D' | '3D'
  markers?: Array<{
    id: string
    position: [number, number]
    title?: string
    icon?: string
    data?: any
  }>
  showCurrentLocation?: boolean
}

interface Emits {
  (e: 'markerClick', marker: any): void
  (e: 'mapClick', position: { lng: number; lat: number }): void
  (e: 'ready', map: any): void
}

const props = withDefaults(defineProps<Props>(), {
  center: () => AMAP_CONFIG.DEFAULT_CENTER as [number, number],
  zoom: AMAP_CONFIG.DEFAULT_ZOOM,
  viewMode: '2D',
  markers: () => [],
  showCurrentLocation: true,
})

const emit = defineEmits<Emits>()

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<any>(null)
const mapMarkers = ref<any[]>([])
const isReady = ref(false)

// 初始化高德地图
const initMap = () => {
  if (!mapContainer.value || !window.AMap) return

  // 创建地图实例
  const mapInstance = new window.AMap.Map(mapContainer.value, {
    center: props.center,
    zoom: props.zoom,
    viewMode: props.viewMode,
    resizeEnable: true,
    keyboardEnable: true,
    dragEnable: true,
    scrollWheel: true,
    doubleClickZoom: true,
  })

  map.value = mapInstance

  // 添加地图控件
  mapInstance.addControl(new window.AMap.Scale())
  mapInstance.addControl(new window.AMap.ToolBar({
    position: 'RB',
    offset: [10, 80],
  }))

  // 定位控件
  if (props.showCurrentLocation) {
    mapInstance.addControl(new window.AMap.Geolocation({
      position: 'RB',
      offset: [10, 40],
      showButton: true,
      buttonPosition: 'RB',
      buttonOffset: [10, 10],
      showMarker: true,
      showCircle: true,
      panToLocation: true,
      zoomToAccuracy: true,
    }))
  }

  // 地图点击事件
  mapInstance.on('click', (e: any) => {
    emit('mapClick', { lng: e.lnglat.lng, lat: e.lnglat.lat })
  })

  isReady.value = true
  emit('ready', mapInstance)

  // 初始化标记点
  updateMarkers()
}

// 更新标记点
const updateMarkers = () => {
  if (!map.value) return

  // 清除现有标记
  mapMarkers.value.forEach(marker => marker.setMap(null))
  mapMarkers.value = []

  // 添加新标记
  props.markers.forEach((markerData) => {
    const marker = new window.AMap.Marker({
      position: markerData.position,
      title: markerData.title,
      map: map.value,
      extData: markerData.data,
    })

    // 点击事件
    marker.on('click', () => {
      emit('markerClick', markerData)
    })

    mapMarkers.value.push(marker)
  })
}

// 监听标记点变化
watch(() => props.markers, updateMarkers, { deep: true })

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    map.value.setCenter(newCenter)
  }
}, { deep: true })

// 监听缩放级别变化
watch(() => props.zoom, (newZoom) => {
  if (map.value && newZoom) {
    map.value.setZoom(newZoom)
  }
})

// 加载高德地图脚本
const loadAMapScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (window.AMap) {
      resolve()
      return
    }

    // 检查是否正在加载
    if (document.querySelector('script[data-amap]')) {
      const checkInterval = setInterval(() => {
        if (window.AMap) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
      return
    }

    // 创建脚本
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.defer = true
    script.setAttribute('data-amap', 'true')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_CONFIG.KEY}&plugin=AMap.Scale,AMap.ToolBar,AMap.Geolocation`

    script.onerror = () => reject(new Error('高德地图脚本加载失败'))
    script.onload = () => {
      // 等待 AMap 全局对象可用
      const checkInterval = setInterval(() => {
        if (window.AMap) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    }

    document.head.appendChild(script)
  })
}

onMounted(async () => {
  try {
    await loadAMapScript()
    initMap()
  } catch (error) {
    console.error('高德地图初始化失败:', error)
  }
})

onUnmounted(() => {
  // 清理标记
  mapMarkers.value.forEach(marker => marker.setMap(null))
  mapMarkers.value = []

  // 销毁地图
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
})

// 暴露方法给父组件
defineExpose({
  getMap: () => map.value,
  setCenter: (center: [number, number]) => map.value?.setCenter(center),
  setZoom: (zoom: number) => map.value?.setZoom(zoom),
  addMarker: (position: [number, number], options?: any) => {
    if (!map.value) return null
    const marker = new window.AMap.Marker({
      position,
      map: map.value,
      ...options,
    })
    mapMarkers.value.push(marker)
    return marker
  },
  clearMarkers: () => {
    mapMarkers.value.forEach(marker => marker.setMap(null))
    mapMarkers.value = []
  },
})
</script>

<template>
  <div ref="mapContainer" class="amap-container">
    <div v-if="!isReady" class="amap-loading">
      <div class="loading-spinner"></div>
      <span>地图加载中...</span>
    </div>
  </div>
</template>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.amap-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #666;
  font-size: 14px;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #1D1D1F;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
