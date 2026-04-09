<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import UnifiedMapContainer from '../../components/map/UnifiedMapContainer.vue'
import { useExploreMap } from './useExploreMap'
import { readStoredProfileAvatarImageUrl, readStoredProfileModelUrl } from '../profile/profileModel.config'
import { storeCatalog, type StoreCatalogItem } from '../../config/storeCatalog'
import { exploreMoodOptions, type ExploreMoodKey } from './exploreMap.config'

const {
  mapRef,
  locateUser,
} = useExploreMap()
const router = useRouter()

// 地图切换功能 - 默认使用高德地图
const currentMapProvider = ref<'mapbox' | 'amap'>('amap')
const toggleMapProvider = () => {
  currentMapProvider.value = currentMapProvider.value === 'amap' ? 'mapbox' : 'amap'
}

const joystickRef = ref<HTMLDivElement | null>(null)
const joystickActive = ref(false)
const knobOffset = ref({ x: 0, y: 0 })
const joystickRadius = 34
const avatarModelUrl = computed(() => readStoredProfileModelUrl())
const avatarImageUrl = computed(() => readStoredProfileAvatarImageUrl())
const activeEnterStore = ref<StoreCatalogItem | null>(null)
const activeStoryStore = ref<StoreCatalogItem | null>(null)

// 情绪标签切换
const selectedMood = ref<ExploreMoodKey | null>(null)
const isMoodSelectorOpen = ref(false)

const toggleMoodSelector = () => {
  isMoodSelectorOpen.value = !isMoodSelectorOpen.value
}

const selectMood = (mood: ExploreMoodKey) => {
  selectedMood.value = selectedMood.value === mood ? null : mood
  isMoodSelectorOpen.value = false
}

const clearMood = () => {
  selectedMood.value = null
  isMoodSelectorOpen.value = false
}

const mockStoreStories: Record<string, { text: string; images: string[] }> = {
  'seven-eleven-zhongxing': {
    text: '下班后路过这家 7-ELEVEn，总会进去补一瓶冰饮和一个饭团。夜里园区人少的时候，门口的灯光会显得特别安静，很适合一个人慢慢往回走。',
    images: ['/avatars/girl-01.jpg', '/avatars/boy-01.jpg', '/avatars/girl-02.jpg'],
  },
  'peets-changtai': {
    text: '长泰这家皮爷适合临时开个小会，靠窗的位置安静，咖啡香也比较稳。周末如果来得早，光线会很好拍照。',
    images: ['/avatars/boy-02.jpg', '/avatars/girl-03.jpg'],
  },
  'wagas-huizhi': {
    text: '汇智这边的 Wagas 整体更像一个轻松的 brunch 点位，午后人多但不嘈杂，适合和朋友见面时慢慢聊。',
    images: ['/avatars/girl-04.jpg', '/avatars/boy-03.jpg', '/avatars/girl-05.jpg', '/avatars/boy-04.jpg'],
  },
}

const fallbackStory = {
  text: '这是一条模拟的小红书探店内容。之后你把真实帖子放进来时，这里会替换成对应门店的正文内容，下面的图片也会按小方格形式展示。',
  images: ['/avatars/girl-01.jpg', '/avatars/boy-01.jpg', '/avatars/girl-02.jpg'],
}

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

const activeStoryContent = computed(() => {
  if (!activeStoryStore.value) {
    return null
  }

  return mockStoreStories[activeStoryStore.value.id] || {
    text: `${activeStoryStore.value.name} 的模拟帖子内容。这里先用占位文案测试弹窗展示效果，后面可以替换成你提供的小红书正文。`,
    images: fallbackStory.images,
  }
})

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const updateJoystick = (clientX: number, clientY: number) => {
  if (!joystickRef.value) {
    return
  }

  const rect = joystickRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const deltaX = clientX - centerX
  const deltaY = clientY - centerY
  const distance = Math.hypot(deltaX, deltaY)
  const limitedDistance = Math.min(distance, joystickRadius)
  const angle = Math.atan2(deltaY, deltaX)
  const x = Math.cos(angle) * limitedDistance
  const y = Math.sin(angle) * limitedDistance

  knobOffset.value = { x, y }
  mapRef.value?.setAvatarInput?.({
    x: clamp(x / joystickRadius, -1, 1),
    y: clamp(y / joystickRadius, -1, 1),
  })
}

