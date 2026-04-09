<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import MapContainer from './MapContainer.vue'
import AmapContainer from './AmapContainer.vue'
import { useMapProvider, type MapProvider } from '../../composables/useMapProvider'
import type { StoreCatalogItem } from '../../config/storeCatalog'

interface MarkerItem {
  id: string
  position: [number, number]
  title?: string
  color?: string
  data?: unknown
}

interface Props {
  center?: [number, number]
  zoom?: number
  markers?: MarkerItem[]
  storeMarkers?: StoreCatalogItem[]
  enableAvatar?: boolean
  avatarModelUrl?: string
  avatarImageUrl?: string
   avatarInitialPosition?: [number, number]
  // 强制指定地图提供商，如果不指定则自动检测
  forceProvider?: MapProvider
}

interface Emits {
  (e: 'markerClick', marker: MarkerItem): void
  (e: 'mapClick', position: { lng: number; lat: number }): void
  (e: 'ready', map: any): void
  (e: 'nearestPremiumChange', store: StoreCatalogItem | null): void
  (e: 'storeLocatorClick', store: StoreCatalogItem): void
  (e: 'providerChange', provider: MapProvider): void
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [121.6017, 31.2048],
  zoom: 14,
  markers: () => [],
  storeMarkers: () => [],
  enableAvatar: false,
  avatarModelUrl: '',
  avatarImageUrl: '',
  avatarInitialPosition: () => [121.6017, 31.2048],
})

const emit = defineEmits<Emits>()

// 使用地图提供商逻辑
const { currentProvider, isLoading, error, detectByCoordinates, setProvider } = useMapProvider()

// 计算当前使用的地图提供商
const activeProvider = computed<MapProvider>(() => {
  if (props.forceProvider) {
    return props.forceProvider
  }
  return currentProvider.value
})

// 判断是否使用 Mapbox
const useMapbox = computed(() => activeProvider.value === 'mapbox')

// 判断是否使用高德地图
const useAmap = computed(() => activeProvider.value === 'amap')

// 初始化地图提供商检测
const initProviderDetection = async () => {
  if (props.forceProvider) {
    // 如果强制指定了提供商，直接使用
    setProvider(props.forceProvider)
    return
  }

  // 尝试通过 GPS 检测位置
  try {
    await detectByGeolocation()
  } catch {
    // 如果 GPS 检测失败，根据默认中心点判断
    const [lng, lat] = props.center
    detectByCoordinates(lng, lat)
  }

  emit('providerChange', currentProvider.value)
}

// 监听中心点变化，重新检测提供商
watch(() => props.center, (newCenter) => {
  if (!props.forceProvider && newCenter) {
    const [lng, lat] = newCenter
    const newProvider = detectByCoordinates(lng, lat)
    if (newProvider !== currentProvider.value) {
      emit('providerChange', newProvider)
    }
  }
})

// 地图事件转发
const handleMarkerClick = (marker: MarkerItem) => emit('markerClick', marker)
const handleMapClick = (position: { lng: number; lat: number }) => emit('mapClick', position)
const handleReady = (map: any) => emit('ready', map)
const handleNearestPremiumChange = (store: StoreCatalogItem | null) => emit('nearestPremiumChange', store)
const handleStoreLocatorClick = (store: StoreCatalogItem) => emit('storeLocatorClick', store)

// 暴露方法
const mapboxRef = ref<InstanceType<typeof MapContainer> | null>(null)
const amapRef = ref<InstanceType<typeof AmapContainer> | null>(null)

const getMap = () => {
  return useMapbox.value ? mapboxRef.value?.getMap() : amapRef.value?.getMap()
}

const setCenter = (center: [number, number]) => {
  if (useMapbox.value) {
    mapboxRef.value?.setCenter(center)
  } else {
    amapRef.value?.setCenter(center)
  }
}

const setZoom = (zoom: number) => {
  if (useMapbox.value) {
    mapboxRef.value?.setZoom(zoom)
  } else {
    amapRef.value?.setZoom(zoom)
  }
}

const flyTo = (options: { center?: [number, number]; zoom?: number }) => {
  if (useMapbox.value) {
    // Mapbox 有 flyTo 方法
    const map = mapboxRef.value?.getMap()
    if (map && options.center) {
      map.flyTo({
        center: options.center,
        zoom: options.zoom,
        duration: 600,
      })
    }
  } else {
    // 高德地图使用 setCenter 和 setZoom 模拟 flyTo
    if (options.center) {
      amapRef.value?.setCenter(options.center)
    }
    if (options.zoom) {
      amapRef.value?.setZoom(options.zoom)
    }
  }
}

defineExpose({
  getMap,
  setCenter,
  setZoom,
  flyTo,
  activeProvider,
})

onMounted(() => {
  initProviderDetection()
})
</script>

<template>
  <div class="unified-map-container">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="map-loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在检测位置并加载地图...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="map-error-overlay">
      <p>{{ error }}</p>
      <button @click="initProviderDetection">重试</button>
    </div>

    <!-- Mapbox 地图 -->
    <MapContainer
      v-else-if="useMapbox"
      ref="mapboxRef"
      :center="center"
      :zoom="zoom"
      :markers="markers"
      :store-markers="storeMarkers"
      :enable-avatar="enableAvatar"
      :avatar-model-url="avatarModelUrl"
      :avatar-image-url="avatarImageUrl"
      :avatar-initial-position="avatarInitialPosition"
      @marker-click="handleMarkerClick"
      @map-click="handleMapClick"
      @ready="handleReady"
      @nearest-premium-change="handleNearestPremiumChange"
      @store-locator-click="handleStoreLocatorClick"
    />

    <!-- 高德地图 -->
    <AmapContainer
      v-else-if="useAmap"
      ref="amapRef"
      :center="center"
      :zoom="zoom"
      :markers="markers"
      :store-markers="storeMarkers"
      :enable-avatar="enableAvatar"
      :avatar-model-url="avatarModelUrl"
      :avatar-image-url="avatarImageUrl"
      :avatar-initial-position="avatarInitialPosition"
      @marker-click="handleMarkerClick"
      @map-click="handleMapClick"
      @ready="handleReady"
      @nearest-premium-change="handleNearestPremiumChange"
      @store-locator-click="handleStoreLocatorClick"
    />
  </div>
</template>

<style scoped>
.unified-map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-loading-overlay,
.map-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.map-error-overlay {
  color: #e74c3c;
}

.map-error-overlay button {
  margin-top: 16px;
  padding: 8px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}


</style>
