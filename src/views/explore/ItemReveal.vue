<script setup lang="ts">
import { useRouter } from 'vue-router'
import { revealScene } from './revealFlow.config'
import RevealFlowLayout from './RevealFlowLayout.vue'

const router = useRouter()

const goToMatch = () => {
  void router.push('/match')
}

const backToMap = () => {
  void router.push('/map')
}
</script>

<template>
  <RevealFlowLayout
    :eyebrow="revealScene.eyebrow"
    :title="revealScene.title"
    page-class="gap-6 bg-[linear-gradient(180deg,#ffffff_0%,#F2F2F7_48%,#F7F7F8_100%)]"
  >
      <section class="relative flex flex-1 flex-col items-center justify-center gap-6">
        <div class="relative h-44 w-44 animate-float">
          <div class="absolute inset-x-0 bottom-0 h-28 rounded-[28px] bg-[linear-gradient(180deg,#F2F2F7_0%,#ffffff_100%)] shadow-[rgba(0,0,0,0.2)_0px_22px_48px_0px]" />
          <div class="animate-lid absolute inset-x-2 top-6 h-16 rounded-[22px] bg-white shadow-[rgba(0,0,0,0.1)_0px_8px_20px_0px]" />
          <div class="animate-glow absolute inset-x-10 top-0 rounded-[24px] bg-white/84 p-5 text-center shadow-[rgba(0,0,0,0.14)_0px_18px_40px_0px]">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#9B8EC4]/10 text-[#9B8EC4]">
              <span class="material-symbols-outlined text-[30px]">{{ revealScene.heroIcon }}</span>
            </div>
            <p class="mt-3 text-[17px] text-[#1D1D1F]" style="letter-spacing: -0.374px">{{ revealScene.itemTitle }}</p>
            <p class="mt-2 text-[11px] text-[#8E8E93]" style="letter-spacing: -0.08px">{{ revealScene.itemSubtitle }}</p>
          </div>
        </div>
      </section>

      <section class="apple-card space-y-4 p-5">
        <div>
          <h2 class="text-[17px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.374px">{{ revealScene.tipsTitle }}</h2>
          <p class="mt-3 text-[14px] leading-6 text-[#1D1D1F]/76" style="letter-spacing: -0.224px">
            {{ revealScene.tipsDescription }}
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="secondary-button px-4 py-3 text-[17px]"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="backToMap"
          >
            {{ revealScene.secondaryAction }}
          </button>
          <button
            type="button"
            class="primary-button px-4 py-3 text-[17px]"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="goToMatch"
          >
            {{ revealScene.primaryAction }}
          </button>
        </div>
      </section>
  </RevealFlowLayout>
</template>
