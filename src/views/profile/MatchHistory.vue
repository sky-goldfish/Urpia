<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { matchHistory } from '../../lib/mockData'

const router = useRouter()

const goToReport = () => {
  void router.push('/report')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col gap-5">
      <header class="space-y-2">
        <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">历史记录</p>
        <h1 class="text-[30px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.6px">你曾经靠近过的人</h1>
      </header>

      <section class="flex flex-1 flex-col gap-4">
        <article v-for="record in matchHistory" :key="record.id" class="apple-card p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">{{ record.lastSeen }} · {{ record.status }}</p>
              <h2 class="mt-2 text-[17px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.374px">
                {{ record.alias }} · {{ record.persona }}
              </h2>
            </div>
            <div class="rounded-full bg-[#0071e3]/8 px-3 py-2 text-[12px] text-[#0071e3]" style="letter-spacing: -0.12px">
              {{ record.compatibility }}%
            </div>
          </div>
          <p class="mt-3 text-[14px] leading-6 text-[#1d1d1f]/76" style="letter-spacing: -0.224px">
            {{ record.highlight }}
          </p>
        </article>
      </section>

      <button
        type="button"
        class="secondary-button mt-auto px-5 py-3 text-[17px]"
        style="letter-spacing: -0.374px; line-height: 2.41"
        @click="goToReport"
      >
        查看最近一次报告
      </button>
    </div>

    <TabBar />
  </main>
</template>
