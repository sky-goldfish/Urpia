<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import UnifiedMapContainer from '../../components/map/UnifiedMapContainer.vue'
import { useExploreMap } from './useExploreMap'
import { readStoredProfileAvatarImageUrl, readStoredProfileModelUrl } from '../profile/profileModel.config'
import { storeCatalog, type StoreCatalogItem } from '../../config/storeCatalog'

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
              <div>
                <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Story</p>
                <h3 class="mt-1 text-[22px] font-semibold text-[#1D1D1F]">{{ activeStoryStore.name }}</h3>
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

      <TabBar />
    </div>
  </main>
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
</style>
