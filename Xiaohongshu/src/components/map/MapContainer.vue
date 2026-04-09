<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAP_CONFIG } from '../../config/mapConfig'

// 设置 Mapbox Token（必须在创建地图前设置）
mapboxgl.accessToken = MAP_CONFIG.TOKEN

// 禁用 Web Worker，在主线程运行，绕开 CSP eval 限制
;(mapboxgl as any).workerUrl = ''

interface Props {
  center?: [number, number] // [经度, 纬度]
  zoom?: number
  markers?: Array<{
    id: string
    position: [number, number]
    title?: string
    color?: string
    data?: any
  }>
}

interface Emits {
  (e: 'markerClick', marker: any): void
  (e: 'mapClick', position: { lng: number; lat: number }): void
  (e: 'ready', map: any): void
}

const props = withDefaults(defineProps<Props>(), {
  center: () => MAP_CONFIG.DEFAULT_CENTER,
  zoom: MAP_CONFIG.DEFAULT_ZOOM,
  markers: () => [],
})

const emit = defineEmits<Emits>()

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<mapboxgl.Map | null>(null)
const mapMarkers = ref<mapboxgl.Marker[]>([])
const isReady = ref(false)

// 初始化 Mapbox 地图
const initMap = () => {
  if (!mapContainer.value) return

  const mapInstance = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAP_CONFIG.STYLE,
    center: props.center,
    zoom: props.zoom,
    attributionControl: false,
  })

  map.value = mapInstance

  // 添加导航控件
  mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

  // 地图点击事件
  mapInstance.on('click', (e) => {
    emit('mapClick', { lng: e.lngLat.lng, lat: e.lngLat.lat })
  })

  mapInstance.on('load', () => {
    isReady.value = true
    emit('ready', mapInstance)
    updateMarkers()
  })
}

// 创建标记点
const createMarker = (markerData: typeof props.markers[number]) => {
  if (!map.value) return

  const color = markerData.color || '#FF2442'

  // 创建自定义标记元素
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${color};
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    cursor: pointer;
    transition: transform 0.2s;
  `

  // 悬停效果
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
  })

  // 点击事件
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    emit('markerClick', markerData)
  })

  const marker = new mapboxgl.Marker({ element: el })
    .setLngLat(markerData.position)
    .addTo(map.value)

  // 如果有标题，添加弹出框
  if (markerData.title) {
    const popup = new mapboxgl.Popup({ offset: 25 }).setText(markerData.title)
    marker.setPopup(popup)
  }

  mapMarkers.value.push(marker)
}

// 更新标记点
const updateMarkers = () => {
  // 清除现有标记
  mapMarkers.value.forEach(marker => marker.remove())
  mapMarkers.value = []

  // 添加新标记
  props.markers.forEach(createMarker)
}

// 监听标记点变化
watch(() => props.markers, updateMarkers, { deep: true })

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    map.value.flyTo({ center: newCenter, duration: 800 })
  }
}, { deep: true })

// 监听缩放级别变化
watch(() => props.zoom, (newZoom) => {
  if (map.value && newZoom) {
    map.value.flyTo({ zoom: newZoom, duration: 500 })
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  // 清除标记
  mapMarkers.value.forEach(marker => marker.remove())
  mapMarkers.value = []

  // 销毁地图
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

// 暴露方法给父组件
defineExpose({
  getMap: () => map.value,
  setCenter: (center: [number, number]) => {
    map.value?.flyTo({ center, duration: 800 })
  },
  setZoom: (zoom: number) => {
    map.value?.flyTo({ zoom, duration: 500 })
  },
  flyTo: (options: { center?: [number, number]; zoom?: number }) => {
    map.value?.flyTo({ ...options, duration: 800 })
  },
})
</script>

<template>
  <div ref="mapContainer" class="map-container">
    <div v-if="!isReady" class="map-loading">
      <div class="loading-spinner"></div>
      <span>地图加载中...</span>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-loading {
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

/* Mapbox 样式覆盖 */
:deep(.mapboxgl-canvas) {
  outline: none;
}

:deep(.mapboxgl-ctrl-bottom-right) {
  margin-bottom: 80px;
  margin-right: 8px;
}
</style>
