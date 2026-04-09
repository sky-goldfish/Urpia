<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import SocialMatchChat from '../social/SocialMatchChat.vue'
import { MAP_CONFIG, assertMapConfig } from '../../config/mapConfig'
import { poiList } from '../../lib/mockData'
import { loadAMap } from '../../lib/amapLoader'

type LngLatTuple = [number, number]

type AMapMarkerLike = {
  setMap?: (map: AMapMapLike | null) => void
  remove?: () => void
}

type AMapMapLike = {
  addControl?: (control: unknown) => void
  destroy?: () => void
  setCenter?: (center: LngLatTuple) => void
  setZoom?: (zoom: number) => void
  setZoomAndCenter?: (zoom: number, center: LngLatTuple) => void
}

type AMapNamespace = {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapMapLike
  Marker: new (options: Record<string, unknown>) => AMapMarkerLike
  ToolBar?: new (options?: Record<string, unknown>) => unknown
  Pixel?: new (x: number, y: number) => unknown
}

const router = useRouter()
const mapContainer = ref<HTMLDivElement | null>(null)
const amap = ref<AMapNamespace | null>(null)
const map = ref<AMapMapLike | null>(null)
const poiMarkers = ref<Map<string, AMapMarkerLike>>(new Map())
const mapError = ref<string | null>(null)
const showSearch = ref(false)
const searchQuery = ref('')
const activeMood = ref<string | null>(null)
const showFilter = ref(false)
const showMatchChat = ref(false)

const MAP_CENTER = MAP_CONFIG.DEFAULT_CENTER
const MAP_ZOOM = MAP_CONFIG.DEFAULT_ZOOM

const poiCoords: Record<string, LngLatTuple> = {
  'harbor-light': [121.4489, 31.2295],
  'glasshouse': [121.4375, 31.1889],
  'midnight-pool': [121.491, 31.2345],
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

const clearPoiMarkers = () => {
  poiMarkers.value.forEach((marker) => {
    marker.setMap?.(null)
    marker.remove?.()
  })
  poiMarkers.value.clear()
}

const createPoiMarker = (poi: typeof poiList[number]) => {
  const currentMap = map.value
  const currentAMap = amap.value

  if (!currentMap || !currentAMap) {
    return
  }

  const coords = poiCoords[poi.id] ?? MAP_CENTER
  const color = getPoiColor(poi.id)

  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'poi-marker'
  el.setAttribute('aria-label', poi.name)
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
    el.style.transform = 'scale(1.3)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
  })
  el.addEventListener('click', () => openPoi(poi.id))

  const markerOptions: Record<string, unknown> = {
    position: coords,
    content: el,
    anchor: 'center',
  }

  if (currentAMap.Pixel) {
    markerOptions.offset = new currentAMap.Pixel(-16, -16)
  }

  const marker = new currentAMap.Marker(markerOptions)
  marker.setMap?.(currentMap)
  poiMarkers.value.set(poi.id, marker)
}

const renderFilteredPois = () => {
  clearPoiMarkers()

  const filtered = activeMood.value
    ? poiList.filter((poi) => poiMoodMap[poi.id] === activeMood.value)
    : poiList

  filtered.forEach(createPoiMarker)
}

const locateUser = () => {
  const currentMap = map.value

  if (!currentMap) {
    return
  }

  if (currentMap.setZoomAndCenter) {
    currentMap.setZoomAndCenter(15, MAP_CENTER)
    return
  }

  currentMap.setCenter?.(MAP_CENTER)
  currentMap.setZoom?.(15)
}

watch(activeMood, () => {
  if (!map.value) {
    return
  }

  renderFilteredPois()
})

onMounted(async () => {
  if (!mapContainer.value) {
    return
  }

  try {
    assertMapConfig()
    const amapInstance = (await loadAMap()) as AMapNamespace
    amap.value = amapInstance

    const nextMap = new amapInstance.Map(mapContainer.value, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      viewMode: MAP_CONFIG.DEFAULT_VIEW_MODE,
      zooms: [3, 20],
    })

    map.value = nextMap

    if (amapInstance.ToolBar && nextMap.addControl) {
      nextMap.addControl(new amapInstance.ToolBar({ position: 'RB' }))
    }

    mapError.value = null
    renderFilteredPois()
  } catch (error) {
    mapError.value = error instanceof Error
      ? `地图加载失败，请检查高德地图 Key / 安全密钥配置后刷新重试。${error.message}`
      : '地图加载失败，请稍后重试。'
  }
})

onUnmounted(() => {
  clearPoiMarkers()
  map.value?.destroy?.()
  map.value = null
  amap.value = null
})
</script>

<template>
  <main class="device-shell" style="overflow: visible;">
    <!-- v4 主地图页：全屏地图 + 悬浮控件 -->
    <div class="relative h-[100dvh] w-full overflow-hidden">
      <!-- AMap 地图容器 -->
      <div ref="mapContainer" class="absolute inset-0 z-0" />

      <div
        v-if="mapError"
        class="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+64px)] z-20 rounded-[18px] bg-white/96 px-4 py-3 text-[#1D1D1F] shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur"
      >
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined mt-0.5 text-[18px] text-[#D96B6B]">warning</span>
          <div class="min-w-0">
            <p class="text-[14px] font-medium" style="letter-spacing: -0.224px">地图暂时不可用</p>
            <p class="mt-1 text-[12px] leading-[1.5] text-[#6C6C6C]">{{ mapError }}</p>
          </div>
        </div>
      </div>

      <!-- v4 顶部悬浮区域 -->
      <div class="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-20 flex flex-col gap-3">
        <!-- 搜索按钮 + 展开搜索框 -->
        <div class="relative">
          <input
            v-if="showSearch"
           
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
/* 地图页需要溢出可见，让地图容器正常铺满设备壳 */
:deep(.device-shell) {
  overflow: visible;
}
</style>
