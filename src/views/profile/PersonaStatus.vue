<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ProfileVoiceButton from '../../components/profile/ProfileVoiceButton.vue'
import TabBar from '../../components/ui/TabBar.vue'
import CenteredOverlayCard from '../../components/ui/CenteredOverlayCard.vue'
import { personaBubbleCards, personaMoodAttrs, type PersonaBubbleCard } from './personaStatus.config'
import { readStoredProfileAvatarUrl, readStoredProfileModelUrl, readStoredProfileNickname } from './profileModel.config'
import { useProfileAgent } from './useProfileAgent'

const ProfileAvatar3D = defineAsyncComponent(() => import('../../components/profile/ProfileAvatar3D.vue'))

const router = useRouter()

const nickname = ref(readStoredProfileNickname())
const avatarUrl = readStoredProfileAvatarUrl()
const profileModelUrl = readStoredProfileModelUrl()
const areBubblesVisible = ref(true)
const { memories, traits, promptText, isLoadingMemories, isRecording, speechSupported, bootstrap, startRecording, stopRecording } = useProfileAgent()

// 当前展开的气泡详情
type BubbleId = 'mood' | 'bio' | 'encounter' | 'collection' | null
const activeBubble = ref<BubbleId>(null)

const moodAttrs = personaMoodAttrs
const topMood = computed(() => moodAttrs.reduce((a, b) => (a.value > b.value ? a : b)))

const toggleBubble = (id: BubbleId) => {
  activeBubble.value = activeBubble.value === id ? null : id
}

const closeBubble = () => {
  activeBubble.value = null
}

const togglePersonaActions = () => {
  areBubblesVisible.value = !areBubblesVisible.value
  console.debug('[PersonaStatus] togglePersonaActions', {
    areBubblesVisible: areBubblesVisible.value,
  })
}

const openHistory = () => {
  void router.push('/history')
}

const bubbleChip = (bubble: PersonaBubbleCard) => {
  if (bubble.id === 'mood') {
    return `${topMood.value.name} ${topMood.value.value}%`
  }

  if (bubble.id === 'bio') {
    return memories.value.length > 0 ? `${memories.value.length}条` : '记忆'
  }

  return bubble.chip
}

