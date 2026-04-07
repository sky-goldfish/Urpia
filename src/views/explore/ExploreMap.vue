<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { poiList } from '../../lib/mockData'

const router = useRouter()

const openPoi = (id: string) => {
  void router.push(`/poi/${id}`)
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col gap-5">
      <header class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">LBS 探索</p>
            <h1 class="mt-1 text-[30px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.6px">靠近你的情绪热区</h1>
          </div>
          <button type="button" class="glass-light flex h-11 w-11 items-center justify-center rounded-full text-[#1d1d1f]">
            <span class="material-symbols-outlined text-[21px]">near_me</span>
          </button>
        </div>

        <label class="glass-light flex items-center gap-3 rounded-[16px] px-4 py-3">
          <span class="material-symbols-outlined text-[20px] text-[#86868b]">search</span>
          <input
            type="text"
            class="w-full bg-transparent text-[17px] text-[#1d1d1f] outline-none"
            style="letter-spacing: -0.374px"
            placeholder="搜索据点、气氛或情绪关键词"
          />
        </label>
      </header>

      <section class="map-grid map-road relative flex-1 overflow-hidden rounded-[32px] shadow-[rgba(0,0,0,0.12)_0px_20px_50px_0px]">
        <div class="absolute left-4 top-4 rounded-full bg-white/82 px-3 py-2 text-[11px] text-[#1d1d1f]" style="letter-spacing: -0.08px">
          当前城市 · 上海
        </div>

        <button
          v-for="poi in poiList"
          :key="poi.id"
          type="button"
          class="absolute -translate-x-1/2 -translate-y-1/2 text-left"
          :style="{ top: poi.top, left: poi.left }"
          :aria-label="`查看 ${poi.name}`"
          @click="openPoi(poi.id)"
        >
          <div class="relative flex flex-col items-center gap-2">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[rgba(0,0,0,0.2)_0px_12px_28px_0px]">
              <span class="material-symbols-outlined text-[24px] text-[#0071e3]">location_on</span>
            </div>
            <div class="min-w-[120px] rounded-[16px] bg-white/88 px-3 py-2 shadow-[rgba(0,0,0,0.12)_0px_10px_20px_0px]">
              <p class="text-[12px] text-[#1d1d1f]" style="letter-spacing: -0.12px">{{ poi.name }}</p>
              <p class="mt-1 text-[11px] text-[#86868b]" style="letter-spacing: -0.08px">{{ poi.vibe }} · {{ poi.distance }}</p>
            </div>
          </div>
        </button>

        <div class="absolute inset-x-4 bottom-4 apple-card p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">实时建议</p>
              <h2 class="mt-1 text-[17px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.374px">
                从 Harbor Light 开始，拥挤度最低
              </h2>
              <p class="mt-2 text-[14px] leading-6 text-[#1d1d1f]/72" style="letter-spacing: -0.224px">
                先进入低刺激场域，更利于你当前的情绪安全感建立。
              </p>
            </div>
            <button
              type="button"
              class="primary-button h-11 shrink-0 px-4 text-[17px]"
              style="letter-spacing: -0.374px; line-height: 2.41"
              @click="openPoi('harbor-light')"
            >
              前往
            </button>
          </div>
        </div>
      </section>
    </div>

    <TabBar />
  </main>
</template>
