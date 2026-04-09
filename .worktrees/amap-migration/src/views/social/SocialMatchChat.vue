<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { matchChat } from '../../lib/mockData'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const chatEndRef = ref<HTMLDivElement | null>(null)

const messages = ref(matchChat)
const isTyping = ref(true)
const progress = ref(1)
const currentSpeaker = ref<'match' | 'user'>('match')

const totalRounds = 3

const scrollToBottom = async () => {
  await nextTick()
  chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// 获取当前说话者名字
const currentSpeakerName = () => {
  return currentSpeaker.value === 'match' ? '云野' : '月汐观测者'
}

// 关闭浮层
const closeOverlay = () => {
  emit('close')
}

// 查看匹配报告
const goToReport = () => {
  emit('close')
  void router.push('/report')
}

// 模拟对话进度推进
onMounted(() => {
  scrollToBottom()

  // 3 秒后标记 typing 结束，推进进度
  setTimeout(() => {
    isTyping.value = false
    currentSpeaker.value = 'user'
    progress.value = 2
    void scrollToBottom()
  }, 3000)

  // 6 秒后推进到第 3 轮
  setTimeout(() => {
    progress.value = 3
    currentSpeaker.value = 'match'
    isTyping.value = true
    void scrollToBottom()
  }, 6000)

  // 9 秒后对话完成
  setTimeout(() => {
    isTyping.value = false
  }, 9000)
})
</script>

<template>
  <!-- A2A 对话浮层：叠加在地图上方 -->
  <Transition name="overlay">
    <div v-if="visible" class="absolute inset-0 z-30">
      <!-- 半透明地图遮罩 -->
      <div class="absolute inset-0 bg-[rgba(247,247,248,0.5)]" @click="closeOverlay" />

      <!-- 左上角关闭按钮 -->
      <button
        type="button"
        class="absolute left-4 top-[calc(env(safe-area-inset-top)+16px)] z-40 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        aria-label="关闭对话"
        @click="closeOverlay"
      >
        <span class="material-symbols-outlined text-[18px] text-[#6C6C6C]">close</span>
      </button>

      <!-- 遮罩上方中央：双头像展示 -->
      <div class="absolute left-1/2 top-[28%] z-40 flex -translate-x-1/2 flex-col items-center">
        <div class="flex items-center gap-6">
          <!-- 用户头像 -->
          <div class="flex flex-col items-center gap-2">
            <div class="relative">
              <div
                v-if="currentSpeaker === 'user'"
                class="absolute -top-4 left-1/2 -translate-x-1/2"
              >
                <div class="flex items-center gap-0.5">
                  <div class="h-1 w-1 rounded-full bg-[#8E8E93]" style="animation: bounce 1.4s ease-in-out infinite" />
                  <div class="h-1 w-1 rounded-full bg-[#8E8E93]" style="animation: bounce 1.4s ease-in-out 0.2s infinite" />
                  <div class="h-1 w-1 rounded-full bg-[#8E8E93]" style="animation: bounce 1.4s ease-in-out 0.4s infinite" />
                </div>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <span class="material-symbols-outlined text-[24px] text-[#6C6C6C]">person</span>
              </div>
            </div>
            <span class="text-[12px] font-medium text-[#1D1D1F]">月汐观测者</span>
          </div>

          <!-- 连接线 -->
          <div class="mb-5 h-px w-6 bg-[#E5E5EA]" />

          <!-- 对方头像 -->
          <div class="flex flex-col items-center gap-2">
            <div class="relative">
              <div
                v-if="currentSpeaker === 'match'"
                class="absolute -top-4 left-1/2 -translate-x-1/2"
              >
                <div class="flex items-center gap-0.5">
                  <div class="h-1 w-1 rounded-full bg-[#8E8E93]" style="animation: bounce 1.4s ease-in-out infinite" />
                  <div class="h-1 w-1 rounded-full bg-[#8E8E93]" style="animation: bounce 1.4s ease-in-out 0.2s infinite" />
                  <div class="h-1 w-1 rounded-full bg-[#8E8E93]" style="animation: bounce 1.4s ease-in-out 0.4s infinite" />
                </div>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <span class="material-symbols-outlined text-[24px] text-[#9B8EC4]">person</span>
              </div>
            </div>
            <span class="text-[12px] font-medium text-[#1D1D1F]">云野</span>
          </div>
        </div>
      </div>

      <!-- 底部对话面板 -->
      <div class="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px] bg-white" style="height: 48dvh; box-shadow: 0 -1px 3px rgba(0,0,0,0.06)">
        <!-- 拉手 -->
        <div class="flex justify-center pt-3 pb-1">
          <div class="h-1 w-8 rounded-full bg-[#E5E5EA]" />
        </div>

        <!-- 对话头部 -->
        <div class="flex items-center justify-between px-5 py-3">
          <div class="flex items-center gap-2">
            <div class="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2F2F7]">
              <span
                class="material-symbols-outlined text-[12px]"
                :class="currentSpeaker === 'match' ? 'text-[#9B8EC4]' : 'text-[#6C6C6C]'"
              >person</span>
            </div>
            <span class="text-[13px] font-medium text-[#1D1D1F]" style="letter-spacing: -0.224px">
              {{ currentSpeakerName() }}
              <span v-if="currentSpeaker === 'user'" class="ml-1 text-[11px] text-[#8E8E93]">你</span>
            </span>
          </div>
          <span class="text-[12px] text-[#8E8E93]">{{ progress }}/{{ totalRounds }}</span>
        </div>

        <!-- 对话内容区域 -->
        <div class="flex flex-1 flex-col gap-2 overflow-y-auto px-5 pb-2">
          <article
            v-for="msg in messages"
            :key="msg.id"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <!-- 对方头像 -->
            <div v-if="msg.role === 'match'" class="mr-2 mt-4 flex-shrink-0">
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
        </div>

        <!-- 面板底部：进度条 + 按钮 -->
        <div class="px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
          <!-- 线性进度条 -->
          <div class="progress-bar mb-3">
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
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-3px); }
}

.overlay-enter-active {
  transition: opacity 300ms ease-out;
}
.overlay-enter-active > div:last-child {
  transition: transform 300ms ease-out;
}
.overlay-leave-active {
  transition: opacity 200ms ease-in;
}
.overlay-leave-active > div:last-child {
  transition: transform 200ms ease-in;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.overlay-enter-from > div:last-child,
.overlay-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
