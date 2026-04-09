<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'

const router = useRouter()

const goToMatch = () => {
  void router.push('/match')
}

const backToMap = () => {
  void router.push('/map')
}
</script>

<template>
  <main class="device-shell overflow-hidden">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col gap-6 bg-[linear-gradient(180deg,#ffffff_0%,#F2F2F7_48%,#F7F7F8_100%)]">
      <header class="space-y-2">
        <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">物品揭示</p>
        <h1 class="text-[30px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.6px">你的今日盲盒已开启</h1>
      </header>

      <section class="relative flex flex-1 flex-col items-center justify-center gap-6">
        <div class="relative h-44 w-44 animate-float">
          <div class="absolute inset-x-0 bottom-0 h-28 rounded-[28px] bg-[linear-gradient(180deg,#F2F2F7_0%,#ffffff_100%)] shadow-[rgba(0,0,0,0.2)_0px_22px_48px_0px]" />
          <div class="animate-lid absolute inset-x-2 top-6 h-16 rounded-[22px] bg-white shadow-[rgba(0,0,0,0.1)_0px_8px_20px_0px]" />
          <div class="animate-glow absolute inset-x-10 top-0 rounded-[24px] bg-white/84 p-5 text-center shadow-[rgba(0,0,0,0.14)_0px_18px_40px_0px]">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#9B8EC4]/10 text-[#9B8EC4]">
              <span class="material-symbols-outlined text-[30px]">music_note</span>
            </div>
            <p class="mt-3 text-[17px] text-[#1D1D1F]" style="letter-spacing: -0.374px">《情绪天气》话题卡</p>
            <p class="mt-2 text-[11px] text-[#8E8E93]" style="letter-spacing: -0.08px">适配 Harbor Light · 低压开场</p>
          </div>
        </div>
      </section>

      <section class="apple-card space-y-4 p-5">
        <div>
          <h2 class="text-[17px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.374px">推荐使用方式</h2>
          <p class="mt-3 text-[14px] leading-6 text-[#1D1D1F]/76" style="letter-spacing: -0.224px">
            用一句“如果把你今天的情绪比作天气，会是什么？”作为开场。它能减少直接自我介绍的生硬感。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="secondary-button px-4 py-3 text-[17px]"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="backToMap"
          >
            继续探索
          </button>
          <button
            type="button"
            class="primary-button px-4 py-3 text-[17px]"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="goToMatch"
          >
            发起匹配
          </button>
        </div>
      </section>
    </div>

    <TabBar />
  </main>
</template>
