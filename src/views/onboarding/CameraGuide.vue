<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const startCapture = () => {
  void router.push('/onboarding/generating')
}

const skipToConfirm = () => {
  void router.push('/onboarding/confirm')
}
</script>

<template>
  <main class="device-shell bg-[#000] text-white">
    <div class="page-padding flex min-h-[100dvh] flex-col">
      <header class="glass-dark flex items-center justify-between rounded-[12px] px-4 py-3">
        <button type="button" class="text-[14px] text-white/84" style="letter-spacing: -0.224px" @click="skipToConfirm">
          跳过
        </button>
        <div class="text-center">
          <p class="text-[11px] text-white/56" style="letter-spacing: -0.08px">Zoopia 入场识别</p>
          <p class="text-[14px] text-white" style="letter-spacing: -0.224px">请拍摄一张完整全身照</p>
        </div>
        <span class="text-[14px] text-white/72" style="letter-spacing: -0.224px">1 / 4</span>
      </header>

      <section class="flex flex-1 flex-col items-center justify-center gap-10">
        <div class="relative">
          <div class="absolute inset-0 rounded-[28px] bg-white/10 blur-3xl" aria-hidden="true" />
          <div class="relative h-[280px] w-[180px] rounded-[32px] border border-white/28 bg-white/6">
            <div class="absolute left-4 top-4 h-8 w-8 rounded-tl-[20px] border-l-2 border-t-2 border-white/80" />
            <div class="absolute right-4 top-4 h-8 w-8 rounded-tr-[20px] border-r-2 border-t-2 border-white/80" />
            <div class="absolute bottom-4 left-4 h-8 w-8 rounded-bl-[20px] border-b-2 border-l-2 border-white/80" />
            <div class="absolute bottom-4 right-4 h-8 w-8 rounded-br-[20px] border-b-2 border-r-2 border-white/80" />
            <div class="absolute inset-x-0 top-[18%] mx-auto h-[164px] w-[82px] rounded-[44px] border border-dashed border-white/36" />
            <div class="absolute inset-x-0 top-[13%] mx-auto h-10 w-10 rounded-full border border-white/36" />
          </div>
        </div>

        <div class="max-w-[280px] text-center">
          <p class="text-[21px] font-normal text-white" style="letter-spacing: 0.231px">让分身先看见你</p>
          <p class="mt-3 text-[14px] leading-6 text-white/64" style="letter-spacing: -0.224px">
            请站在柔和光线下，保持全身入框。Zoopia 只提取气质向量，不保留原始照片。
          </p>
        </div>
      </section>

      <footer class="flex flex-col items-center gap-5 pb-4">
        <button
          type="button"
          class="flex h-[74px] w-[74px] items-center justify-center rounded-full border border-white/16 bg-[#0071e3] shadow-[0_18px_40px_rgba(0,113,227,0.35)]"
          aria-label="开始拍摄"
          @click="startCapture"
        >
          <span class="h-[58px] w-[58px] rounded-full border border-white/46 bg-white/12" />
        </button>
        <div class="flex items-center gap-2 text-[12px] text-white/56" style="letter-spacing: -0.12px">
          <span class="material-symbols-outlined text-[16px]">lock</span>
          你的镜头数据只用于生成初始情绪分身
        </div>
      </footer>
    </div>
  </main>
</template>
