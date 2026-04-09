<script setup lang="ts">
import { useRouter } from 'vue-router'
import { reportTopics } from '../../lib/mockData'

const router = useRouter()
const compatibility = 87

const goToMap = () => {
  void router.push('/map')
}

const compatibilityLabel = () => {
  if (compatibility >= 80) return { text: '命中注定的相遇', color: '#34C759' }
  if (compatibility >= 60) return { text: '有趣的灵魂', color: '#E8A44A' }
  return { text: '也许下次会更好', color: '#8E8E93' }
}

const vibeResult = { text: '很合拍', color: '#34C759' }
</script>

<template>
  <main class="device-shell">
    <div class="flex min-h-[100dvh] flex-col bg-[#F7F7F8]">
      <!-- v4 顶部导航栏 -->
      <header
        class="flex items-center bg-white px-5 py-4"
        style="border-bottom: 1px solid #E5E5EA"
      >
        <button type="button" class="mr-3 text-[#6C6C6C]" @click="goToMap">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 class="text-[16px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.224px">相遇报告</h1>
      </header>

      <section class="flex-1 overflow-y-auto px-5 py-5">
        <!-- 双角色展示 -->
        <div class="apple-card mx-auto w-[90%] p-6">
          <div class="flex items-center justify-center gap-8">
            <div class="flex flex-col items-center gap-2">
              <div class="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7]">
                <span class="material-symbols-outlined text-[28px] text-[#6C6C6C]">person</span>
              </div>
              <span class="text-[14px] font-medium text-[#1D1D1F]">月汐观测者</span>
            </div>
            <span class="text-[16px] text-[#8E8E93]">✦</span>
            <div class="flex flex-col items-center gap-2">
              <div class="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7]">
                <span class="material-symbols-outlined text-[28px] text-[#9B8EC4]">person</span>
              </div>
              <span class="text-[14px] font-medium text-[#1D1D1F]">云野</span>
            </div>
          </div>
        </div>

        <!-- 匹配度展示 -->
        <div class="mt-6 text-center">
          <p
            class="text-[48px] font-light text-[#1D1D1F]"
            style="letter-spacing: -2px"
          >
            {{ compatibility }}%
          </p>
          <p
            class="mt-2 text-[14px] font-medium"
            :style="{ color: compatibilityLabel().color }"
          >
            {{ compatibilityLabel().text }}
          </p>
          <div class="mx-auto mt-3 h-1 w-[60%] overflow-hidden rounded-full bg-[#F2F2F7]">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${compatibility}%`, backgroundColor: compatibilityLabel().color }"
            />
          </div>
        </div>

        <!-- 匹配详情卡片 -->
        <div class="apple-card mt-6 p-5">
          <!-- Vibe -->
          <div class="flex items-center justify-between">
            <span class="text-[13px] text-[#8E8E93]">Vibe</span>
            <span class="text-[13px] font-medium" :style="{ color: vibeResult.color }">{{ vibeResult.text }}</span>
          </div>

          <div class="subtle-divider my-4" />

          <!-- 共同话题 -->
          <p class="text-[13px] text-[#8E8E93]">共同话题</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span v-for="topic in reportTopics" :key="topic" class="pill-tag">{{ topic }}</span>
          </div>

          <div class="subtle-divider my-4" />

          <!-- 推荐理由 -->
          <p class="text-[13px] text-[#8E8E93]">推荐理由</p>
          <p class="mt-2 text-[14px] leading-6 text-[#6C6C6C]" style="letter-spacing: -0.224px">
            你们都喜欢在安静的咖啡馆里享受独处时光，音乐品味也很合。
          </p>
        </div>

        <!-- 对话回顾入口 -->
        <p class="mt-5 cursor-pointer text-center text-[14px] font-medium text-[#1D1D1F]" style="letter-spacing: -0.224px">
          查看对话记录 →
        </p>
      </section>

      <!-- v4 底部操作按钮 -->
      <div
        class="flex gap-3 bg-white px-5 py-4"
        style="border-top: 1px solid #E5E5EA"
      >
        <button
          type="button"
          class="secondary-button flex-1 py-3 text-[15px]"
          style="letter-spacing: -0.224px"
          @click="goToMap"
        >
          继续冒险
        </button>
        <button
          type="button"
          class="primary-button flex-1 py-3 text-[15px]"
          style="letter-spacing: -0.224px"
        >
          打招呼
        </button>
      </div>
    </div>
  </main>
</template>
