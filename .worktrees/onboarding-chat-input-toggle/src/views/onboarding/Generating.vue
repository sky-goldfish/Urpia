<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const hints = ['正在校准情绪频率', '匹配附近可进入据点', '生成你的社交缓冲区', '构建分身开场白']
const hintIndex = ref(0)
const progress = ref(12)

let hintTimer: number | undefined
let progressTimer: number | undefined
let redirectTimer: number | undefined

const activeHint = computed(() => hints[hintIndex.value] ?? hints[0])

onMounted(() => {
  hintTimer = window.setInterval(() => {
    hintIndex.value = (hintIndex.value + 1) % hints.length
  }, 1400)

  progressTimer = window.setInterval(() => {
    progress.value = Math.min(progress.value + 4, 100)

    if (progress.value >= 100) {
      if (progressTimer) {
        window.clearInterval(progressTimer)
      }

      redirectTimer = window.setTimeout(() => {
        void router.push('/onboarding/confirm')
      }, 420)
    }
  }, 180)
})

onUnmounted(() => {
  if (hintTimer) {
    window.clearInterval(hintTimer)
  }

  if (progressTimer) {
    window.clearInterval(progressTimer)
  }

  if (redirectTimer) {
    window.clearTimeout(redirectTimer)
  }
})
</script>

<template>
  <main class="device-shell">
    <div class="page-padding flex min-h-[100dvh] flex-col justify-between">
      <header class="pt-6">
        <p class="text-center text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">Zoopia 正在为你创造分身</p>
      </header>

      <section class="flex flex-1 flex-col items-center justify-center gap-10">
        <!-- 旋转加载 -->
        <div class="relative flex h-28 w-28 items-center justify-center">
          <div class="absolute inset-0 rounded-full border border-[#E5E5EA]" />
          <div class="absolute inset-[14px] rounded-full border border-[#E5E5EA]" />
          <div class="h-20 w-20 rounded-full border-[3px] border-[#F2F2F7] border-t-[#1D1D1F] animate-[spin-smooth_1.2s_linear_infinite]" />
          <div class="absolute h-3 w-3 rounded-full bg-[#1D1D1F]" />
        </div>

        <div class="space-y-3 text-center">
          <p class="text-[21px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.3px">正在生成你的分身</p>
          <p class="min-h-6 text-[14px] text-[#8E8E93] transition-opacity duration-300" style="letter-spacing: -0.224px">
            {{ activeHint }}
          </p>
        </div>
      </section>

      <footer class="space-y-4">
        <!-- 进度条 -->
        <div class="h-1.5 overflow-hidden rounded-full bg-[#E5E5EA]">
          <div
            class="h-full rounded-full bg-[#1D1D1F] transition-[width] duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="flex items-center justify-between text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">
          <span>解析中</span>
          <span>{{ progress }}%</span>
        </div>
      </footer>
    </div>
  </main>
</template>
