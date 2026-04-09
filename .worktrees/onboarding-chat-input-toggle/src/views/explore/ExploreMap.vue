<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import TabBar from '../../components/ui/TabBar.vue'
import SocialMatchChat from '../social/SocialMatchChat.vue'
import { poiList } from '../../lib/mockData'

// 禁用 Web Worker，在主线程运行，彻底绕开 CSP eval 限制
;(mapboxgl as any).workerUrl = ''

type MapboxMap = InstanceType<typeof mapboxgl.Map>

const router = useRouter()
const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<MapboxMap | null>(null)
const showSearch = ref(false)
const searchQuery = ref('')
const activeMood = ref<string | null>(null)
const showFilter = ref(false)
const showMatchChat = ref(false)

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

// 上海市中心坐标
const MAP_CENTER: [number, number] = [121.4737, 31.2304]
const MAP_ZOOM = 14

// POI 真实坐标（上海）
const poiCoords: Record<string, [number, number]> = {
  'harbor-light': [121.4489, 31.2295],
  'glasshouse': [121.4375, 31.1889],
  'midnight-pool': [121.4910, 31.2345],
}

const moodFilters = [
  { key: 'healing', label: '治愈', color: '#6BBFA3' },
  { key: 'energy', label: '活力', color: '#E8A44A' },
  { key: 'romantic', label: '浪漫', color: '#D4788C' },
  { key: 'creative', label: '创意', color: '#9B8EC4' },
  { key: 'social', label: '社交', color: '#D49A5A' },
  { key: 'cozy', label: '温馨', color: '#B89A80' },
]

const moodColorMap: Record<string, string> = {
  healing: '#6BBFA3',
  energy: '#E8A44A',
  romantic: '#D4788C',
  creative: '#9B8EC4',
  social: '#D49A5A',
  cozy: '#B89A80',
}

const poiMoodMap: Record<string, string> = {
  'harbor-light': 'healing',
  'glasshouse': 'creative',
  'midnight-pool': 'romantic',
}

const getPoiColor = (id: string) => moodColorMap[poiMoodMap[id] ?? 'healing'] ?? '#8E8E93'

const openPoi = (id: string) => {
  void router.push(`/poi/${id}`)
}

const toggleMood = (key: string) => {
  activeMood.value = activeMood.value === key ? null : key
}

const openMatchChat = () => {
  showSearch.value = false
  showFilter.value = false
  showMatchChat.value = true
}

const closeMatchChat = () => {
  showMatchChat.value = false
}

const locateUser = () => {
  map.value?.flyTo({ center: MAP_CENTER, zoom: 15, duration: 800 })
}

// 创建 POI Marker
const createPoiMarker = (poi: typeof poiList[number]) => {
  const currentMap = map.value
  if (!currentMap) return
  const coords = poiCoords[poi.id] ?? MAP_CENTER
  const color = getPoiColor(poi.id)

  const el = document.createElement('div')
  el.className = 'poi-marker'
  el.style.cssText = `
    width: 32px; height: 32px; border-radius: 50%;
    background: ${color}; border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    cursor: pointer; transition: transform 0.2s;
  `
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.3)' })
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
  el.addEventListener('click', () => openPoi(poi.id))

  const marker = new mapboxgl.Marker({ element: el }) as mapboxgl.Marker
  marker.setLngLat(coords)
  ;(marker as { addTo: (mapInstance: unknown) => void }).addTo(currentMap)
}

// 情绪筛选时过滤 POI
watch(activeMood, (mood) => {
  if (!map.value) return
  // 清除所有自定义 marker 再重建
  const el = map.value.getContainer()
  el.querySelectorAll('.poi-marker').forEach(m => m.closest('.mapboxgl-marker')?.remove())

  const filtered = mood
    ? poiList.filter(p => poiMoodMap[p.id] === mood)
    : poiList
  filtered.forEach(createPoiMarker)
})

