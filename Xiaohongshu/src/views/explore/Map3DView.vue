<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import TabBar from '../../components/ui/TabBar.vue'
import MoodColorSelector from '../../components/ui/MoodColorSelector.vue'
import { MAP_CONFIG } from '../../config/mapConfig'
import Capsule3D from '../../components/effects/Capsule3D.vue'

// 设置 Mapbox Token
mapboxgl.accessToken = MAP_CONFIG.TOKEN
;(mapboxgl as any).workerUrl = ''

interface POIItem {
  id: string
  name: string
  coordinates: [number, number]
  altitude?: number
  verified?: boolean
  color?: string
}

const router = useRouter()
const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<mapboxgl.Map | null>(null)
const isMapLoaded = ref(false)

// 3D特效相关
const effectOverlays = ref<Map<string, {
  marker: mapboxgl.Marker
  element: HTMLDivElement
}>>(new Map())

// 示例POI数据（已审核确认的GPS定位）
const verifiedPOIs = ref<POIItem[]>([
  {
    id: 'poi-1',
    name: '人民广场',
    coordinates: [121.4737, 31.2304],
    altitude: 100,
    verified: true,
    color: '#FF2442'
  },
  {
    id: 'poi-2', 
    name: '外滩',
    coordinates: [121.4878, 31.2356],
    altitude: 80,
    verified: true,
    color: '#E8A44A'
  },
  {
    id: 'poi-3',
    name: '静安寺',
    coordinates: [121.4453, 31.2165],
    altitude: 120,
    verified: true,
    color: '#6BBFA3'
  }
])

// 创建3D特效标记
const create3DEffect = (poi: POIItem) => {
  if (!map.value) return

  // 创建特效容器 - 使用原始 capsule_3d.vue 的样式
  const container = document.createElement('div')
  container.className = 'poi-3d-effect'
  container.style.cssText = `
    position: relative;
    width: 50vmin;
    height: 50vmin;
    pointer-events: auto;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
  `

  // 创建Vue挂载点 - 直接渲染胶囊
  const vueMount = document.createElement('div')
  vueMount.className = 'capsule-wrapper'
  vueMount.style.cssText = `
    width: 100%;
    height: 100%;
    transform: scale(0.15);
    transform-origin: center center;
  `
  container.appendChild(vueMount)

  // 创建Mapbox标记
  const marker = new mapboxgl.Marker({
    element: container,
    anchor: 'bottom',
    offset: [0, -poi.altitude || 50]
  })
    .setLngLat(poi.coordinates)
    .addTo(map.value)

  // 点击事件 - 跳转到POI室内场景
  container.addEventListener('click', () => {
    console.log('点击了POI:', poi.name, '跳转到室内场景')
    // 导航到POI室内场景页面
    router.push(`/poi/${poi.id}/indoor`)
  })

  // 保存引用
  effectOverlays.value.set(poi.id, { marker, element: vueMount })

  // 根据地图状态更新视觉效果
  updateEffectVisuals(poi.id)
}

// 更新特效视觉效果（处理缩放和视角）
const updateEffectVisuals = (poiId: string) => {
  const overlay = effectOverlays.value.get(poiId)
  if (!overlay || !map.value) return

  const zoom = map.value.getZoom()
  const pitch = map.value.getPitch()
  
  // 根据缩放级别调整大小
  const baseScale = 0.4
  const zoomScale = Math.pow(2, (zoom - 14) * 0.3)
  const finalScale = Math.min(Math.max(baseScale * zoomScale, 0.2), 1.2)
  
  // 根据倾斜角度调整透明度
  const opacity = Math.min(pitch / 30, 1) * 0.8 + 0.2
  
  overlay.element.style.transform = `scale(${finalScale})`
  overlay.element.style.opacity = String(opacity)
}

// 更新所有特效
const updateAllEffects = () => {
  effectOverlays.value.forEach((_, poiId) => {
    updateEffectVisuals(poiId)
  })
}

// 清除特效
const clearEffects = () => {
  effectOverlays.value.forEach((overlay) => {
    overlay.marker.remove()
  })
  effectOverlays.value.clear()
}

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) return

  const mapInstance = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAP_CONFIG.STYLE,
    center: MAP_CONFIG.DEFAULT_CENTER,
    zoom: MAP_CONFIG.DEFAULT_ZOOM,
    pitch: 60, // 3D倾斜角度
    bearing: -20, // 旋转角度
    antialias: true, // 开启抗锯齿
    attributionControl: false
  })

  map.value = mapInstance

  // 添加3D建筑图层
  mapInstance.on('style.load', () => {
    // 添加3D建筑图层
    if (!mapInstance.getLayer('3d-buildings')) {
      mapInstance.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 14,
        'paint': {
          'fill-extrusion-color': '#ddd',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6
        }
      })
    }
  })

  // 地图加载完成后添加特效
  mapInstance.on('load', () => {
    isMapLoaded.value = true
    
    // 添加导航控件
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
    
    // 添加3D特效
    nextTick(() => {
      verifiedPOIs.value.forEach(poi => create3DEffect(poi))
    })
  })

  // 监听地图变化
  mapInstance.on('move', updateAllEffects)
  mapInstance.on('zoom', updateAllEffects)
  mapInstance.on('pitch', updateAllEffects)
}

// 定位到POI
const flyToPOI = (poi: POIItem) => {
  if (!map.value) return
  
  map.value.flyTo({
    center: poi.coordinates,
    zoom: 16,
    pitch: 60,
    bearing: -20,
    duration: 1500
  })
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  clearEffects()
  if (map.value) {
    map.value.remove()
  }
})
</script>

<template>
  <main class="device-shell" style="overflow: visible;">
    <div class="relative h-[100dvh] w-full overflow-hidden">
      <!-- 3D地图容器 -->
      <div ref="mapContainer" class="absolute inset-0 z-0" />

      <!-- 3D特效渲染（通过Teleport挂载到Marker中） -->
      <template v-for="[id, overlay] in effectOverlays" :key="id">
        <Teleport :to="overlay.element">
          <div class="scale-wrapper">
            <Capsule3D />
          </div>
        </Teleport>
      </template>

      <!-- 情绪颜色选择器 - 右上角 -->
      <div class="absolute top-[calc(env(safe-area-inset-top)+16px)] right-4 z-30">
        <MoodColorSelector />
      </div>

      <!-- 底部导航栏 -->
      <TabBar />
    </div>
  </main>
</template>

<style scoped>
:deep(.device-shell) {
  overflow: visible;
}

/* 隐藏滚动条 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* 3D特效缩放包装器 */
.scale-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.scale-wrapper :deep(.content) {
  width: 120px !important;
  height: 120px !important;
}

/* Mapbox样式覆盖 */
:deep(.mapboxgl-canvas) {
  outline: none;
}

:deep(.poi-3d-effect) {
  z-index: 100;
}
</style>
