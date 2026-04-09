<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import MapContainer from '../../components/map/MapContainer.vue'
import TabBar from '../../components/ui/TabBar.vue'

const router = useRouter()
const mapRef = ref<InstanceType<typeof MapContainer> | null>(null)

// 示例标记点数据（上海的一些地点）
const markers = ref([
  {
    id: '1',
    position: [121.4737, 31.2304] as [number, number],
    title: '人民广场',
    color: '#FF2442',
    data: { type: 'landmark', name: '人民广场' },
  },
  {
    id: '2',
    position: [121.4878, 31.2356] as [number, number],
    title: '外滩',
    color: '#E8A44A',
    data: { type: 'landmark', name: '外滩' },
  },
  {
    id: '3',
    position: [121.4453, 31.2165] as [number, number],
    title: '静安寺',
    color: '#6BBFA3',
    data: { type: 'landmark', name: '静安寺' },
  },
])

// 标记点点击事件
const handleMarkerClick = (marker: any) => {
  console.log('点击了标记点:', marker)
}

// 地图点击事件
const handleMapClick = (position: { lng: number; lat: number }) => {
  console.log('地图点击位置:', position)
}

// 地图准备就绪
const handleMapReady = (_map: any) => {
  console.log('Mapbox 地图已就绪')
}

// 进入探索流程
const enterExplore = () => {
  router.push('/map')
}

// 定位到当前位置
const locateCurrentPosition = () => {
  mapRef.value?.flyTo({
    center: [121.4737, 31.2304],
    zoom: 15,
  })
}
</script>

<template>
  <main class="device-shell" style="overflow: visible;">
    <div class="relative h-[100dvh] w-full overflow-hidden">
      <!-- Mapbox 地图容器 -->
      <MapContainer
        ref="mapRef"
        class="absolute inset-0 z-0"
        :markers="markers"
        :zoom="13"
        @marker-click="handleMarkerClick"
        @map-click="handleMapClick"
        @ready="handleMapReady"
      />

      <!-- 顶部标题栏 -->
      <div class="absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-black/30 to-transparent px-4 pb-8 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div class="flex items-center justify-between">
          <h1 class="text-[18px] font-semibold text-white" style="letter-spacing: -0.5px; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
            探索周边
          </h1>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
            @click="locateCurrentPosition"
          >
            <span class="material-symbols-outlined text-[18px] text-[#1D1D1F]">my_location</span>
          </button>
        </div>
      </div>

      <!-- 底部操作区域 -->
      <div class="absolute bottom-[calc(72px+env(safe-area-inset-bottom)+16px)] left-4 right-4 z-20">
        <div class="rounded-[20px] bg-white/95 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)] backdrop-blur-md">
          <div class="mb-3 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF2442]/10">
              <span class="material-symbols-outlined text-[20px] text-[#FF2442]">explore</span>
            </div>
            <div class="flex-1">
              <h2 class="text-[16px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.3px;">发现精彩</h2>
              <p class="text-[13px] text-[#666]" style="letter-spacing: -0.2px;">探索周边的有趣地点</p>
            </div>
          </div>

          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#FF2442] py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(255,36,66,0.3)] transition-all active:scale-[0.98] active:bg-[#E02040]"
            @click="enterExplore"
          >
            <span>开始探索</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
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
</style>
