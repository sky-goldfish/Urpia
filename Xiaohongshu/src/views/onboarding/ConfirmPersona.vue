<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const avatarUrl = ref('/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg')
const avatarIndex = ref(0)

const avatarOptions = [
  '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg',
  '/avatars/404b0503-83e0-45a3-8a03-9c222e2bdc32.jpg',
  '/avatars/88a1e9e7-378f-4108-b288-c713865a7b03.jpg',
  '/avatars/012fe965-2bf7-4b71-8c21-347f0999ef33.jpg',
] as const

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
    avatarIndex.value = (avatarIndex.value + 1) % avatarOptions.length
    avatarUrl.value = avatarOptions[avatarIndex.value] ?? '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg'
    isSpinning.value = false
  }, 1200)
}
</script>

<template>
  <main class="device-shell">
    <div class="flex min-h-[100dvh] flex-col">
      <!-- 3D 分身展示区 -->
      <section class="relative flex flex-1 flex-col items-center justify-end overflow-hidden pb-4">
        <!-- 页面标题 -->
        <h1 class="relative z-10 mb-6 text-[22px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.4px">
          分身已就绪
        </h1>

        <!-- 背景光晕 -->
        <div class="absolute top-[15%] left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full bg-[#9B8EC4]/5 blur-3xl" aria-hidden="true" />

        <!-- 可旋转的 3D 形象 -->
        <div
          class="relative z-10 mb-[-20px]"
          :class="isSpinning ? 'animate-[spin-3d_1.2s_ease-in-out]' : ''"
          style="perspective: 800px;"
        >
          <div class="relative flex h-[220px] w-[180px] items-end justify-center">
            <!-- 人物形象（完整立绘） -->
            <img
              :src="avatarUrl"
              alt="分身形象"
              class="h-full w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
            />
          </div>
        </div>

        <!-- 圆台 -->
        <div class="relative z-20 flex flex-col items-center">
          <!-- 台底光晕 -->
          <div class="absolute -bottom-3 h-[20px] w-[240px] rounded-full bg-[#9B8EC4]/[0.06] blur-xl" aria-hidden="true" />
          <!-- 台体侧面（多层营造厚度） -->
          <div class="w-[300px] h-[22px] rounded-[50%] bg-gradient-to-b from-[#dcdce1] via-[#d2d2d7] to-[#c7c7cc]" />
          <div class="-mt-[4px] w-[300px] h-[18px] rounded-[50%] bg-gradient-to-b from-[#E5E5EA] to-[#dcdce1]" />
          <!-- 台面 -->
          <div class="-mt-[4px] w-[300px] h-[32px] rounded-[50%] bg-gradient-to-b from-[#F2F2F7] via-[#ebebed] to-[#e3e3e8] shadow-[rgba(0,0,0,0.06)_0_1px_4px_0px,rgba(0,0,0,0.03)_0_8px_24px_0px]" />
          <!-- 台面边缘细线 -->
          <div class="absolute top-[36px] w-[300px] h-[32px] rounded-[50%] border border-[#d2d2d7]/40" />
          <!-- 台面顶部高光 -->
          <div class="absolute top-[40px] left-[15%] h-[4px] w-[70%] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <!-- 台面内圈装饰线 -->
          <div class="absolute top-[50px] left-[20%] h-[2px] w-[60%] rounded-full bg-gradient-to-r from-transparent via-[#9B8EC4]/10 to-transparent" />
        </div>
      </section>

      <!-- 底部输入区域 -->
      <section class="px-6 pb-[calc(env(safe-area-inset-bottom)+32px)] space-y-4">
        <label class="block">
          <span class="mb-2 block text-[12px] font-medium text-[#8E8E93] uppercase" style="letter-spacing: 1px">
            NICKNAME
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
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">
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

        <!-- 底部提示 -->
        <p class="text-center text-[12px] text-[#8E8E93]">
          分身将在地图上代替你探索城市
        </p>
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
