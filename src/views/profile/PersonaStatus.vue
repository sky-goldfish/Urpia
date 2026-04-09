<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import CenteredOverlayCard from '../../components/ui/CenteredOverlayCard.vue'
import { personaBubbleCards, personaMoodAttrs, type PersonaBubbleCard } from './personaStatus.config'
import { readStoredProfileAvatarImageUrl, readStoredProfileModelUrl, readStoredProfileNickname } from './profileModel.config'

const ProfileAvatar3D = defineAsyncComponent(() => import('../../components/profile/ProfileAvatar3D.vue'))

const router = useRouter()

const nickname = ref(readStoredProfileNickname())
const avatarUrl = readStoredProfileAvatarImageUrl()
const profileModelUrl = readStoredProfileModelUrl()
const areBubblesVisible = ref(true)

// 当前展开的气泡详情
type BubbleId = 'footprint' | 'mood' | 'memory' | 'social' | null
const activeBubble = ref<BubbleId>(null)

const moodAttrs = personaMoodAttrs
const topMood = computed(() => moodAttrs.reduce((a, b) => (a.value > b.value ? a : b)))
const currentMoodTagline = '今天想以一种温和、好靠近的方式被看见。'

const footprintHighlights = [
  { place: '长泰广场', note: '点亮了 3 个据点，带回 1 枚盲盒徽章。', time: '今天 18:20' },
  { place: '汇智国际', note: '和分身一起解锁了夜间路线。', time: '昨天 21:05' },
  { place: '张江创新园', note: '完成第一次地图点亮连线。', time: '4月7日' },
]

const footprintBadges = [
  { name: '夜色采集', tone: '#E8A44A', icon: 'hotel_class' },
  { name: '雨天散步', tone: '#6BBFA3', icon: 'rainy' },
  { name: '盲盒连开', tone: '#9B8EC4', icon: 'deployed_code' },
  { name: '待点亮', tone: '#C7C7CC', icon: 'lock' },
]

const moodTimeline = [
  { label: '现在', mood: `${topMood.value.name} ${topMood.value.value}%`, note: '适合轻声开场，慢慢把对话聊热。', color: topMood.value.color },
  { label: '今天下午', mood: '浪漫 60%', note: '容易被有画面感的句子打动。', color: '#D4788C' },
  { label: '昨天夜里', mood: '创意 40%', note: '更想去有新鲜感的地方逛逛。', color: '#9B8EC4' },
]

const memoryEntries = [
  { title: '凌晨的咖啡馆对话', summary: '你提到“想和能懂沉默的人待在一起”，分身把它记成了今天最重要的一句。', time: '今天 00:14' },
  { title: '长泰广场的第一次驻足', summary: '在路灯下停了三分钟，系统记录为一段“安静但有陪伴感”的记忆。', time: '昨天 21:05' },
  { title: '关于理想周末的回答', summary: '你说最想要的是“有人一起乱逛，也有人一起发呆”。', time: '4月7日' },
]

const socialThreads = [
  { name: '云野', state: '刚刚回过你', snippet: '下次一起去那个有玻璃顶的地方？', badge: 'A2A', accent: '#9B8EC4' },
  { name: '岚岫', state: '今晚在线', snippet: '我把路线收藏了，等你一起点亮。', badge: '同频', accent: '#D4788C' },
]

const socialMatches = [
  { name: '序章', match: '91%', note: '适合从地图足迹开始聊，一起补完一条夜路。', accent: '#6BBFA3' },
  { name: '慢慢', match: '87%', note: '会认真接你的情绪状态，聊起来节奏很舒服。', accent: '#E8A44A' },
]

// Agent LLM 对话相关
const isAgentDialogOpen = ref(false)
const isAgentLoading = ref(false)
const agentMessages = ref<Array<{ role: 'agent1' | 'agent2'; content: string }>>([])

