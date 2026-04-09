<script setup lang="ts">
import TabBar from '../../components/ui/TabBar.vue'
import MapContainer from '../../components/map/MapContainer.vue'
import MoodColorSelector from '../../components/ui/MoodColorSelector.vue'
import SocialMatchChat from '../social/SocialMatchChat.vue'
import { useExploreMap } from './useExploreMap'

const {
  mapRef,
  searchQuery,
  selectedPoi,
  filteredPois,
  markers,
  showSearch,
  showMatchChat,
  activeMood,
  moodOptions,
  setActiveMood,
  toggleSearch,
  handleMarkerClick,
  locateUser,
  selectPoi,
  goToPoi,
  openMatchChat,
  closeMatchChat,
} = useExploreMap()
</script>

<template>
  <main class="device-shell overflow-visible">
    <div class="relative h-[100dvh] w-full overflow-hidden">
      <MapContainer
        ref="mapRef"
        class="absolute inset-0 z-0"
        :markers="markers"
        :zoom="14"
        @marker-click="handleMarkerClick"
      />

      <div class="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-white/90 via-white/45 to-transparent px-4 pb-10 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div class="pointer-events-auto flex items-start justify-between gap-3">
          <div class="max-w-[220px]">
            <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Explore</p>
            <h1 class="mt-1 text-[24px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.5px;">城市情绪地图</h1>
            <p class="mt-1 text-[13px] leading-5 text-[#6C6C6C]">把地图、情绪筛选和据点卡片收在一页里，减少跳转和重复状态。</p>
          </div>
          <div class="flex items-start gap-3">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full bg-white/92 shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
              @click="locateUser"
            >
              <span class="material-symbols-outlined text-[20px] text-[#6C6C6C]">my_location</span>
            </button>
            <MoodColorSelector />
          </div>
        </div>
      </div>

      <div class="absolute right-4 top-[calc(env(safe-area-inset-top)+92px)] z-20 flex flex-col gap-3">
        <div class="relative">
          <input
            v-if="showSearch"
            v-model="searchQuery"
            type="text"
            class="absolute right-14 top-1/2 z-30 h-11 w-60 -translate-y-1/2 rounded-[20px] border border-[#E5E5EA] bg-white px-4 text-[14px] text-[#1D1D1F] shadow-[0_6px_18px_rgba(0,0,0,0.08)] outline-none"
            style="letter-spacing: -0.224px"
            placeholder="搜索地点、氛围或区域"
          />
          <button
            type="button"
            class="relative z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
            @click="toggleSearch"
          >
            <span class="material-symbols-outlined text-[18px] text-[#6C6C6C]">
              {{ showSearch ? 'close' : 'search' }}
            </span>
          </button>
        </div>
      </div>

      <div class="absolute inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom)+16px)] z-20 space-y-3">
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="mood in moodOptions"
            :key="mood.key"
            type="button"
            class="shrink-0 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors"
            :class="activeMood === mood.key ? 'border-transparent text-white' : 'border-[#E5E5EA] bg-white/92 text-[#6C6C6C]'"
            :style="activeMood === mood.key ? { backgroundColor: mood.color } : undefined"
            @click="setActiveMood(mood.key)"
          >
            {{ mood.label }}
          </button>
        </div>

        <div class="rounded-[24px] border border-[#E5E5EA] bg-white/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Nearby Spot</p>
              <h2 class="mt-1 truncate text-[18px] font-semibold text-[#1D1D1F]">{{ selectedPoi?.name ?? '暂无匹配据点' }}</h2>
              <p class="mt-1 text-[13px] text-[#6C6C6C]">
                {{ selectedPoi?.district }} · {{ selectedPoi?.distance }} · {{ selectedPoi?.occupancy }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-full border border-[#E5E5EA] px-3 py-1.5 text-[12px] font-medium text-[#1D1D1F]"
              @click="goToPoi"
            >
              查看
            </button>
          </div>

          <p class="mt-3 text-[14px] leading-6 text-[#4A4A4A]">
            {{ selectedPoi?.note ?? '先从筛选或搜索开始，选一个适合当前状态的地点。' }}
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="poi in filteredPois"
              :key="poi.id"
              type="button"
              class="rounded-full px-3 py-2 text-[12px] transition-colors"
              :class="selectedPoi?.id === poi.id ? 'bg-[#1D1D1F] text-white' : 'bg-[#F2F2F7] text-[#6C6C6C]'"
              @click="selectPoi(poi.id)"
            >
              {{ poi.name }}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="absolute right-4 bottom-[calc(182px+env(safe-area-inset-bottom)+12px)] z-20 flex h-12 items-center gap-2 rounded-full bg-[#1D1D1F] pl-4 pr-5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-transform active:scale-95"
        @click="openMatchChat"
      >
        <span class="material-symbols-outlined text-[18px] text-white">forum</span>
        <span class="text-[13px] font-medium text-white" style="letter-spacing: -0.224px">开始社交</span>
      </button>

      <SocialMatchChat :visible="showMatchChat" @close="closeMatchChat" />

      <TabBar />
    </div>
  </main>
</template>

<style scoped>
:deep(.device-shell) {
  overflow: visible;
}
</style>
