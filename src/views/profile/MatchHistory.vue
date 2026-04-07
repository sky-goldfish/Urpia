<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { matchHistory } from '../../lib/mockData'

const router = useRouter()

const goToReport = () => {
  void router.push('/report')
}

const goBack = () => {
  void router.push('/profile')
}
</script>

<template>
  <main class="device-shell">
    <div class="flex min-h-[100dvh] flex-col bg-[#F7F7F8]">
      <!-- v4 顶部导航栏 -->
      <header
        class="flex items-center bg-white px-5 py-4"
        style="border-bottom: 1px solid #E5E5EA"
      >
        <button type="button" class="mr-3 text-[#6C6C6C]" @click="goBack">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 class="text-[16px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.224px">相遇记录</h1>
      </header>

      <!-- 列表区域 -->
      <section class="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
        <article
          v-for="record in matchHistory"
          :key="record.id"
          class="apple-card p-4"
        >
          <div class="flex items-start gap-3">
            <!-- 左侧：头像 + 状态 -->
            <div class="relative flex-shrink-0">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F2F7]">
                <span class="material-symbols-outlined text-[20px] text-[#6C6C6C]">person</span>
              </div>
              <div
                class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full"
                :class="record.status === '仍在联系' ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'"
              />
            </div>

            <!-- 中间：信息 -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <p class="text-[14px] font-medium text-[#1D1D1F]" style="letter-spacing: -0.224px">
                  {{ record.alias }}
                </p>
                <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.08px">
                  {{ record.lastSeen }}
                </p>
              </div>
              <p class="mt-1 truncate text-[13px] text-[#8E8E93]" style="letter-spacing: -0.08px">
                {{ record.highlight }}
              </p>
              <div class="mt-2 flex gap-1.5">
                <span class="pill-tag text-[11px] !px-2 !py-1">{{ record.persona }}</span>
              </div>
            </div>

            <!-- 右侧：匹配度 -->
            <div class="flex flex-col items-center gap-1 flex-shrink-0">
              <span class="text-[16px] font-semibold text-[#1D1D1F]">{{ record.compatibility }}%</span>
              <span class="material-symbols-outlined text-[16px] text-[#E5E5EA]">chevron_right</span>
            </div>
          </div>
        </article>
      </section>

      <!-- 底部操作 -->
      <div
        class="bg-white px-5 py-4"
        style="border-top: 1px solid #E5E5EA"
      >
        <button
          type="button"
          class="secondary-button w-full py-3 text-[15px]"
          style="letter-spacing: -0.224px"
          @click="goToReport"
        >
          查看最近一次报告
        </button>
      </div>

      <TabBar />
    </div>
  </main>
</template>
