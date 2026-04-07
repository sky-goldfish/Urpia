<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const startCapture = () => {
  void router.push('/onboarding/chat')
}

const skipToConfirm = () => {
  void router.push('/onboarding/chat')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding flex min-h-[100dvh] flex-col">
      <!-- 白色导航头 -->
      <header class="flex items-center justify-between rounded-[12px] px-4 py-3">
        <button type="button" class="text-[14px] text-[#86868b]" style="letter-spacing: -0.224px" @click="skipToConfirm">
          跳过
        </button>
        <div class="text-center">
          <p class="text-[11px] text-[#86868b]" style="letter-spacing: -0.08px">Zoopia 入场识别</p>
          <p class="text-[14px] text-[#1d1d1f]" style="letter-spacing: -0.224px">请拍摄一张完整全身照</p>
        </div>
        <span class="text-[14px] text-[#86868b]" style="letter-spacing: -0.224px">1 / 4</span>
      </header>

      <section class="flex flex-1 flex-col items-center justify-center gap-10">
        <div class="relative">
          <!-- 柔和背景光晕 -->
          <div class="absolute inset-0 rounded-[28px] bg-[#0071e3]/10 blur-3xl" aria-hidden="true" />
          <!-- 取景框 -->
          <div class="relative h-[280px] w-[180px] rounded-[32px] bg-[#f5f5f7] shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px]">
            <!-- 四角取景线 -->
            <div class="absolute left-4 top-4 h-8 w-8 rounded-tl-[20px] border-l-2 border-t-2 border-[#0071e3]/60" />
            <div class="absolute right-4 top-4 h-8 w-8 rounded-tr-[20px] border-r-2 border-t-2 border-[#0071e3]/60" />
            <div class="absolute bottom-4 left-4 h-8 w-8 rounded-bl-[20px] border-b-2 border-l-2 border-[#0071e3]/60" />
            <div class="absolute bottom-4 right-4 h-8 w-8 rounded-br-[20px] border-b-2 border-r-2 border-[#0071e3]/60" />
            <!-- 人形轮廓 -->
            <div class="absolute inset-x-0 top-[18%] mx-auto h-[164px] w-[82px] rounded-[44px] border border-dashed border-[#86868b]/36" />
            <div class="absolute inset-x-0 top-[13%] mx-auto h-10 w-10 rounded-full border border-[#86868b]/36" />
            <!-- 中心图标 -->
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="material-symbols-outlined text-[48px] text-[#86868b]/30">person</span>
            </div>
          </div>
        </div>

        <div class="max-w-[280px] text-center">
          <p class="text-[21px] font-normal text-[#1d1d1f]" style="letter-spacing: 0.231px">让分身先看见你</p>
          <p class="mt-3 text-[14px] leading-6 text-[#86868b]" style="letter-spacing: -0.224px">
            请站在柔和光线下，保持全身入框。Zoopia 只提取气质向量，不保留原始照片。
          </p>
        </div>
      </section>

      <footer class="flex flex-col items-center gap-5 pb-4">
        <!-- 快门按钮 -->
        <button
          type="button"
          class="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-[#0071e3] shadow-[0_18px_40px_rgba(0,113,227,0.35)] active:scale-90 transition-transform"
          aria-label="开始拍摄"
          @click="startCapture"
        >
          <span class="material-symbols-outlined text-white text-[28px]">photo_camera</span>
        </button>
        <div class="flex items-center gap-2 text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">
          <span class="material-symbols-outlined text-[16px]">lock</span>
          你的镜头数据只用于生成初始情绪分身
        </div>
      </footer>
    </div>
  </main>
</template>
