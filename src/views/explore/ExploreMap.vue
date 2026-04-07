<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { poiList } from '../../lib/mockData'

const router = useRouter()
const showSearch = ref(false)
const searchQuery = ref('')
const activeMood = ref<string | null>(null)
const showFilter = ref(false)

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
</script>

<template>
  <main class="device-shell">
    <!-- v4 主地图页：全屏地图 + 悬浮控件 -->
    <div class="relative h-[100dvh] w-full">
      <!-- 地图区域（浅色干净模拟） -->
      <div class="map-grid map-road absolute inset-0" />

      <!-- 用户头像（地图中央） -->
      <div class="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div class="flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7] shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
          <span class="material-symbols-outlined text-[14px] text-[#6C6C6C]">person</span>
        </div>
      </div>

      <!-- POI 情绪标记点 -->
      <button
        v-for="poi in poiList"
        :key="poi.id"
        type="button"
        class="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        :style="{ top: poi.top, left: poi.left }"
        :aria-label="`查看 ${poi.name}`"
        @click="openPoi(poi.id)"
      >
        <div
          class="h-3 w-3 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
          :style="{ backgroundColor: getPoiColor(poi.id) }"
        />
      </button>

      <!-- v4 顶部悬浮区域 -->
      <div class="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-20 flex flex-col gap-2">
        <!-- 搜索按钮 -->
        <div class="flex items-center">
          <input
            v-if="showSearch"
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="h-9 w-[60%] rounded-[18px] bg-white px-3 text-[14px] text-[#1D1D1f] shadow-[0_1px_3px_rgba(0,0,0,0.06)] outline-none"
            style="letter-spacing: -0.224px"
            placeholder="搜索..."
          />
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            @click="showSearch = !showSearch"
          >
            <span class="material-symbols-outlined text-[18px] text-[#6C6C6C]">
              {{ showSearch ? 'close' : 'search' }}
            </span>
          </button>
        </div>

        <!-- 筛选按钮 -->
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          @click="showFilter = !showFilter"
        >
          <span class="material-symbols-outlined text-[18px] text-[#6C6C6C]">palette</span>
        </button>

        <!-- 情绪筛选下拉 -->
        <div
          v-if="showFilter"
          class="flex gap-2 rounded-[12px] bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
          <button
            v-for="mood in moodFilters"
            :key="mood.key"
            type="button"
            class="h-5 w-5 rounded-full transition-all duration-200"
            :class="activeMood === mood.key ? 'ring-2 ring-[#1D1D1F] ring-offset-1' : ''"
            :style="{ backgroundColor: mood.color }"
            :aria-label="mood.label"
            @click="toggleMood(mood.key)"
          />
        </div>
      </div>

      <!-- 左上角定位按钮 -->
      <button
        type="button"
        class="absolute left-4 top-[calc(env(safe-area-inset-top)+16px)] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      >
        <span class="material-symbols-outlined text-[18px] text-[#6C6C6C]">my_location</span>
      </button>

      <!-- 底部导航栏 -->
      <TabBar />
    </div>
  </main>
</template>