// 模拟 Agent 对话数据
const mockAgentConversation = [
  { role: 'agent1' as const, content: '我注意到用户最近经常去咖啡馆，尤其是晚上。' },
  { role: 'agent2' as const, content: '是的，而且他在长泰广场停留的时间最长，可能喜欢那里的氛围。' },
  { role: 'agent1' as const, content: '他的情绪标签显示「温和」占比最高，说明他最近状态比较稳定。' },
  { role: 'agent2' as const, content: '不过昨天深夜的活跃度有点异常，可能是有心事？' },
  { role: 'agent1' as const, content: '我查了一下，他收藏了几篇关于「独处与陪伴」的文章。' },
  { role: 'agent2' as const, content: '看来他在思考人际关系的话题，我们可以推荐一些社交活动。' },
  { role: 'agent1' as const, content: '他关注的城市探索类内容增加了40%，可能对线下活动感兴趣。' },
  { role: 'agent2' as const, content: '要不要推送「城市漫步」主题的 meetup 给他？' },
  { role: 'agent1' as const, content: '好主意，匹配度87%的「慢慢」也喜欢这类活动。' },
  { role: 'agent2' as const, content: '已生成推荐卡片，等他下次打开应用时展示。' },
]

const openAgentDialog = async () => {
  isAgentDialogOpen.value = true
  isAgentLoading.value = true
  agentMessages.value = []
  
  // 模拟加载过程，逐条显示对话
  for (let i = 0; i < mockAgentConversation.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600))
    agentMessages.value.push(mockAgentConversation[i])
  }
  
  isAgentLoading.value = false
}

