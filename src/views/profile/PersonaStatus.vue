<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { personas } from '../../lib/mockData'

const router = useRouter()

const persona = computed(() => personas[0])

// v4 情绪属性数据
const moodAttrs = [
  { name: '治愈', value: 80, color: '#6BBFA3' },
  { name: '浪漫', value: 60, color: '#D4788C' },
  { name: '创意', value: 40, color: '#9B8EC4' },
  { name: '活力', value: 50, color: '#E8A44A' },
  { name: '社交', value: 30, color: '#D49A5A' },
  { name: '温馨', value: 55, color: '#B89A80' },
]

const openHistory = () => {
  void router.push('/history')
}
</script>

<template>
  <main class="device-shell">
    <div class="flex min-h-[100dvh] flex-col bg-[#F7F7F8]">
      <!-- v4 页面标题 -->
      <header class="px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-4">
        <h1 class="text-[24px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.4px">角色状态</h1>
      </header>

      <section class="flex-1 overflow-y-auto px-5 pb-5">
        <!-- 角色信息卡片 -->
        <div class="apple-card p-5">
          <div class="flex items-center gap-4">
            <!-- 头像 -->
            <div class="relative">
              <div class="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F2F2F7]">
                <span class="material-symbols-outlined text-[32px] text-[#6C6C6C]">person</span>
              </div>
              <button
                type="button"
                class="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F2F2F7]"
              >
                <span class="material-symbols-outlined text-[10px] text-[#6C6C6C]">photo_camera</span>
              </button>
            </div>
            <!-- 信息 -->
            <div>
              <p class="text-[18px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.3px">
                {{ persona?.title }}
              </p>
              <span
                class="mt-1.5 inline-block rounded-[999px] px-2.5 py-0.5 text-[13px] font-medium"
                style="background: rgba(155, 142, 196, 0.12); color: #9B8EC4; border: 1px solid rgba(155, 142, 196, 0.25)"
              >
                ENFP
              </span>
            </div>
          </div>
        </div>

        <!-- AI Bio -->
        <div class="apple-card mt-4 p-5">
          <p class="mb-2 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">AI BIO</p>
          <p class="text-[15px] leading-6 text-[#1D1D1F]" style="letter-spacing: -0.224px">
            一个热爱在咖啡香中寻找灵感的自由灵魂~
          </p>
        </div>

        <!-- 兴趣标签 -->
        <div class="apple-card mt-4 p-5">
          <p class="mb-3 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">兴趣标签</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="trait in persona?.traits" :key="trait" class="pill-tag">{{ trait }}</span>
          </div>
        </div>

        <!-- 情绪属性 -->
        <div class="apple-card mt-4 p-5">
          <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">情绪属性</p>
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

        <!-- 盲盒收集入口 -->
        <div class="apple-card mt-4 p-5">
          <div class="flex items-center justify-between">
            <p class="text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">盲盒收集</p>
            <p class="text-[13px] font-medium text-[#1D1D1F]">查看全部 →</p>
          </div>
          <div class="mt-3 flex gap-3">
            <div class="flex flex-1 items-center gap-2 rounded-[12px] bg-[#F2F2F7] p-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full" style="background: rgba(107, 191, 163, 0.15)">
                <span class="material-symbols-outlined text-[16px]" style="color: #6BBFA3">spa</span>
              </div>
              <div>
                <p class="text-[12px] text-[#1D1D1F]">M50 咖啡馆</p>
                <span class="text-[11px]" style="color: #6BBFA3">治愈</span>
              </div>
            </div>
            <div class="flex flex-1 items-center gap-2 rounded-[12px] bg-[#F2F2F7] p-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full" style="background: rgba(155, 142, 196, 0.15)">
                <span class="material-symbols-outlined text-[16px]" style="color: #9B8EC4">palette</span>
              </div>
              <div>
                <p class="text-[12px] text-[#1D1D1F]">Glasshouse</p>
                <span class="text-[11px]" style="color: #9B8EC4">创意</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 相遇记录入口 -->
        <div class="apple-card mt-4 p-5">
          <div class="flex items-center justify-between">
            <p class="text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">相遇记录</p>
            <button type="button" class="text-[13px] font-medium text-[#1D1D1F]" @click="openHistory">
              查看全部 →
            </button>
          </div>
          <div class="mt-3 flex items-center gap-3 rounded-[12px] bg-[#F2F2F7] p-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <span class="material-symbols-outlined text-[20px] text-[#9B8EC4]">person</span>
            </div>
            <div class="flex-1">
              <p class="text-[13px] text-[#1D1D1F]">云野</p>
              <p class="mt-0.5 text-[12px] text-[#8E8E93]">天哪我也是！有个咖啡馆...</p>
            </div>
            <span class="text-[16px] font-semibold text-[#1D1D1F]">87%</span>
          </div>
        </div>
      </section>

      <!-- v4 底部操作按钮 -->
      <div
        class="flex gap-3 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-4"
        style="border-top: 1px solid #E5E5EA"
      >
        <button type="button" class="secondary-button flex-1 py-3 text-[15px]" style="letter-spacing: -0.224px">
          编辑资料
        </button>
        <button type="button" class="primary-button flex-1 py-3 text-[15px]" style="letter-spacing: -0.224px">
          重新生成
        </button>
      </div>

      <TabBar />
    </div>
  </main>
</template>
