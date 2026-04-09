<script setup lang="ts">
import { onMounted } from 'vue'
import OnboardingStepHeader from '../../components/ui/OnboardingStepHeader.vue'
import { generatingHints } from './onboarding.config'
import { useGeneratingProgress } from './useGeneratingProgress'

const { activeHint, progress } = useGeneratingProgress(generatingHints)

onMounted(() => {
  console.debug('[Generating] mounted', {
    activeHint: activeHint.value,
    progress: progress.value,
  })
})
</script>

<template>
  <main class="device-shell">
    <div class="page-padding flex min-h-[100dvh] flex-col justify-between">
      <OnboardingStepHeader :step="2" :total="4" title="Urpia 正在打开形象库" skip-label="" />

      <section class="flex flex-1 flex-col items-center justify-center gap-10">
        <div class="relative flex h-[180px] w-[220px] items-center justify-center">
          <div class="absolute h-[168px] w-[120px] rounded-[34px] border border-[#9B8EC4]/12 bg-white/40 shadow-[0_22px_46px_rgba(155,142,196,0.10)] blur-[1px]" />
          <div class="absolute -left-1 h-[134px] w-[94px] rounded-[30px] border border-[#9B8EC4]/14 bg-white/30" />
          <div class="absolute -right-1 h-[134px] w-[94px] rounded-[30px] border border-[#9B8EC4]/14 bg-white/30" />
          <div class="relative z-10 flex h-[152px] w-[108px] items-center justify-center rounded-[32px] border border-[#9B8EC4]/24 bg-white/85 shadow-[0_14px_34px_rgba(155,142,196,0.16)]">
            <div class="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.95),rgba(255,255,255,0)_62%)]" />
            <div class="absolute inset-0 rounded-[32px] border border-white/60" />
            <div class="relative h-16 w-16 rounded-full border-[3px] border-[#F2F2F7] border-t-[#1D1D1F] animate-[spin-smooth_1.2s_linear_infinite]" />
          </div>
        </div>

        <div class="space-y-3 text-center">
          <p class="text-[24px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.3px">正在准备你的初始分身</p>
          <p class="min-h-6 text-[14px] text-[#8E8E93] transition-opacity duration-300" style="letter-spacing: -0.224px">
            {{ activeHint }}
          </p>
        </div>
      </section>

      <footer class="space-y-4">
        <div class="h-1.5 overflow-hidden rounded-full bg-[#E5E5EA]">
          <div
            class="h-full rounded-full bg-[#1D1D1F] transition-[width] duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="flex items-center justify-between text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">
          <span>加载中</span>
          <span>{{ progress }}%</span>
        </div>
      </footer>
    </div>
  </main>
</template>
