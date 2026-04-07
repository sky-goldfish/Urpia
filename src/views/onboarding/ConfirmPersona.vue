<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const nickname = ref('')
const isSpinning = ref(false)

const handleConfirm = () => {
  if (nickname.value.trim()) {
    void router.push('/map')
  }
}

const handleRegenerate = () => {
  isSpinning.value = true
  setTimeout(() => {
    isSpinning.value = false
  }, 1200)
}
</script>

<template>
  <main class="device-shell">
    <div class="flex min-h-[100dvh] flex-col">
      <!-- 3D 分身展示区 -->
      <section class="relative flex flex-1 flex-col items-center justify-end overflow-hidden pb-4">
        <!-- 背景光晕 -->
        <div class="absolute top-[10%] left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full bg-[#0071e3]/5 blur-3xl" aria-hidden="true" />

        <!-- 可旋转的 3D 形象 -->
        <div
          class="relative z-10 mb-[-20px]"
          :class="isSpinning ? 'animate-[spin-3d_1.2s_ease-in-out]' : ''"
          style="perspective: 800px;"
        >
          <div class="relative flex h-[180px] w-[180px] items-center justify-center">
            <!-- 中心形象 -->
            <div class="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed] shadow-[rgba(0,0,0,0.08)_0_4px_16px_0px]">
              <span
                class="material-symbols-outlined text-[48px] text-[#86868b]/50"
                style="font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48"
              >smart_toy</span>
            </div>
          </div>
        </div>

        <!-- 圆台 -->
        <div class="relative z-20 flex flex-col items-center">
          <!-- 台底光晕 -->
          <div class="absolute -bottom-3 h-[20px] w-[240px] rounded-full bg-[#0071e3]/[0.06] blur-xl" aria-hidden="true" />
          <!-- 台体侧面（多层营造厚度） -->
          <div class="w-[300px] h-[22px] rounded-[50%] bg-gradient-to-b from-[#dcdce1] via-[#d2d2d7] to-[#c7c7cc]" />
          <div class="-mt-[4px] w-[300px] h-[18px] rounded-[50%] bg-gradient-to-b from-[#e8e8ed] to-[#dcdce1]" />
          <!-- 台面 -->
          <div class="-mt-[4px] w-[300px] h-[32px] rounded-[50%] bg-gradient-to-b from-[#f5f5f7] via-[#ebebed] to-[#e3e3e8] shadow-[rgba(0,0,0,0.06)_0_1px_4px_0px,rgba(0,0,0,0.03)_0_8px_24px_0px]" />
          <!-- 台面边缘细线 -->
          <div class="absolute top-[36px] w-[300px] h-[32px] rounded-[50%] border border-[#d2d2d7]/40" />
          <!-- 台面顶部高光 -->
          <div class="absolute top-[40px] left-[15%] h-[4px] w-[70%] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <!-- 台面内圈装饰线 -->
          <div class="absolute top-[50px] left-[20%] h-[2px] w-[60%] rounded-full bg-gradient-to-r from-transparent via-[#0071e3]/10 to-transparent" />
        </div>
      </section>

      <!-- 底部输入区域 -->
      <section class="px-6 pb-[calc(env(safe-area-inset-bottom)+32px)] space-y-4">
        <label class="block">
          <span class="mb-2 block text-[12px] text-[#86868b] uppercase" style="letter-spacing: -0.08px">
            给你的分身起个名字
          </span>
          <div class="relative">
            <input
              v-model="nickname"
              type="text"
              class="input-shell w-full px-4 py-4 pr-16 text-[17px]"
              style="letter-spacing: -0.374px"
              maxlength="12"
              placeholder="输入昵称..."
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">
              {{ nickname.length }}/12
            </span>
          </div>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="secondary-button px-4 py-3 text-[17px] font-normal"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="handleRegenerate"
          >
            重新生成
          </button>
          <button
            type="button"
            class="primary-button px-4 py-3 text-[17px] font-normal disabled:opacity-40"
            style="letter-spacing: -0.374px; line-height: 2.41"
            :disabled="!nickname.trim()"
            @click="handleConfirm"
          >
            确认并继续
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
@keyframes spin-3d {
  0% { transform: rotateY(0deg) scale(1); }
  50% { transform: rotateY(180deg) scale(0.95); }
  100% { transform: rotateY(360deg) scale(1); }
}
</style>
