<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'

const router = useRouter()

const nickname = ref('月汐观测者')
const avatarUrl = '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg'
const bio = '一个热爱在咖啡香中寻找灵感的自由灵魂～'

// 情绪属性数据
const moodAttrs = [
  { name: '治愈', value: 80, color: '#6BBFA3' },
  { name: '浪漫', value: 60, color: '#D4788C' },
  { name: '创意', value: 40, color: '#9B8EC4' },
  { name: '活力', value: 50, color: '#E8A44A' },
  { name: '社交', value: 30, color: '#D49A5A' },
  { name: '温馨', value: 55, color: '#B89A80' },
]

const topMood = moodAttrs.reduce((a, b) => a.value > b.value ? a : b)

// 当前展开的气泡详情
type BubbleId = 'mood' | 'bio' | 'encounter' | 'collection' | null
const activeBubble = ref<BubbleId>(null)

const toggleBubble = (id: BubbleId) => {
  activeBubble.value = activeBubble.value === id ? null : id
}

const closeBubble = () => {
  activeBubble.value = null
}

const openHistory = () => {
  void router.push('/history')
}
</script>

<template>
  <main class="device-shell">
    <div class="relative h-[100dvh] w-full overflow-hidden bg-[#F7F7F8]">
      <!-- 背景光晕 -->
      <div class="absolute left-1/2 top-[30%] -translate-x-1/2 h-[360px] w-[360px] rounded-full bg-[#9B8EC4]/[0.04] blur-3xl" aria-hidden="true" />

      <!-- 顶部标题 -->
      <header class="relative z-10 px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">灵感观测中心</p>
      </header>

      <!-- 观测区域 -->
      <section class="relative z-10 flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-96px)] items-center justify-center px-5">
        <!-- 连接虚线（SVG） -->
        <svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <!-- 中心到左上 -->
          <line x1="50%" y1="42%" x2="22%" y2="22%" stroke="#E5E5EA" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
          <!-- 中心到右上 -->
          <line x1="50%" y1="42%" x2="78%" y2="22%" stroke="#E5E5EA" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
          <!-- 中心到左下 -->
          <line x1="50%" y1="42%" x2="22%" y2="68%" stroke="#E5E5EA" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
          <!-- 中心到右下 -->
          <line x1="50%" y1="42%" x2="78%" y2="68%" stroke="#E5E5EA" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
        </svg>

        <!-- 左上气泡：情绪星云 -->
        <button
          type="button"
          class="absolute left-[6%] top-[12%] z-20 flex flex-col items-center gap-1.5 transition-transform active:scale-95"
          @click="toggleBubble('mood')"
        >
          <div class="apple-card flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 p-2">
            <div class="relative">
              <span class="material-symbols-outlined text-[22px]" :style="{ color: topMood.color }">auto_awesome</span>
            </div>
            <span class="text-[11px] font-medium" :style="{ color: topMood.color }">{{ topMood.name }} {{ topMood.value }}%</span>
          </div>
          <span class="text-[10px] text-[#8E8E93]">情绪星云</span>
        </button>

        <!-- 右上气泡：灵感自白 -->
        <button
          type="button"
          class="absolute right-[6%] top-[12%] z-20 flex flex-col items-center gap-1.5 transition-transform active:scale-95"
          @click="toggleBubble('bio')"
        >
          <div class="apple-card flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 p-2">
            <span class="material-symbols-outlined text-[22px] text-[#9B8EC4]">edit_note</span>
            <span class="max-w-[56px] truncate text-[11px] font-medium text-[#1D1D1F]">自由灵魂</span>
          </div>
          <span class="text-[10px] text-[#8E8E93]">灵感自白</span>
        </button>

        <!-- 中央人物形象 -->
        <div class="relative z-20 flex flex-col items-center">
          <div class="animate-float mb-3">
            <img
              :src="avatarUrl"
              :alt="nickname"
              class="h-[180px] w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
            />
          </div>
          <h2 class="text-[18px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.3px">{{ nickname }}</h2>
          <span
            class="mt-1.5 inline-block rounded-[999px] px-2.5 py-0.5 text-[13px] font-medium"
            style="background: rgba(155, 142, 196, 0.12); color: #9B8EC4; border: 1px solid rgba(155, 142, 196, 0.25)"
          >
            ENFP
          </span>
        </div>

        <!-- 左下气泡：相遇记录 -->
        <button
          type="button"
          class="absolute bottom-[16%] left-[6%] z-20 flex flex-col items-center gap-1.5 transition-transform active:scale-95"
          @click="toggleBubble('encounter')"
        >
          <div class="apple-card flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 p-2">
            <span class="material-symbols-outlined text-[22px] text-[#D4788C]">diversity_3</span>
            <span class="text-[11px] font-medium text-[#1D1D1F]">87%</span>
          </div>
          <span class="text-[10px] text-[#8E8E93]">相遇记录</span>
        </button>

        <!-- 右下气泡：盲盒展柜 -->
        <button
          type="button"
          class="absolute bottom-[16%] right-[6%] z-20 flex flex-col items-center gap-1.5 transition-transform active:scale-95"
          @click="toggleBubble('collection')"
        >
          <div class="apple-card flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 p-2">
            <span class="material-symbols-outlined text-[22px] text-[#E8A44A]">redeem</span>
            <span class="text-[11px] font-medium text-[#1D1D1F]">2个</span>
          </div>
          <span class="text-[10px] text-[#8E8E93]">盲盒展柜</span>
        </button>
      </section>

      <!-- 气泡详情弹出层 -->
      <Transition name="bubble-detail">
        <div v-if="activeBubble" class="absolute inset-x-0 bottom-0 z-30 rounded-t-[28px] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]" style="max-height: 55dvh">
          <!-- 拉手 -->
          <div class="flex justify-center pt-3 pb-1">
            <button type="button" class="h-1 w-8 rounded-full bg-[#E5E5EA]" @click="closeBubble" />
          </div>

          <!-- 情绪星云详情 -->
          <div v-if="activeBubble === 'mood'" class="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]" style="max-height: calc(55dvh - 40px)">
            <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">情绪星云</p>
            <p class="mb-4 text-[14px] leading-6 text-[#1D1D1F]" style="letter-spacing: -0.224px">
              你的灵魂是<span class="font-medium" :style="{ color: topMood.color }">"温暖的{{ topMood.name }}色"</span>。高治愈与高浪漫的叠加，让你在社交中自带温和的吸引力。
            </p>
            <div class="space-y-3">
              <div v-for="attr in moodAttrs" :key="attr.name" class="flex items-center gap-3">
                <span class="w-10 text-[13px] text-[#6C6C6C]">{{ attr.name }}</span>
                <div class="progress-bar flex-1">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: `${attr.value}%`, backgroundColor: attr.color }"
                  />
                </div>
                <span class="w-10 text-right text-[13px] font-medium text-[#1D1D1F]">{{ attr.value }}%</span>
              </div>
            </div>
          </div>

          <!-- 灵感自白详情 -->
          <div v-if="activeBubble === 'bio'" class="flex flex-col items-center px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]" style="max-height: calc(55dvh - 40px)">
            <p class="mb-6 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">灵感自白</p>
            <div class="flex w-full flex-1 items-center justify-center py-8">
              <p class="text-center text-[20px] font-normal leading-8 text-[#1D1D1F]/80" style="letter-spacing: -0.3px">
                "{{ bio }}"
              </p>
            </div>
            <button
              type="button"
              class="secondary-button w-full py-3 text-[15px]"
              style="letter-spacing: -0.224px"
            >
              编辑自白
            </button>
          </div>

          <!-- 相遇记录详情 -->
          <div v-if="activeBubble === 'encounter'" class="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]" style="max-height: calc(55dvh - 40px)">
            <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">遇见过的共鸣 (6)</p>
            <!-- 置顶卡片 -->
            <div class="apple-card mb-3 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F2F7]">
                  <span class="material-symbols-outlined text-[20px] text-[#9B8EC4]">person</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[15px] font-medium text-[#1D1D1F]">云野</span>
                    <span class="text-[16px] font-semibold text-[#1D1D1F]">87%</span>
                  </div>
                  <p class="mt-1 text-[13px] text-[#8E8E93]" style="font-style: italic; letter-spacing: -0.08px">
                    "天哪我也是！有个咖啡馆我特别喜欢..."
                  </p>
                  <p class="mt-2 text-[11px] text-[#8E8E93]">10分钟前活跃 · 距离 0.5km</p>
                </div>
              </div>
            </div>
            <!-- 历史卡片 -->
            <div class="apple-card mb-3 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F2F7]">
                  <span class="material-symbols-outlined text-[20px] text-[#D4788C]">person</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[15px] font-medium text-[#1D1D1F]">岚岫</span>
                    <span class="text-[16px] font-semibold text-[#1D1D1F]">82%</span>
                  </div>
                  <p class="mt-1 text-[13px] text-[#8E8E93]" style="font-style: italic; letter-spacing: -0.08px">
                    "在水边据点完成了情绪卡片交换。"
                  </p>
                  <p class="mt-2 text-[11px] text-[#8E8E93]">3月28日 · 距离 1.2km</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="secondary-button w-full py-3 text-[15px]"
              style="letter-spacing: -0.224px"
              @click="openHistory"
            >
              查看全部记录
            </button>
          </div>

          <!-- 盲盒展柜详情 -->
          <div v-if="activeBubble === 'collection'" class="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]" style="max-height: calc(55dvh - 40px)">
            <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">观测所得 (2/12)</p>
            <!-- 已收集 -->
            <div class="grid grid-cols-2 gap-3">
              <!-- 展位 A -->
              <div class="apple-card p-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full" style="background: rgba(107, 191, 163, 0.15)">
                  <span class="material-symbols-outlined text-[20px]" style="color: #6BBFA3">spa</span>
                </div>
                <p class="mt-2 text-[13px] font-medium text-[#1D1D1F]">M50 咖啡馆</p>
                <span class="text-[11px]" style="color: #6BBFA3">治愈系</span>
                <p class="mt-1.5 text-[11px] leading-4 text-[#8E8E93]" style="font-style: italic">
                  "弥漫着浓郁豆香的艺术空间。"
                </p>
              </div>
              <!-- 展位 B -->
              <div class="apple-card p-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full" style="background: rgba(155, 142, 196, 0.15)">
                  <span class="material-symbols-outlined text-[20px]" style="color: #9B8EC4">palette</span>
                </div>
                <p class="mt-2 text-[13px] font-medium text-[#1D1D1F]">Glasshouse</p>
                <span class="text-[11px]" style="color: #9B8EC4">创意系</span>
                <p class="mt-1.5 text-[11px] leading-4 text-[#8E8E93]" style="font-style: italic">
                  "植物温室主题的社交空间。"
                </p>
              </div>
              <!-- 待解锁 -->
              <div v-for="i in 4" :key="i" class="apple-card flex items-center justify-center p-3 opacity-30">
                <span class="material-symbols-outlined text-[24px] text-[#8E8E93]">lock</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 点击遮罩关闭 -->
      <Transition name="fade">
        <div
          v-if="activeBubble"
          class="absolute inset-0 z-20 bg-[#1D1D1F]/20"
          @click="closeBubble"
        />
      </Transition>

      <TabBar />
    </div>
  </main>
</template>

<style scoped>
@keyframes float-breath {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.animate-float {
  animation: float-breath 3.2s ease-in-out infinite;
}

.bubble-detail-enter-active {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease-out;
}
.bubble-detail-leave-active {
  transition: transform 200ms ease-in, opacity 150ms ease-in;
}
.bubble-detail-enter-from,
.bubble-detail-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active {
  transition: opacity 250ms ease-out;
}
.fade-leave-active {
  transition: opacity 150ms ease-in;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
