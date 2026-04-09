<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue'
import Capsule3D from '../../components/effects/Capsule3D.vue'
import type { AMapMapLike, AMapMarkerLike, AMapGlobal } from '../../lib/amapLoader'

interface POIItem {
  id: string
  name: string
  coordinates: [number, number]
  altitude?: number
  verified?: boolean
}

interface Props {
  map: AMapMapLike | null
  poiItems: POIItem[]
  visible?: boolean
  amap?: AMapGlobal | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  amap: null,
})

const effectMarkers = ref<Map<string, AMapMarkerLike>>(new Map())
const effectContainers = ref<Map<string, HTMLDivElement>>(new Map())

const create3DEffectMarker = (poi: POIItem) => {
  if (!props.map || !props.visible || !props.amap) return

  removeEffectMarker(poi.id)

  const container = document.createElement('div')
  container.className = 'effect-3d-container'
  container.style.cssText = `
    position: relative;
    width: 120px;
    height: 120px;
    pointer-events: none;
    transform-origin: center bottom;
  `

  const mountPoint = document.createElement('div')
  mountPoint.style.cssText = `
    width: 100%;
    height: 100%;
    transform: scale(0.45);
    opacity: 0.95;
  `
  container.appendChild(mountPoint)

  const marker = new props.amap.Marker({
    position: poi.coordinates,
    content: container,
    anchor: 'bottom-center',
    title: poi.name,
  })

  marker.setMap(props.map)

  effectMarkers.value.set(poi.id, marker)
  effectContainers.value.set(poi.id, mountPoint)

  updateMarkerPosition(poi.id, poi.coordinates, poi.altitude || 50)
}

const updateMarkerPosition = (id: string, coordinates: [number, number], altitude: number) => {
  const marker = effectMarkers.value.get(id)
  if (!marker || !props.map) return

  marker.setPosition?.(coordinates)

  const zoom = props.map.getZoom?.() ?? 14
  const scale = Math.min(Math.max(0.35 + (zoom - 14) * 0.08, 0.25), 0.75)
  const container = effectContainers.value.get(id)

  if (container) {
    container.style.transform = `scale(${scale}) translateY(${-Math.min(altitude / 20, 10)}px)`
  }
}

const removeEffectMarker = (id: string) => {
  const marker = effectMarkers.value.get(id)
  if (marker) {
    marker.setMap(null)
    effectMarkers.value.delete(id)
    effectContainers.value.delete(id)
  }
}

const clearAllEffects = () => {
  effectMarkers.value.forEach((marker) => marker.setMap(null))
  effectMarkers.value.clear()
  effectContainers.value.clear()
}

const handleMapMove = () => {
  if (!props.map) return

  props.poiItems.forEach((poi) => {
    updateMarkerPosition(poi.id, poi.coordinates, poi.altitude || 50)
  })
}

const initEffects = () => {
  if (!props.map || !props.visible || !props.amap) return

  const verifiedPOIs = props.poiItems.filter((poi) => poi.verified !== false)
  verifiedPOIs.forEach((poi) => {
    create3DEffectMarker(poi)
  })
}

watch(() => props.map, (newMap) => {
  if (newMap) {
    nextTick(() => {
      initEffects()
      newMap.on('moveend', handleMapMove)
      newMap.on('zoomend', handleMapMove)
    })
  }
}, { immediate: true })

watch(() => props.poiItems, () => {
  clearAllEffects()
  initEffects()
}, { deep: true })

watch(() => props.visible, (visible) => {
  if (visible) {
    initEffects()
  } else {
    clearAllEffects()
  }
})

onUnmounted(() => {
  if (props.map && props.map.off) {
    props.map.off('moveend', handleMapMove)
    props.map.off('zoomend', handleMapMove)
  }
  clearAllEffects()
})
</script>

<template>
  <!-- 3D特效通过 AMap Marker 渲染，不需要额外的DOM -->
  <Teleport v-for="[id, container] in effectContainers" :key="id" :to="container">
    <Capsule3D />
  </Teleport>
</template>

<style scoped>
:global(.effect-3d-container) {
  z-index: 100;
}

:global(.effect-3d-container .content) {
  width: 100% !important;
  height: 100% !important;
}
</style>
