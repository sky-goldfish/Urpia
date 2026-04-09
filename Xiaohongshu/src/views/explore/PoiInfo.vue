<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { poiList } from '../../lib/mockData'

const route = useRoute()
const router = useRouter()

const poi = computed(() => poiList.find((item) => item.id === route.params.id) ?? poiList[0])

const backToMap = () => {
  void router.push('/map')
}

const goToDiscovery = () => {
  void router.push('/discovery')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col gap-5">
      <header class="flex items-center justify-between">
        <button
          type="button"
          class="glass-light flex items-center gap-1 rounded-full px-4 py-2 text-[14px] text-[#1D1D1F]"
          style="letter-spacing: -0.224px"
          @click="backToMap"
        >
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          地图
        </button>
        <span class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">POI 详情</span>
      </header>

      <section class="rounded-[28px] bg-[linear-gradient(180deg,#F2F2F7_0%,#ffffff_100%)] p-6 shadow-[rgba(0,0,0,0.18)_0px_22px_40px_0px]">
        <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">{{ poi?.district }} · {{ poi?.distance }}</p>
        <h1 class="mt-2 text-[30px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.6px">{{ poi?.name }}</h1>
        <p class="mt-2 text-[14px] text-[#1D1D1F]/72" style="letter-spacing: -0.224px">{{ poi?.vibe }}</p>

        <div class="mt-6 flex flex-wrap gap-2">
          <span v-for="tag in poi?.moods" :key="tag" class="pill-tag text-[12px]" style="letter-spacing: -0.12px">
            {{ tag }}
          </span>
        </div>
      </section>

      <section class="apple-card p-5">
        <h2 class="text-[17px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.374px">据点状态</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div class="rounded-[12px] bg-[#F2F2F7] p-4">
            <p class="text-[11px] text-[#8E8E93]" style="letter-spacing: -0.08px">当前氛围</p>
            <p class="mt-2 text-[17px] text-[#1D1D1F]" style="letter-spacing: -0.374px">{{ poi?.occupancy }}</p>
          </div>
          <div class="rounded-[12px] bg-[#F2F2F7] p-4">
            <p class="text-[11px] text-[#8E8E93]" style="letter-spacing: -0.08px">情绪提示</p>
            <p class="mt-2 text-[17px] text-[#1D1D1F]" style="letter-spacing: -0.374px">适合 20-40 分钟轻停留</p>
          </div>
        </div>
        <p class="mt-4 text-[14px] leading-6 text-[#1D1D1F]/76" style="letter-spacing: -0.224px">
          {{ poi?.note }}
        </p>
      </section>

      <section class="apple-card p-5">
        <h2 class="text-[17px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.374px">进入后的建议动作</h2>
        <ul class="mt-4 space-y-3 text-[14px] text-[#1D1D1F]/76" style="letter-spacing: -0.224px">
          <li>先点一份不需要即时决定的饮品，给自己预留观察时间。</li>
          <li>用一句描述当前天气的话作为社交开场，降低陌生感。</li>
          <li>如果状态稳定，可开启一次情绪盲盒掉落。</li>
        </ul>
      </section>

      <button
        type="button"
        class="primary-button mt-auto px-5 py-3 text-[17px] font-normal"
        style="letter-spacing: -0.374px; line-height: 2.41"
        @click="goToDiscovery"
      >
        开始盲盒掉落
      </button>
    </div>
  </main>
</template>
