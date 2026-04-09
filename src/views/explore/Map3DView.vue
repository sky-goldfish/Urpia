<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import TabBar from '../../components/ui/TabBar.vue'
import MoodColorSelector from '../../components/ui/MoodColorSelector.vue'
import Capsule3D from '../../components/effects/Capsule3D.vue'
import { MAP_CONFIG, assertMapConfig } from '../../config/mapConfig'
import { premiumStoreCatalog } from '../../config/storeCatalog'

type MapboxMapLike = any
type MapboxMarkerLike = any

interface POIItem {
  id: string
  name: string
  coordinates: [number, number]
  verified?: boolean
  color?: string
}

const router = useRouter()
const mapContainer = ref<HTMLDivElement | null>(null)
const map = shallowRef<MapboxMapLike | null>(null)
const isMapLoaded = ref(false)
const effectOverlays = ref<Map<string, { marker: MapboxMarkerLike; element: HTMLDivElement }>>(new Map())

const verifiedPOIs = ref<POIItem[]>(
  premiumStoreCatalog.slice(0, 3).map((store, index) => ({
    id: store.id,
    name: store.name,
    coordinates: store.coordinates,
    verified: true,
    color: ['#FF2442', '#E8A44A', '#6BBFA3'][index] ?? '#FF2442',
  })),
)

const updateEffectVisuals = (poiId: string) => {
  const overlay = effectOverlays.value.get(poiId)
  if (!overlay || !map.value) return

  const zoom = map.value.getZoom()
  const finalScale = Math.min(Math.max(0.34 + (zoom - 14) * 0.08, 0.28), 0.72)
  const opacity = Math.min(Math.max(0.58 + (zoom - 12) * 0.06, 0.58), 1)

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
    overlay.marker.remove()
  })
  effectOverlays.value.clear()
}

const create3DEffect = (poi: POIItem) => {
  if (!map.value) return

  const container = document.createElement('div')
  container.className = 'poi-3d-effect'
  container.style.cssText = `
    position: relative;
    width: 132px;
    height: 132px;
    pointer-events: auto;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 14px 28px rgba(0,0,0,0.24));
  `

  const vueMount = document.createElement('div')
  vueMount.className = 'capsule-wrapper'
  vueMount.style.cssText = `
    width: 100%;
    height: 100%;
    transform: scale(0.46);
    transform-origin: center bottom;
    opacity: 0.96;
  `
  container.appendChild(vueMount)

  container.addEventListener('click', () => {
    void router.push(`/poi/${poi.id}/indoor`)
  })

  const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
    .setLngLat(poi.coordinates)
    .addTo(map.value)

  effectOverlays.value.set(poi.id, { marker, element: vueMount })
  updateEffectVisuals(poi.id)
}

const initMap = async () => {
  if (!mapContainer.value) return

  try {
    assertMapConfig()
    mapboxgl.accessToken = MAP_CONFIG.MAPBOX_TOKEN

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.value,
      style: MAP_CONFIG.MAPBOX_STYLE,
      center: MAP_CONFIG.DEFAULT_CENTER,
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
      pitch: 58,
      bearing: -18,
      antialias: true,
      attributionControl: false,
    })

    const safeMap = mapInstance as MapboxMapLike

    safeMap.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right')
    safeMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    safeMap.on('load', async () => {
      isMapLoaded.value = true
      await nextTick()
      verifiedPOIs.value.forEach((poi) => create3DEffect(poi))
      updateAllEffects()
    })

    safeMap.on('moveend', updateAllEffects)
    safeMap.on('zoomend', updateAllEffects)

    map.value = safeMap
  } catch (error) {
    console.error('Mapbox init failed:', error)
  }
}

const flyToPOI = (poi: POIItem) => {
  if (!map.value) return
  map.value.easeTo({
    center: poi.coordinates,
    zoom: 16.2,
    pitch: 60,
    duration: 900,
    essential: true,
  })
}

onMounted(() => {
  void initMap()
})

onUnmounted(() => {
  clearEffects()
  map.value?.remove()
  map.value = null
})
</script>

<template>
  <main class="device-shell" style="overflow: visible;">
    <div class="relative h-[100dvh] w-full overflow-hidden">
      <div ref="mapContainer" class="absolute inset-0 z-0" />

      <template v-for="entry in effectOverlays" :key="entry[0]">
        <Teleport :to="entry[1].element">
          <div class="scale-wrapper" @click.stop>
            <Capsule3D />
          </div>
        </Teleport>
      </template>

      <div class="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-30">
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