onMounted(async () => {
  await bootstrap()
})
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
      <section class="relative z-10 flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-96px)] flex-col px-5 pt-2">
        <!-- 连接虚线（SVG） -->
        <svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <line v-if="areBubblesVisible" x1="50%" y1="43%" x2="16%" y2="15%" stroke="#E5E5EA" stroke-width="1" stroke-dasharray="4 4" opacity="0.45" />
          <line v-if="areBubblesVisible" x1="50%" y1="43%" x2="38%" y2="15%" stroke="#E5E5EA" stroke-width="1" stroke-dasharray="4 4" opacity="0.45" />
          <line v-if="areBubblesVisible" x1="50%" y1="43%" x2="62%" y2="15%" stroke="#E5E5EA" stroke-width="1" stroke-dasharray="4 4" opacity="0.45" />
          <line v-if="areBubblesVisible" x1="50%" y1="43%" x2="84%" y2="15%" stroke="#E5E5EA" stroke-width="1" stroke-dasharray="4 4" opacity="0.45" />
        </svg>

        <div class="relative z-20 min-h-[132px] pt-2">
          <Transition name="persona-actions">
            <div v-if="areBubblesVisible" class="grid w-full grid-cols-4 gap-2.5">
              <button
                v-for="bubble in personaBubbleCards"
                :key="bubble.id"
                type="button"
                class="flex min-w-0 flex-col items-center gap-2 transition-transform active:scale-95"
                @click="toggleBubble(bubble.id)"
              >
                <div class="apple-card flex h-[68px] w-full min-w-0 flex-col items-center justify-center gap-1 px-2">
                  <span class="material-symbols-outlined text-[21px]" :style="{ color: bubble.id === 'mood' ? topMood.color : bubble.iconColor }">
                    {{ bubble.icon }}
                  </span>
                  <span
                    class="max-w-full truncate text-[11px] font-medium"
                    :style="{ color: bubble.id === 'mood' ? topMood.color : '#1D1D1F' }"
                  >
                    {{ bubbleChip(bubble) }}
                  </span>
                </div>
                <span class="text-center text-[10px] leading-4 text-[#8E8E93]">{{ bubble.label }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- 中央人物形象 -->
        <div class="relative z-20 flex flex-1 flex-col items-center justify-center pb-12">
          <div class="animate-float mb-2">
            <ProfileAvatar3D
              :model-url="profileModelUrl"
              :fallback-image="avatarUrl"
              :alt="nickname"
              @toggle="togglePersonaActions"
            />
          </div>
          <h2 class="text-[18px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.3px">{{ nickname }}</h2>
          <span
            class="mt-1.5 inline-block rounded-[999px] px-2.5 py-0.5 text-[13px] font-medium"
            style="background: rgba(155, 142, 196, 0.12); color: #9B8EC4; border: 1px solid rgba(155, 142, 196, 0.25)"
          >
            {{ traits[0]?.label ?? '陪伴型分身' }}
          </span>
          <p v-if="promptText" class="mt-4 max-w-[280px] text-center text-[14px] leading-6 text-[#6C6C70]">
            {{ promptText }}
          </p>
          <div class="mt-5">
            <ProfileVoiceButton
              :is-recording="isRecording"
              :disabled="!speechSupported"
              @hold-start="startRecording"
              @hold-end="stopRecording"
            />
          </div>
        </div>

      </section>

      <!-- 气泡详情弹窗 -->
      <CenteredOverlayCard :visible="Boolean(activeBubble)" max-height="min(58dvh, 520px)" @close="closeBubble">
          <!-- 情绪星云详情 -->
          <div
            v-if="activeBubble === 'mood'"
            class="space-y-4"
          >
            <div class="rounded-[18px] bg-[#F2F2F7] px-4 py-3">
              <p class="text-[12px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">Mood Snapshot</p>
              <p class="mt-1 text-[17px] font-semibold text-[#1D1D1F]">{{ topMood.name }} {{ topMood.value }}%</p>
            </div>
            <div class="overflow-y-auto pr-1" style="max-height: min(calc(58dvh - 120px), 380px)">
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
          </div>

          <!-- 灵感自白详情 -->
          <div
            v-if="activeBubble === 'bio'"
            class="space-y-4"
          >
            <div class="rounded-[18px] bg-[#F2F2F7] px-4 py-3">
              <p class="text-[12px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">Memory Vault</p>
              <p class="mt-1 text-[17px] font-semibold text-[#1D1D1F]">长期记忆</p>
            </div>
            <div class="max-h-[min(calc(58dvh-120px),360px)] overflow-y-auto pr-1">
              <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">被悄悄整理好的你</p>
              <div v-if="isLoadingMemories" class="apple-card p-4">
                <p class="text-[14px] leading-6 text-[#6C6C70]">分身正在整理你的长期记忆...</p>
              </div>
              <div v-else-if="memories.length === 0" class="apple-card p-4">
                <p class="text-[14px] leading-6 text-[#6C6C70]">分身还在慢慢认识你。等你和它聊过几轮之后，这里会出现被整理好的长期记忆。</p>
              </div>
              <div v-else class="space-y-3">
                <div v-for="memory in memories" :key="memory.id" class="apple-card p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-[15px] font-medium text-[#1D1D1F]">{{ memory.title }}</p>
                      <p class="mt-2 text-[13px] leading-6 text-[#6C6C70]">{{ memory.summary }}</p>
                    </div>
                    <span class="shrink-0 text-[11px] font-medium text-[#9B8EC4]">{{ Math.round(memory.confidence * 100) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 相遇记录详情 -->
          <div
            v-if="activeBubble === 'encounter'"
            class="space-y-4"
          >
            <div class="rounded-[18px] bg-[#F2F2F7] px-4 py-3">
              <p class="text-[12px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">Recent Resonance</p>
              <p class="mt-1 text-[17px] font-semibold text-[#1D1D1F]">最近遇见的共鸣对象</p>
            </div>
            <div class="overflow-y-auto pr-1" style="max-height: min(calc(58dvh - 120px), 360px)">
              <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">遇见过的共鸣 (6)</p>
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
          </div>

          <!-- 盲盒展柜详情 -->
          <div
            v-if="activeBubble === 'collection'"
            class="space-y-4"
          >
            <div class="rounded-[18px] bg-[#F2F2F7] px-4 py-3">
              <p class="text-[12px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">Collection</p>
              <p class="mt-1 text-[17px] font-semibold text-[#1D1D1F]">你的观测所得</p>
            </div>
            <div class="overflow-y-auto pr-1" style="max-height: min(calc(58dvh - 120px), 360px)">
              <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">观测所得 (2/12)</p>
              <div class="grid grid-cols-2 gap-3">
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
                <div v-for="i in 4" :key="i" class="apple-card flex items-center justify-center p-3 opacity-30">
                  <span class="material-symbols-outlined text-[24px] text-[#8E8E93]">lock</span>
                </div>
              </div>
            </div>
          </div>
      </CenteredOverlayCard>

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

.persona-actions-enter-active,
.persona-actions-leave-active {
  transition: opacity 180ms ease, transform 220ms ease;
}

.persona-actions-enter-from,
.persona-actions-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

</style>