const resetJoystick = () => {
  joystickActive.value = false
  knobOffset.value = { x: 0, y: 0 }
  mapRef.value?.setAvatarInput?.({ x: 0, y: 0 })
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!joystickActive.value) {
    return
  }

  updateJoystick(event.clientX, event.clientY)
}

const handlePointerUp = () => {
  resetJoystick()
}

const startJoystick = (event: PointerEvent) => {
  joystickActive.value = true
  updateJoystick(event.clientX, event.clientY)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
}

onBeforeUnmount(() => {
  resetJoystick()
})

const enterNearestStore = () => {
  if (!activeEnterStore.value?.canEnter) {
    return
  }

  void router.push(`/poi/${activeEnterStore.value.id}/indoor`)
}

// 店铺室内场景图片列表
const storeSceneImages = [
  '/models/store-scenes/1 (1).png',
  '/models/store-scenes/1 (2).png',
  '/models/store-scenes/1 (3).png',
  '/models/store-scenes/1 (4).png',
  '/models/store-scenes/1 (5).png',
  '/models/store-scenes/1 (6).png',
  '/models/store-scenes/1 (7).png',
  '/models/store-scenes/1 (8).png',
  '/models/store-scenes/1 (9).png',
]

// 当前显示的室内场景图片
const currentStoreSceneImage = ref<string | null>(null)
const isStoreSceneModalOpen = ref(false)

const enterStore = (store: StoreCatalogItem) => {
  // 随机选择一张店铺场景图片
  const randomIndex = Math.floor(Math.random() * storeSceneImages.length)
  currentStoreSceneImage.value = storeSceneImages[randomIndex]
  isStoreSceneModalOpen.value = true
}

const closeStoreSceneModal = () => {
  isStoreSceneModalOpen.value = false
  currentStoreSceneImage.value = null
}

const openStoreStory = (store: StoreCatalogItem) => {
  activeStoryStore.value = store
}

const closeStoreStory = () => {
  activeStoryStore.value = null
}
</script>