const closeAgentDialog = () => {
  isAgentDialogOpen.value = false
  agentMessages.value = []
}

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

  return bubble.chip
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
            ENFP
          </span>
        </div>

      </section>

      <!-- 气泡详情弹窗 -->
      <CenteredOverlayCard :visible="Boolean(activeBubble)" max-height="min(58dvh, 520px)" @close="closeBubble">
          <!-- 足迹详情 -->
          <div
            v-if="activeBubble === 'footprint'"
            class="space-y-4"
          >
            <div class="rounded-[18px] bg-[#F2F2F7] px-4 py-3">
              <p class="text-[12px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">Footprint</p>
              <p class="mt-1 text-[17px] font-semibold text-[#1D1D1F]">本周点亮 12 处 · 已收集 8 / 24</p>
            </div>
            <div class="overflow-y-auto pr-1" style="max-height: min(calc(58dvh - 120px), 380px)">
              <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">点亮地图与盲盒收集</p>
              <p class="mb-4 text-[14px] leading-6 text-[#1D1D1F]" style="letter-spacing: -0.224px">
                这里记录你和分身一起走过的城市坐标。每点亮一个地方，都会留下路线、情绪和盲盒成就。
              </p>
              <div class="space-y-3">
                <div v-for="item in footprintHighlights" :key="item.place" class="apple-card p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-[15px] font-medium text-[#1D1D1F]">{{ item.place }}</p>
                      <p class="mt-1 text-[13px] leading-5 text-[#6C6C70]">{{ item.note }}</p>
                    </div>
                    <span class="text-[11px] text-[#8E8E93]">{{ item.time }}</span>
                  </div>
                </div>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <div
                  v-for="badge in footprintBadges"
                  :key="badge.name"
                  class="apple-card p-3"
                  :class="{ 'opacity-45': badge.icon === 'lock' }"
                >
                  <div class="flex h-10 w-10 items-center justify-center rounded-full" :style="{ background: `${badge.tone}1F` }">
                    <span class="material-symbols-outlined text-[20px]" :style="{ color: badge.tone }">{{ badge.icon }}</span>
                  </div>
                  <p class="mt-2 text-[13px] font-medium text-[#1D1D1F]">{{ badge.name }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 情绪详情 -->
          <div
            v-if="activeBubble === 'mood'"
            class="space-y-4"
          >
            <div class="rounded-[18px] bg-[#F2F2F7] px-4 py-3">
              <p class="text-[12px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">Mood Status</p>
              <p class="mt-1 text-[17px] font-semibold text-[#1D1D1F]">{{ topMood.name }} {{ topMood.value }}%</p>
            </div>
            <div class="overflow-y-auto pr-1" style="max-height: min(calc(58dvh - 120px), 380px)">
              <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">像微信状态一样表达今天</p>
              <div class="apple-card mb-4 p-4">
                <p class="text-[15px] font-medium text-[#1D1D1F]">此刻状态</p>
                <p class="mt-2 text-[14px] leading-6 text-[#6C6C70]">{{ currentMoodTagline }}</p>
              </div>
              <div class="space-y-3">
                <div v-for="entry in moodTimeline" :key="entry.label" class="apple-card p-4">
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-[12px] text-[#8E8E93]">{{ entry.label }}</span>
                    <span class="text-[13px] font-medium" :style="{ color: entry.color }">{{ entry.mood }}</span>
                  </div>
                  <p class="mt-2 text-[13px] leading-5 text-[#6C6C70]">{{ entry.note }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 记忆详情 -->
          <div
            v-if="activeBubble === 'memory'"
            class="space-y-4"
          >
            <div class="rounded-[18px] bg-[#F2F2F7] px-4 py-3">
              <p class="text-[12px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">Memory Archive</p>
              <p class="mt-1 text-[17px] font-semibold text-[#1D1D1F]">你和分身留下的 7 段记忆</p>
            </div>
            <div class="overflow-y-auto pr-1" style="max-height: min(calc(58dvh - 120px), 360px)">
              <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">高光对话与羁绊回看</p>
              <div class="apple-card mb-4 p-4">
                <p class="text-[15px] font-medium text-[#1D1D1F]">今日最有共鸣的话</p>
                <p class="mt-2 text-[16px] leading-7 text-[#1D1D1F]/80">“最舒服的关系，是不用一直找话，也不会觉得空。”</p>
              </div>
              <div class="space-y-3">
                <div v-for="entry in memoryEntries" :key="entry.title" class="apple-card p-4">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-[15px] font-medium text-[#1D1D1F]">{{ entry.title }}</p>
                    <span class="text-[11px] text-[#8E8E93]">{{ entry.time }}</span>
                  </div>
                  <p class="mt-2 text-[13px] leading-5 text-[#6C6C70]">{{ entry.summary }}</p>
                </div>
              </div>
              <button
                type="button"
                class="secondary-button w-full py-3 text-[15px]"
                style="letter-spacing: -0.224px"
              >
                继续回看记忆
              </button>
            </div>
          </div>

          <!-- 社交详情 -->
          <div
            v-if="activeBubble === 'social'"
            class="space-y-4"
          >
            <div class="rounded-[18px] bg-[#F2F2F7] px-4 py-3">
              <p class="text-[12px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">Social Link</p>
              <p class="mt-1 text-[17px] font-semibold text-[#1D1D1F]">A2A 聊天与同频搭子</p>
            </div>
            <div class="overflow-y-auto pr-1" style="max-height: min(calc(58dvh - 120px), 360px)">
              <!-- Agent LLM 对话卡片 -->
              <div
                class="agent-llm-card mb-4 cursor-pointer"
                @click="openAgentDialog"
              >
                <div class="flex items-center justify-center gap-3 py-3">
                  <!-- Agent 1 头像 - 男孩子 -->
                  <div class="agent-avatar agent-1">
                    <span class="text-[20px]">👦</span>
                  </div>

                  <!-- 脉冲连接线 -->
                  <div class="pulse-line">
                    <div class="pulse-dot"></div>
                    <div class="dashed-line"></div>
                  </div>

                  <!-- Agent 2 头像 - 女孩子 -->
                  <div class="agent-avatar agent-2">
                    <span class="text-[20px]">👧</span>
                  </div>
                </div>
                <p class="text-center text-[12px] text-[#8E8E93] mt-2">您的分身找到新的匹配灵魂了</p>
              </div>
              
              <p class="mb-4 text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">最近会话与同频搭子</p>
              <div class="space-y-3">
                <div v-for="thread in socialThreads" :key="thread.name" class="apple-card p-4">
                  <div class="flex items-start gap-3"> 
                    <div class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F2F7]">
                      <span class="material-symbols-outlined text-[20px]" :style="{ color: thread.accent }">person</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-3">
                        <p class="text-[15px] font-medium text-[#1D1D1F]">{{ thread.name }}</p>
                        <span class="rounded-full px-2 py-0.5 text-[11px]" :style="{ background: `${thread.accent}1A`, color: thread.accent }">{{ thread.badge }}</span>
                      </div>
                      <p class="mt-1 text-[13px] leading-5 text-[#6C6C70]">{{ thread.snippet }}</p>
                      <p class="mt-2 text-[11px] text-[#8E8E93]">{{ thread.state }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-4 grid grid-cols-1 gap-3">
                <div v-for="match in socialMatches" :key="match.name" class="apple-card p-4">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-[15px] font-medium text-[#1D1D1F]">{{ match.name }}</p>
                    <span class="text-[14px] font-semibold" :style="{ color: match.accent }">{{ match.match }}</span>
                  </div>
                  <p class="mt-2 text-[13px] leading-5 text-[#6C6C70]">{{ match.note }}</p>
                </div>
              </div>
              <button
                type="button"
                class="secondary-button mt-4 w-full py-3 text-[15px]"
                style="letter-spacing: -0.224px"
                @click="openHistory"
              >
                查看聊天历史
              </button>
            </div>
          </div>
      </CenteredOverlayCard>

      <TabBar />
    </div>
  </main>
  
  <!-- Agent 对话弹窗 -->
  <Teleport to="body">
    <Transition name="agent-dialog">
      <div
        v-if="isAgentDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="closeAgentDialog"
      >
        <div class="agent-dialog-content w-full max-w-[380px] max-h-[70dvh] rounded-[24px] border border-[#E5E5EA] bg-white/95 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl overflow-hidden">
          <!-- 头部 -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-[#E5E5EA]/50">
            <div class="flex items-center gap-3">
              <div class="flex -space-x-2">
                <div class="agent-avatar-small agent-1">
                  <span class="text-[14px]">👦</span>
                </div>
                <div class="agent-avatar-small agent-2">
                  <span class="text-[14px]">👧</span>
                </div>
              </div>
              <div>
                <p class="text-[15px] font-semibold text-[#1D1D1F]">Agent 对话</p>
                <p class="text-[11px] text-[#8E8E93]">分析用户画像中...</p>
              </div>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F7] text-[#8E8E93] hover:bg-[#E5E5EA] transition-colors"
              @click="closeAgentDialog"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          <!-- 对话内容 -->
          <div class="agent-messages overflow-y-auto px-5 py-4" style="max-height: calc(70dvh - 140px)">
            <!-- 加载动画 -->
            <div v-if="isAgentLoading && agentMessages.length === 0" class="flex items-center justify-center py-8">
              <div class="agent-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            
            <!-- 消息列表 -->
            <div class="space-y-3">
              <div
                v-for="(msg, index) in agentMessages"
                :key="index"
                class="agent-message"
                :class="msg.role"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <!-- Agent1 消息 - 左侧 -->
                <div v-if="msg.role === 'agent1'" class="flex items-start gap-2">
                  <div class="agent-avatar-xs agent1">
                    <span class="text-[12px]">👦</span>
                  </div>
                  <div class="agent-bubble agent1-bubble">
                    <p class="text-[13px] leading-5 text-[#1D1D1F]">{{ msg.content }}</p>
                  </div>
                </div>
                <!-- Agent2 消息 - 右侧 -->
                <div v-else class="flex items-start gap-2 flex-row-reverse">
                  <div class="agent-avatar-xs agent2">
                    <span class="text-[12px]">👧</span>
                  </div>
                  <div class="agent-bubble agent2-bubble">
                    <p class="text-[13px] leading-5 text-[#1D1D1F]">{{ msg.content }}</p>
                  </div>
                </div>
                <!-- 最后一条消息显示达成 emoji -->
                <div v-if="index === agentMessages.length - 1 && !isAgentLoading" class="flex justify-center mt-3">
                  <span class="text-[24px] animate-bounce">✨</span>
                  <span class="text-[24px] animate-bounce" style="animation-delay: 0.1s">🎯</span>
                  <span class="text-[24px] animate-bounce" style="animation-delay: 0.2s">✨</span>
                </div>
              </div>
            </div>
            
            <!-- 正在输入指示器 -->
            <div v-if="isAgentLoading && agentMessages.length > 0" class="flex items-center gap-2 mt-3 pl-1">
              <div class="agent-avatar-xs" :class="agentMessages.length % 2 === 0 ? 'agent1' : 'agent2'">
                <span class="text-[12px]">
                  {{ agentMessages.length % 2 === 0 ? '👦' : '👧' }}
                </span>
              </div>
              <div class="agent-typing-indicator small">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            <!-- 底部按钮 -->
            <div v-if="!isAgentLoading && agentMessages.length > 0" class="mt-4 pt-3 border-t border-[#E5E5EA]/50">
              <button
                type="button"
                class="w-full py-3 px-4 bg-gradient-to-r from-[#9B8EC4] to-[#6BBFA3] text-white font-medium text-[15px] rounded-[12px] hover:opacity-90 transition-opacity flex items-center justify-center"
                @click="closeAgentDialog"
              >
                认识一下
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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

/* Agent LLM 卡片样式 */
.agent-llm-card {
  background: linear-gradient(135deg, rgba(155, 142, 196, 0.08) 0%, rgba(107, 191, 163, 0.08) 100%);
  border: 1px solid rgba(155, 142, 196, 0.2);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.agent-llm-card:hover {
  background: linear-gradient(135deg, rgba(155, 142, 196, 0.12) 0%, rgba(107, 191, 163, 0.12) 100%);
  border-color: rgba(155, 142, 196, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(155, 142, 196, 0.15);
}

/* Agent 头像 */
.agent-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.agent-avatar.agent-1 {
  background: linear-gradient(135deg, #9B8EC4 0%, #B8A9D9 100%);
  color: white;
}

.agent-avatar.agent-2 {
  background: linear-gradient(135deg, #6BBFA3 0%, #8DD4BD 100%);
  color: white;
}

.agent-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.agent-avatar-small.agent-1 {
  background: linear-gradient(135deg, #9B8EC4 0%, #B8A9D9 100%);
  color: white;
}

.agent-avatar-small.agent-2 {
  background: linear-gradient(135deg, #6BBFA3 0%, #8DD4BD 100%);
  color: white;
}

.agent-avatar-xs {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.agent-avatar-xs.agent1 {
  background: linear-gradient(135deg, #9B8EC4 0%, #B8A9D9 100%);
  color: white;
}

.agent-avatar-xs.agent2 {
  background: linear-gradient(135deg, #6BBFA3 0%, #8DD4BD 100%);
  color: white;
}

/* 脉冲虚线 */
.pulse-line {
  position: relative;
  width: 80px;
  height: 2px;
  display: flex;
  align-items: center;
}

.dashed-line {
  width: 100%;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    #C7C7CC 0px,
    #C7C7CC 4px,
    transparent 4px,
    transparent 8px
  );
}

.pulse-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #9B8EC4 0%, #6BBFA3 100%);
  border-radius: 50%;
  left: 0;
  animation: pulseMove 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(155, 142, 196, 0.5);
}

@keyframes pulseMove {
  /* 左 → 右 */
  0% {
    left: 0;
    opacity: 0;
    transform: scale(0.5);
  }
  5% {
    opacity: 1;
    transform: scale(1);
  }
  45% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    left: 100%;
    opacity: 0;
    transform: scale(0.5);
  }
  /* 短暂停顿 */
  55% {
    left: 100%;
    opacity: 0;
    transform: scale(0.5);
  }
  /* 右 → 左 */
  55.01% {
    left: 100%;
    opacity: 0;
    transform: scale(0.5);
  }
  60% {
    opacity: 1;
    transform: scale(1);
  }
  95% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    left: 0;
    opacity: 0;
    transform: scale(0.5);
  }
}

/* 弹窗动画 */
.agent-dialog-enter-active,
.agent-dialog-leave-active {
  transition: all 0.3s ease;
}

.agent-dialog-enter-from,
.agent-dialog-leave-to {
  opacity: 0;
}

.agent-dialog-enter-from .agent-dialog-content,
.agent-dialog-leave-to .agent-dialog-content {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

.agent-dialog-content {
  transition: all 0.3s ease;
}

/* 消息气泡 */
.agent-message {
  animation: messageSlideIn 0.4s ease forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes messageSlideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.agent-bubble {
  background: #F2F2F7;
  border-radius: 12px;
  padding: 10px 14px;
  max-width: calc(100% - 50px);
}

.agent-bubble.agent1-bubble {
  background: linear-gradient(135deg, #E8E4F3 0%, #F0EDF7 100%);
  border-bottom-left-radius: 4px;
}

.agent-bubble.agent2-bubble {
  background: linear-gradient(135deg, #E0F2EC 0%, #E8F5F0 100%);
  border-bottom-right-radius: 4px;
}

/* 正在输入指示器 */
.agent-typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #F2F2F7;
  border-radius: 20px;
}

.agent-typing-indicator.small {
  padding: 8px 12px;
}

.agent-typing-indicator span {
  width: 8px;
  height: 8px;
  background: #8E8E93;
  border-radius: 50%;
  animation: typingBounce 1.4s ease-in-out infinite both;
}

.agent-typing-indicator.small span {
  width: 6px;
  height: 6px;
}

.agent-typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.agent-typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 滚动条样式 */
.agent-messages::-webkit-scrollbar {
  width: 4px;
}

.agent-messages::-webkit-scrollbar-track {
  background: transparent;
}

.agent-messages::-webkit-scrollbar-thumb {
  background: #C7C7CC;
  border-radius: 2px;
}

</style>
