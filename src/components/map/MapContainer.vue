<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { MAP_CONFIG, assertMapConfig } from '../../config/mapConfig'
import { loadAMap, type AMapGlobal, type AMapMapLike, type AMapMarkerLike } from '../../lib/amapLoader'

interface MarkerItem {
  id: string
  position: [number, number]
  title?: string
  color?: string
  data?: any
}

interface Props {
  center?: [number, number]
  zoom?: number
  markers?: MarkerItem[]
}

interface Emits {
  (e: 'markerClick', marker: MarkerItem): void
  (e: 'mapClick', position: { lng: number; lat: number }): void
  (e: 'ready', map: AMapMapLike): void
}

const props = withDefaults(defineProps<Props>(), {
  center: () => MAP_CONFIG.DEFAULT_CENTER,
  zoom: MAP_CONFIG.DEFAULT_ZOOM,
  markers: () => [],
})

const emit = defineEmits<Emits>()

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<AMapMapLike | null>(null)
const amap = ref<AMapGlobal | null>(null)
const mapMarkers = ref<AMapMarkerLike[]>([])
const isReady = ref(false)
const errorMessage = ref('')

const createMarker = (markerData: MarkerItem) => {
  if (!map.value || !amap.value) return

  const color = markerData.color || '#FF2442'
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

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
  })
  el.addEventListener('click', (event) => {
    event.stopPropagation()
    emit('markerClick', markerData)
  })

  const marker = new amap.value.Marker({
    position: markerData.position,
    content: el,
    anchor: 'bottom-center',
    title: markerData.title,
  })

  marker.setMap(map.value)
  mapMarkers.value.push(marker)
}

const clearMarkers = () => {
  mapMarkers.value.forEach((marker) => marker.setMap(null))
  mapMarkers.value = []
}

const updateMarkers = () => {
  clearMarkers()
  props.markers.forEach(createMarker)
}

const initMap = async () => {
  if (!mapContainer.value) return

  try {
    assertMapConfig()
    amap.value = await loadAMap()

    const mapInstance = new amap.value.Map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      viewMode: MAP_CONFIG.DEFAULT_VIEW_MODE,
      zooms: [3, 20],
    })

    map.value = mapInstance

    mapInstance.on('click', (event: any) => {
      const lng = event?.lnglat?.getLng?.() ?? event?.lnglat?.lng
      const lat = event?.lnglat?.getLat?.() ?? event?.lnglat?.lat
      if (typeof lng === 'number' && typeof lat === 'number') {
        emit('mapClick', { lng, lat })
      }
    })

    if (mapInstance.plugin && amap.value.ToolBar) {
      mapInstance.plugin(['AMap.ToolBar'], () => {
        if (!map.value || !amap.value?.ToolBar || !(map.value as any).addControl) return
        ;(map.value as any).addControl(new amap.value.ToolBar({ position: 'RB' }))
      })
    }

    isReady.value = true
    errorMessage.value = ''
    emit('ready', mapInstance)
    updateMarkers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '地图初始化失败，请检查高德配置。'
  }
}

watch(() => props.markers, updateMarkers, { deep: true })

watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    map.value.setCenter(newCenter)
  }
}, { deep: true })

watch(() => props.zoom, (newZoom) => {
  if (map.value && typeof newZoom === 'number') {
    map.value.setZoom(newZoom)
  }
})

onMounted(() => {
  void initMap()
})

onUnmounted(() => {
  clearMarkers()
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
})

defineExpose({
  getMap: () => map.value,
  setCenter: (center: [number, number]) => {
    map.value?.setCenter(center)
  },
  setZoom: (zoom: number) => {
    map.value?.setZoom(zoom)
  },
  flyTo: (options: { center?: [number, number]; zoom?: number }) => {
    if (!map.value) return
    if (typeof options.zoom === 'number' && options.center && map.value.setZoomAndCenter) {
      map.value.setZoomAndCenter(options.zoom, options.center)
      return
    }
    if (options.center) map.value.setCenter(options.center)
    if (typeof options.zoom === 'number') map.value.setZoom(options.zoom)
  },
})
</script>

<template>
  <div ref="mapContainer" class="map-container">
    <div v-if="!isReady && !errorMessage" class="map-loading">
      <div class="loading-spinner"></div>
      <span>地图加载中...</span>
    </div>
    <div v-else-if="errorMessage" class="map-error">
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-loading,
.map-error {
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
  padding: 24px;
  text-align: center;
}

.map-error {
  color: #b42318;
  background: #fff5f5;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #1d1d1f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