<template>
  <main class="device-shell overflow-visible">
    <div class="relative h-[100dvh] w-full overflow-hidden">
      <UnifiedMapContainer
        ref="mapRef"
        class="absolute inset-0 z-0"
        :markers="[]"
        :store-markers="storeCatalog"
        :zoom="14"
        :enable-avatar="true"
        :avatar-model-url="avatarModelUrl"
        :avatar-image-url="avatarImageUrl"
        :force-provider="currentMapProvider"
        @nearest-premium-change="activeEnterStore = $event"
        @store-locator-click="openStoreStory"
      />

      <div class="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-white/90 via-white/45 to-transparent px-4 pb-10 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div class="pointer-events-auto flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Explore</p>
              <!-- 地图切换按钮 - 在Explore右侧 -->
              <div class="map-switcher" @click="toggleMapProvider">
                <div class="switcher-indicator" :class="currentMapProvider"></div>
                <span class="switcher-label">{{ currentMapProvider === 'amap' ? '高德' : 'Mapbox' }}</span>
              </div>
            </div>
            <h1 class="mt-1 text-[24px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.5px;">城市情绪地图</h1>
          </div>
          <div class="flex items-start gap-3">
            <!-- 情绪标签切换按钮 -->
            <div class="relative">
              <button
                type="button"
                class="flex h-11 items-center gap-1.5 rounded-full bg-white/92 px-3 shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all"
                :class="selectedMood ? 'ring-2' : ''"
                :style="selectedMood ? { ringColor: exploreMoodOptions.find(m => m.key === selectedMood)?.color } : {}"
                @click="toggleMoodSelector"
              >
                <span v-if="selectedMood" class="text-[20px]">{{ exploreMoodOptions.find(m => m.key === selectedMood)?.emoji }}</span>
                <span v-else class="material-symbols-outlined text-[20px] text-[#6C6C6C]">mood</span>
                <span v-if="selectedMood" class="text-[13px] font-medium" :style="{ color: exploreMoodOptions.find(m => m.key === selectedMood)?.color }">
                  {{ exploreMoodOptions.find(m => m.key === selectedMood)?.label }}
                </span>
              </button>

              <!-- 情绪标签选择器下拉菜单 -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 scale-95 -translate-y-2"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-95 -translate-y-2"
              >
                <div
                  v-if="isMoodSelectorOpen"
                  class="absolute right-0 top-full mt-2 w-[160px] rounded-[16px] bg-white/95 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl"
                >
                  <div class="space-y-1">
                    <button
                      v-for="mood in exploreMoodOptions"
                      :key="mood.key"
                      type="button"
                      class="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[#F2F2F7]"
                      :class="selectedMood === mood.key ? 'bg-[#F2F2F7]' : ''"
                      @click="selectMood(mood.key)"
                    >
                      <span class="text-[18px]">{{ mood.emoji }}</span>
                      <span class="text-[14px] font-medium text-[#1D1D1F]">{{ mood.label }}</span>
                      <span v-if="selectedMood === mood.key" class="material-symbols-outlined ml-auto text-[16px]" :style="{ color: mood.color }">check</span>
                    </button>
                    <div v-if="selectedMood" class="border-t border-[#E5E5EA] pt-1 mt-1">
                      <button
                        type="button"
                        class="flex w-full items-center justify-center gap-1 rounded-[10px] px-3 py-2 text-[13px] text-[#8E8E93] transition-colors hover:bg-[#F2F2F7]"
                        @click="clearMood"
                      >
                        <span class="material-symbols-outlined text-[16px]">close</span>
                        <span>清除筛选</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full bg-white/92 shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
              @click="locateUser"
            >
              <span class="material-symbols-outlined text-[20px] text-[#6C6C6C]">my_location</span>
            </button>
          </div>
        </div>
      </div>

      <div class="absolute bottom-[calc(74px+env(safe-area-inset-bottom)+16px)] left-4 z-20">
        <div
          ref="joystickRef"
          class="relative h-[96px] w-[96px] rounded-full border border-white/60 bg-white/16 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-md"
          style="touch-action: none;"
          @pointerdown.prevent="startJoystick"
        >
          <div class="absolute inset-[12px] rounded-full border border-white/40 bg-white/8"></div>
          <div
            class="absolute h-[44px] w-[44px] rounded-full border border-white/80 bg-white/90 shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
            :style="{
              left: `calc(50% + ${knobOffset.x}px)`,
              top: `calc(50% + ${knobOffset.y}px)`,
              transform: 'translate(-50%, -50%)',
            }"
          >
            <div class="absolute inset-0 flex items-center justify-center text-[18px] text-[#6C6C6C]">◎</div>
          </div>
        </div>
      </div>

      <button
        v-if="activeEnterStore"
        type="button"
        class="absolute bottom-[calc(74px+env(safe-area-inset-bottom)+18px)] right-4 z-20 rounded-full bg-[#1D1D1F] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition-transform active:scale-95"
        @click="enterNearestStore"
      >
        进入 {{ activeEnterStore.name }}
      </button>

      <Transition name="fade">
        <div
          v-if="activeStoryStore && activeStoryContent"
          class="absolute inset-0 z-30 flex items-end bg-black/28 px-4 pb-[calc(84px+env(safe-area-inset-bottom))] pt-20 backdrop-blur-[2px]"
          @click="closeStoreStory"
        >
          <div
            class="w-full rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
            @click.stop
          >
            <div class="mb-3 flex items-start justify-between gap-3">
              <div class="flex-1">
                <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Story</p>
                <h3 class="mt-1 text-[22px] font-semibold text-[#1D1D1F]">{{ activeStoryStore.name }}</h3>
                <!-- 进入室内按钮 -->
                <button
                  type="button"
                  class="mt-2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#9B8EC4] to-[#6BBFA3] px-4 py-1.5 text-[13px] font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                  @click="enterStore(activeStoryStore)"
                >
                  <span class="material-symbols-outlined text-[16px]">door_open</span>
                  <span>进入室内</span>
                </button>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C6C]"
                @click="closeStoreStory"
              >
                ✕
              </button>
            </div>

            <p class="text-[15px] leading-7 text-[#1D1D1F]">
              {{ activeStoryContent.text }}
            </p>

            <div class="mt-4 grid grid-cols-3 gap-2">
              <div
                v-for="(image, index) in activeStoryContent.images"
                :key="`${activeStoryStore.id}-${index}`"
                class="aspect-square overflow-hidden rounded-[18px] bg-[#F5F5F7]"
              >
                <img :src="image" :alt="`${activeStoryStore.name} 图片 ${index + 1}`" class="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Agent LLM 卡片 - 放在 Menu 栏上方 -->
      <div class="absolute bottom-[calc(74px+env(safe-area-inset-bottom)+8px)] left-4 right-4 z-20">
        <div
          class="agent-llm-card cursor-pointer"
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
          <p class="text-center text-[12px] text-[#8E8E93] mt-1 pb-2">您的分身找到新的匹配灵魂了</p>
        </div>
      </div>

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

  <!-- 店铺室内场景弹窗 -->
  <Teleport to="body">
    <Transition name="store-scene">
      <div
        v-if="isStoreSceneModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="closeStoreSceneModal"
      >
        <div class="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-[20px] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <!-- 关闭按钮 -->
          <button
            type="button"
            class="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-opacity hover:bg-black/60"
            @click="closeStoreSceneModal"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>

          <!-- 图片 -->
          <img
            v-if="currentStoreSceneImage"
            :src="currentStoreSceneImage"
            alt="店铺室内场景"
            class="max-h-[85vh] max-w-[85vw] object-contain"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
