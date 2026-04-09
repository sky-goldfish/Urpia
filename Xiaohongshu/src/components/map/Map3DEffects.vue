<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import mapboxgl from 'mapbox-gl'
import Capsule3D from '../../components/effects/Capsule3D.vue'

interface POIItem {
  id: string
  name: string
  coordinates: [number, number] // [经度, 纬度]
  altitude?: number // 海拔高度（米）
  verified?: boolean // 是否人工审核确认
}

interface Props {
  map: mapboxgl.Map | null
  poiItems: POIItem[]
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true
})

const effectMarkers = ref<Map<string, mapboxgl.Marker>>(new Map())
const effectContainers = ref<Map<string, HTMLDivElement>>(new Map())

// 创建3D特效标记
const create3DEffectMarker = (poi: POIItem) => {
  if (!props.map || !props.visible) return

  // 如果已存在，先移除
  removeEffectMarker(poi.id)

  // 创建容器元素
  const container = document.createElement('div')
  container.className = 'effect-3d-container'
  container.style.cssText = `
    position: relative;
    width: 120px;
    height: 120px;
    pointer-events: none;
    transform-origin: center bottom;
  `

  // 创建Vue挂载点
  const mountPoint = document.createElement('div')
  mountPoint.style.cssText = `
    width: 100%;
    height: 100%;
    transform: scale(0.5);
  `
  container.appendChild(mountPoint)

  // 使用Mapbox的Marker API创建标记
  const marker = new mapboxgl.Marker({
    element: container,
    anchor: 'bottom',
    offset: [0, 0]
  })
    .setLngLat(poi.coordinates)
    .addTo(props.map)

  // 保存引用
  effectMarkers.value.set(poi.id, marker)
  effectContainers.value.set(poi.id, mountPoint)

  // 更新标记位置以跟随地图
  updateMarkerPosition(poi.id, poi.coordinates, poi.altitude || 50)
}

// 更新标记位置（处理3D空间坐标）
const updateMarkerPosition = (id: string, coordinates: [number, number], altitude: number) => {
  const marker = effectMarkers.value.get(id)
  if (!marker || !props.map) return

  // 将GPS坐标转换为地图像素坐标
  const point = props.map.project(coordinates)
  
  // 根据缩放级别调整视觉效果
  const zoom = props.map.getZoom()
  const scale = Math.pow(2, zoom - 14) * 0.5 // 基础缩放比例
  const container = marker.getElement()
  
  if (container) {
    container.style.transform = `scale(${Math.min(scale, 2)})`
  }
}

// 移除特效标记
const removeEffectMarker = (id: string) => {
  const marker = effectMarkers.value.get(id)
  if (marker) {
    marker.remove()
    effectMarkers.value.delete(id)
    effectContainers.value.delete(id)
  }
}

// 清除所有特效
const clearAllEffects = () => {
  effectMarkers.value.forEach((marker) => marker.remove())
  effectMarkers.value.clear()
  effectContainers.value.clear()
}

// 监听地图移动事件，更新特效位置
const handleMapMove = () => {
  if (!props.map) return
  
  props.poiItems.forEach((poi) => {
    updateMarkerPosition(poi.id, poi.coordinates, poi.altitude || 50)
  })
}

// 初始化所有特效
const initEffects = () => {
  if (!props.map || !props.visible) return
  
  // 只显示已审核确认的POI
  const verifiedPOIs = props.poiItems.filter(poi => poi.verified !== false)
  
  verifiedPOIs.forEach((poi) => {
    create3DEffectMarker(poi)
  })
}

// 监听属性变化
watch(() => props.map, (newMap) => {
  if (newMap) {
    nextTick(() => {
      initEffects()
      newMap.on('move', handleMapMove)
      newMap.on('zoom', handleMapMove)
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
  if (props.map) {
    props.map.off('move', handleMapMove)
    props.map.off('zoom', handleMapMove)
  }
  clearAllEffects()
})

// 暴露方法
defineExpose({
  refreshEffects: initEffects,
  removeEffect: removeEffectMarker,
  clearEffects: clearAllEffects
})
</script>

<template>
  <!-- 3D特效通过Mapbox Marker渲染，不需要额外的DOM -->
  <Teleport v-for="[id, container] in effectContainers" :key="id" :to="container">
    <Capsule3D />
  </Teleport>
</template>

<style scoped>
/* 3D特效容器的样式 */
:global(.effect-3d-container) {
  z-index: 100;
}

:global(.effect-3d-container .content) {
  width: 100% !important;
  height: 100% !important;
}
</style>
