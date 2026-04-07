<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { matchChat } from '../../lib/mockData'

const router = useRouter()
const chatEndRef = ref<HTMLDivElement | null>(null)

const messages = ref(matchChat)
const isTyping = ref(false)
const progress = ref(1)

const scrollToBottom = async () => {
  await nextTick()
  chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
}

const goToReport = () => {
  void router.push('/report')
}

// 模拟对话进度
const totalRounds = 3

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <main class="device-shell">
    <div class="flex h-[100dvh] flex-col">
      <!-- v4 顶部导航栏 -->
      <header
        class="flex items-center gap-3 bg-white px-5 py-4"
        style="border-bottom: 1px solid #E5E5EA"
      >
        <div class="flex items-center gap-3">
          <!-- 双头像 -->
          <div class="flex items-center -space-x-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7]">
              <span class="material-symbols-outlined text-[16px] text-[#6C6C6C]">person</span>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7]">
              <span class="material-symbols-outlined text-[16px] text-[#9B8EC4]">person</span>
            </div>
          </div>
          <div>
            <p class="text-[13px] font-medium text-[#1D1D1F]" style="letter-spacing: -0.224px">你 · 月汐观测者</p>
            <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.08px">对方 · 云野</p>
          </div>
        </div>
        <div class="flex-1" />
        <div class="text-right">
          <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.08px">{{ progress }}/{{ totalRounds }}</p>
        </div>
      </header>

      <!-- 对话区域（用户只能旁观） -->
      <section class="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F7F7F8] px-5 py-4">
        <article
          v-for="msg in messages"
          :key="msg.id"
          class="flex"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <!-- 对方头像 -->
          <div v-if="msg.role === 'match'" class="mr-2 mt-5 flex-shrink-0">
            <div class="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2F2F7]">
              <span class="material-symbols-outlined text-[12px] text-[#9B8EC4]">person</span>
            </div>
          </div>

          <div class="max-w-[78%]">
            <div
              class="rounded-[16px] px-4 py-3 text-[15px] leading-relaxed"
              :class="
                msg.role === 'user'
                  ? 'bg-[#1D1D1F] text-white rounded-br-sm'
                  : 'bg-[#F2F2F7] text-[#1D1D1F] rounded-bl-sm'
              "
              style="letter-spacing: -0.224px"
            >
              {{ msg.text }}
            </div>
          </div>
        </article>

        <!-- AI 正在输入 -->
        <div v-if="isTyping" class="flex items-start gap-2">
          <div class="flex-shrink-0 mt-0.5">
            <div class="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2F2F7]">
              <span class="material-symbols-outlined text-[12px] text-[#9B8EC4]">person</span>
            </div>
          </div>
          <div class="rounded-[16px] rounded-bl-sm bg-[#F2F2F7] px-4 py-3">
            <div class="flex items-center gap-1">
              <div class="h-1.5 w-1.5 rounded-full bg-[#8E8E93]/40" style="animation: bounce 1.4s ease-in-out infinite" />
              <div class="h-1.5 w-1.5 rounded-full bg-[#8E8E93]/40" style="animation: bounce 1.4s ease-in-out 0.2s infinite" />
              <div class="h-1.5 w-1.5 rounded-full bg-[#8E8E93]/40" style="animation: bounce 1.4s ease-in-out 0.4s infinite" />
            </div>
          </div>
        </div>

        <div ref="chatEndRef" />
      </section>

      <!-- v4 底部进度条（无输入框，用户只是旁观者） -->
      <div class="bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-3">
        <div class="mb-3 progress-bar">
          <div class="progress-bar-fill" :style="{ width: `${(progress / totalRounds) * 100}%` }" />
        </div>
        <button
          type="button"
          class="primary-button w-full py-3 text-[15px]"
          style="letter-spacing: -0.224px"
          @click="goToReport"
        >
          查看匹配报告
        </button>
      </div>

      <TabBar />
    </div>
  </main>
</template>

<style scoped>
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-3px); }
}
</style>