:deep(.device-shell) {
  overflow: visible;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 地图切换按钮 */
.map-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.95);
  padding: 4px 10px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.map-switcher:active {
  transform: scale(0.95);
}

.switcher-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.switcher-indicator.mapbox {
  background-color: #4264fb;
}

.switcher-indicator.amap {
  background-color: #00bfff;
}

.switcher-label {
  color: #333;
  font-size: 11px;
  white-space: nowrap;
}

/* Agent LLM 卡片样式 */
.agent-llm-card {
  background: linear-gradient(135deg, rgba(155, 142, 196, 0.12) 0%, rgba(107, 191, 163, 0.12) 100%);
  border: 1px solid rgba(155, 142, 196, 0.25);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.agent-llm-card:hover {
  background: linear-gradient(135deg, rgba(155, 142, 196, 0.18) 0%, rgba(107, 191, 163, 0.18) 100%);
  border-color: rgba(155, 142, 196, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(155, 142, 196, 0.2);
}

/* Agent 头像 */
.agent-avatar {
  width: 36px;
  height: 36px;
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
  width: 28px;
  height: 28px;
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
  width: 22px;
  height: 22px;
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
  width: 60px;
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
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #9B8EC4 0%, #6BBFA3 100%);
  border-radius: 50%;
  left: 0;
  animation: pulseMove 2s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(155, 142, 196, 0.5);
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

/* 店铺室内场景弹窗动画 */
.store-scene-enter-active,
.store-scene-leave-active {
  transition: all 0.3s ease;
}

.store-scene-enter-from,
.store-scene-leave-to {
  opacity: 0;
}

.store-scene-enter-from img,
.store-scene-leave-to img {
  transform: scale(0.9);
  opacity: 0;
}

.store-scene-enter-active img,
.store-scene-leave-active img {
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
  padding: 10px 14px;
  background: #F2F2F7;
  border-radius: 16px;
}

.agent-typing-indicator.small {
  padding: 6px 10px;
}

.agent-typing-indicator span {
  width: 6px;
  height: 6px;
  background: #8E8E93;
  border-radius: 50%;
  animation: typingBounce 1.4s ease-in-out infinite both;
}

.agent-typing-indicator.small span {
  width: 5px;
  height: 5px;
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
