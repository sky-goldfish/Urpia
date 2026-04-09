<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import OnboardingStepHeader from '../../components/ui/OnboardingStepHeader.vue'
import { cameraGuideContent, onboardingModelOptions } from './onboarding.config'

const router = useRouter()
const ONBOARDING_PREVIEW_INDEX_KEY = 'urpia:onboarding-preview-index'
const pointerStartX = ref(0)
const baseRotation = ref(0)
const rotation = ref(0)
const isDragging = ref(false)

const stepAngle = 360 / onboardingModelOptions.length
const selectedIndex = computed(() => {
  const normalized = ((-rotation.value % 360) + 360) % 360
  return Math.round(normalized / stepAngle) % onboardingModelOptions.length
})
const selectedModel = computed(() => onboardingModelOptions[selectedIndex.value] ?? onboardingModelOptions[0]!)

const cardStyle = (index: number) => {
  const angle = index * stepAngle + rotation.value
  const normalized = (((angle % 360) + 540) % 360) - 180
  const depth = Math.cos((normalized * Math.PI) / 180)
  const scale = 0.72 + Math.max(depth, 0) * 0.28
  const opacity = 0.28 + Math.max(depth, 0) * 0.72

  return {
    transform: `rotateY(${angle}deg) translateZ(176px) scale(${scale})`,
    opacity,
    zIndex: Math.round((depth + 1) * 100),
  }
}

const persistSelectedIndex = () => {
  window.localStorage.setItem(ONBOARDING_PREVIEW_INDEX_KEY, String(selectedIndex.value))
}

const snapToNearest = () => {
  const nearestIndex = selectedIndex.value
  rotation.value = -nearestIndex * stepAngle
  persistSelectedIndex()
  console.debug('[CameraGuide] snapToNearest', {
    nearestIndex,
    modelId: selectedModel.value.id,
  })
}

const handlePointerDown = (event: PointerEvent) => {
  isDragging.value = true
  pointerStartX.value = event.clientX
  baseRotation.value = rotation.value
  ;(event.currentTarget as HTMLDivElement | null)?.setPointerCapture?.(event.pointerId)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value) {
    return
  }

  const deltaX = event.clientX - pointerStartX.value
  rotation.value = baseRotation.value + deltaX * 0.22
}

const handlePointerUp = (event: PointerEvent) => {
  if (!isDragging.value) {
    return
  }

  isDragging.value = false
  ;(event.currentTarget as HTMLDivElement | null)?.releasePointerCapture?.(event.pointerId)
  snapToNearest()
}

const startSelection = () => {
  persistSelectedIndex()
  console.debug('[CameraGuide] startSelection -> /onboarding/confirm', {
    selectedIndex: selectedIndex.value,
    modelId: selectedModel.value.id,
    previewImage: selectedModel.value.previewImage,
  })
  void router.push('/onboarding/confirm')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding flex min-h-[100dvh] flex-col">
      <OnboardingStepHeader :step="1" :total="3" :title="cameraGuideContent.title" skip-label="" />

      <section class="flex flex-1 flex-col items-center justify-center gap-9">
        <div class="preview-stage">
          <div class="preview-glow" aria-hidden="true" />
          <div
            class="carousel-shell"
            :class="{ 'is-dragging': isDragging }"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointercancel="handlePointerUp"
          >
            <div class="carousel-ring">
              <article
                v-for="(option, index) in onboardingModelOptions"
                :key="option.id"
                class="carousel-card"
                :style="cardStyle(index)"
              >
                <img :src="option.previewImage" :alt="option.label" class="carousel-image" loading="eager" />
              </article>
            </div>
          </div>
          <div class="preview-label">
            <p class="preview-name">{{ selectedModel.label }}</p>
          </div>
        </div>
      </section>

      <footer class="flex flex-col items-center gap-5 pb-4">
        <button
          type="button"
          class="flex min-h-[58px] w-full items-center justify-center rounded-full bg-[#1D1D1F] px-6 text-[17px] font-medium text-white shadow-[0_18px_40px_rgba(0,0,0,0.16)] transition-transform active:scale-[0.98]"
          style="letter-spacing: -0.374px"
          @click="startSelection"
        >
          {{ cameraGuideContent.actionLabel }}
        </button>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.preview-stage {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-glow {
  position: absolute;
  inset: 16px 24px 68px;
  border-radius: 44px;
  background: radial-gradient(circle at center, rgba(155, 142, 196, 0.12), rgba(155, 142, 196, 0));
  filter: blur(32px);
}

.carousel-shell {
  position: relative;
  width: min(100%, 320px);
  height: 320px;
  overflow: hidden;
  border-radius: 42px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.46));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 22px 52px rgba(97, 90, 129, 0.12);
  backdrop-filter: blur(18px);
  perspective: 980px;
  cursor: grab;
  touch-action: pan-y;
}

.carousel-shell.is-dragging {
  cursor: grabbing;
}

.carousel-ring {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transform-style: preserve-3d;
}

.carousel-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 104px;
  height: 148px;
  margin-left: -52px;
  margin-top: -74px;
  border-radius: 30px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 32px rgba(97, 90, 129, 0.16);
  transition: opacity 140ms ease;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-image {
  width: 88%;
  height: 88%;
  object-fit: contain;
  object-position: center 56%;
  display: block;
}

.preview-label {
  margin-top: 16px;
  text-align: center;
}

.preview-name {
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.28px;
}
</style>