onMounted(() => {
  if (!mapContainer.value) return

  mapboxgl.accessToken = MAPBOX_TOKEN
  const m = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    attributionControl: false,
  })

  m.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

  m.on('load', () => {
    map.value = m
    poiList.forEach(createPoiMarker)
  })
})
</script>

<template>
  <main class="device-shell" style="overflow: visible;">
    <!-- v4 主地图页：全屏地图 + 悬浮控件 -->
    <div class="relative h-[100dvh] w-full overflow-hidden">
      <!-- Mapbox GL 地图容器 -->
      <div ref="mapContainer" class="absolute inset-0 z-0" />

      <!-- v4 顶部悬浮区域 -->
      <div class="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-20 flex flex-col gap-3">
        <!-- 搜索按钮 + 展开搜索框 -->
        <div class="relative">
          <input
            v-if="showSearch"
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="absolute right-12 top-1/2 z-30 h-9 w-56 -translate-y-1/2 rounded-[18px] bg-white px-3 text-[14px] text-[#1D1D1f] shadow-[0_1px_3px_rgba(0,0,0,0.06)] outline-none"
            style="letter-spacing: -0.224px"
            placeholder="搜索..."
          />
          <button
            type="button"
            class="relative z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            @click="showSearch = !showSearch; showFilter = false"
          >
            <span class="material-symbols-outlined text-[18px] text-[#6C6C6C]">
              {{ showSearch ? 'close' : 'search' }}
            </span>
          </button>
        </div>

        <!-- 筛选按钮（相对定位，作为下拉面板的锚点） -->
        <div class="relative">
          <button
            type="button"
            class="relative z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            @click.stop="showFilter = !showFilter; showSearch = false"
          >
            <span class="material-symbols-outlined text-[18px] text-[#6C6C6C]">palette</span>
          </button>

          <!-- 情绪筛选下拉（绝对定位，从按钮左侧展开） -->
          <div
            v-if="showFilter"
            class="absolute right-12 top-1/2 z-30 flex -translate-y-1/2 gap-2 rounded-[12px] bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            @click.stop
          >
            <button
              v-for="mood in moodFilters"
              :key="mood.key"
              type="button"
              class="h-5 w-5 rounded-full transition-all duration-200"
              :class="activeMood === mood.key ? 'ring-2 ring-[#1D1D1F] ring-offset-1' : 'opacity-60 hover:opacity-100'"
              :style="{ backgroundColor: mood.color }"
              :aria-label="mood.label"
              :title="mood.label"
              @click.stop="toggleMood(mood.key)"
            />
          </div>
        </div>
      </div>

      <!-- 点击地图空白处关闭弹出层 -->
      <div
        v-if="showSearch || showFilter"
        class="absolute inset-0 z-[15]"
        @click="showSearch = false; showFilter = false"
      />

      <!-- 左上角定位按钮 -->
      <button
        type="button"
        class="absolute left-4 top-[calc(env(safe-area-inset-top)+16px)] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        @click="locateUser"
      >
        <span class="material-symbols-outlined text-[18px] text-[#6C6C6C]">my_location</span>
      </button>

      <!-- 社交模式入口按钮（地图右下角，TabBar 上方） -->
      <button
        type="button"
        class="absolute right-4 bottom-[calc(72px+env(safe-area-inset-bottom)+12px)] z-20 flex h-11 items-center gap-2 rounded-full bg-[#1D1D1F] pl-4 pr-5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform active:scale-95"
        @click="openMatchChat"
      >
        <span class="material-symbols-outlined text-[18px] text-white">forum</span>
        <span class="text-[13px] font-medium text-white" style="letter-spacing: -0.224px">开始社交</span>
      </button>

      <!-- A2A 对话浮层 -->
      <SocialMatchChat :visible="showMatchChat" @close="closeMatchChat" />

      <!-- 底部导航栏 -->
      <TabBar />
    </div>
  </main>
</template>

<style scoped>
/* 地图页需要溢出可见，让 Mapbox canvas 正常渲染 */
:deep(.device-shell) {
  overflow: visible;
}

:deep(.mapboxgl-canvas) {
  outline: none;
}
</style>
