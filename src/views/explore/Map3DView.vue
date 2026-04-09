<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import MoodColorSelector from '../../components/ui/MoodColorSelector.vue'
import { MAP_CONFIG, assertMapConfig } from '../../config/mapConfig'
import Capsule3D from '../../components/effects/Capsule3D.vue'
import { loadAMap, type AMapGlobal, type AMapMapLike, type AMapMarkerLike } from '../../lib/amapLoader'

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
const amap = ref<AMapGlobal | null>(null)
const map = ref<AMapMapLike | null>(null)
const isMapLoaded = ref(false)
const effectOverlays = ref<Map<string, {
  marker: AMapMarkerLike
  element: HTMLDivElement
}>>(new Map())

const verifiedPOIs = ref<POIItem[]>([
  {
    id: 'poi-1',
    name: '人民广场',
    coordinates: [121.4737, 31.2304],
    altitude: 100,
    verified: true,
    color: '#FF2442',
  },
  {
    id: 'poi-2',
    name: '外滩',
    coordinates: [121.4878, 31.2356],
    altitude: 80,
    verified: true,
    color: '#E8A44A',
  },
  {
    id: 'poi-3',
    name: '静安寺',
    coordinates: [121.4453, 31.2165],
    altitude: 120,
    verified: true,
    color: '#6BBFA3',
  },
])

const create3DEffect = (poi: POIItem) => {
  if (!map.value || !amap.value) return

  const container = document.createElement('div')
  container.className = 'poi-3d-effect'
  container.style.cssText = `
    position: relative;
    width: 120px;
    height: 120px;
    pointer-events: auto;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
  `

  const vueMount = document.createElement('div')
  vueMount.className = 'capsule-wrapper'
  vueMount.style.cssText = `
    width: 100%;
    height: 100%;
    transform: scale(0.45);
    transform-origin: center bottom;
    opacity: 0.95;
  `
  container.appendChild(vueMount)

  container.addEventListener('click', () => {
    void router.push(`/poi/${poi.id}/indoor`)
  })

  const marker = new amap.value.Marker({
    position: poi.coordinates,
    content: container,
    anchor: 'bottom-center',
    offset: [0, 0],
    title: poi.name,
  })

  marker.setMap(map.value)
  effectOverlays.value.set(poi.id, { marker, element: vueMount })
  updateEffectVisuals(poi.id)
}

const updateEffectVisuals = (poiId: string) => {
  const overlay = effectOverlays.value.get(poiId)
  if (!overlay || !map.value) return

  const zoom = map.value.getZoom?.() ?? MAP_CONFIG.DEFAULT_ZOOM
  const finalScale = Math.min(Math.max(0.3 + (zoom - 14) * 0.08, 0.25), 0.7)
  const opacity = Math.min(Math.max(0.55 + (zoom - 12) * 0.06, 0.55), 1)

  overlay.element.style.transform = `scale(${finalScale})`
  overlay.element.style.opacity = String(opacity)
}

const updateAllEffects = () => {
  effectOverlays.value.forEach((_, poiId) => {
    updateEffectVisuals(poiId)
  })
}

const clearEffects = () => {
  effectOverlays.value.forEach((overlay) => {
    overlay.marker.setMap(null)
  })
  effectOverlays.value.clear()
}

const initMap = async () => {
  if (!mapContainer.value) return

  try {
    assertMapConfig()
    amap.value = await loadAMap()

    const mapInstance = new amap.value.Map(mapContainer.value, {
      center: MAP_CONFIG.DEFAULT_CENTER,
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
      viewMode: MAP_CONFIG.DEFAULT_VIEW_MODE,
      zooms: [3, 20],
    })

    map.value = mapInstance
    isMapLoaded.value = true

    mapInstance.on('moveend', updateAllEffects)
    mapInstance.on('zoomend', updateAllEffects)

    nextTick(() => {
      verifiedPOIs.value.forEach((poi) => create3DEffect(poi))
    })
  } catch (error) {
    console.error('AMap init failed:', error)
  }
}

const flyToPOI = (poi: POIItem) => {
  if (!map.value) return
  if (map.value.setZoomAndCenter) {
    map.value.setZoomAndCenter(16, poi.coordinates)
    return
  }
  map.value.setCenter(poi.coordinates)
  map.value.setZoom(16)
}

onMounted(() => {
  void initMap()
})

onUnmounted(() => {
  clearEffects()
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
})
</script>

<template>
  <main class="device-shell" style="overflow: visible;">
    <div class="relative h-[100dvh] w-full overflow-hidden">
      <!-- AMap 地图容器 -->
      <div ref="mapContainer" class="absolute inset-0 z-0" />

      <template v-for="entry in effectOverlays" :key="entry[0]">
        <Teleport :to="entry[1].element">
          <div class="scale-wrapper" @click.stop>
            <Capsule3D />
          </div>
        </Teleport>
      </template>

      <div class="absolute top-[calc(env(safe-area-inset-top)+16px)] right-4 z-30">
        <MoodColorSelector />
      </div>

      <div v-if="isMapLoaded" class="absolute left-4 top-[calc(env(safe-area-inset-top)+16px)] z-30 flex gap-2">
        <button
          v-for="poi in verifiedPOIs"
          :key="poi.id"
          type="button"
          class="rounded-full bg-white/90 px-3 py-2 text-[12px] text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          @click="flyToPOI(poi)"
        >
          {{ poi.name }}
        </button>
      </div>

      <TabBar />
    </div>
  </main>
</template>

<style scoped>
:deep(.device-shell) {
  overflow: visible;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

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

:deep(.poi-3d-effect) {
  z-index: 100;
}
</style>
