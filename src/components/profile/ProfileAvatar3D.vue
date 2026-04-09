<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type VerticalSwipeDirection = 'up' | 'down'
type GestureMode = 'horizontal' | 'vertical' | null

interface Props {
  modelUrl: string
  fallbackImage?: string
  alt?: string
  showTip?: boolean
  tipText?: string
  enableToggle?: boolean
  enableVerticalSwipe?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTip: true,
  tipText: '左右滑动查看形象',
  enableToggle: true,
  enableVerticalSwipe: false,
})

const emit = defineEmits<{
  toggle: []
  swipeVertical: [direction: VerticalSwipeDirection]
  loadingChange: [isLoading: boolean]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isLoading = ref(true)
const hasError = ref(false)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let modelRoot: THREE.Group | null = null
let dracoLoader: DRACOLoader | null = null
let animationFrameId = 0
let rotationVelocity = 0
let currentRotation = 0
let targetRotation = 0
let lastPointerX = 0
let pointerStartX = 0
let pointerStartY = 0
let totalDeltaX = 0
let totalDeltaY = 0
let dragDistance = 0
let suppressClick = false
let gestureMode: GestureMode = null

const MODEL_VERTICAL_OFFSET = -0.95
const GESTURE_LOCK_THRESHOLD = 10
const VERTICAL_SWIPE_THRESHOLD = 54

const setCanvasSize = () => {
  if (!containerRef.value || !renderer || !camera) {
    return
  }

  const { clientWidth, clientHeight } = containerRef.value
  renderer.setSize(clientWidth, clientHeight, false)
  camera.aspect = clientWidth / Math.max(clientHeight, 1)
  camera.updateProjectionMatrix()
}

const disposeScene = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }

  modelRoot?.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()

      if (Array.isArray(child.material)) {
        child.material.forEach((material: THREE.Material) => material.dispose())
      } else {
        child.material.dispose()
      }
    }
  })

  if (renderer?.domElement.parentElement === containerRef.value) {
    renderer.domElement.remove()
  }

  renderer?.dispose()
  dracoLoader?.dispose()
  renderer = null
  scene = null
  camera = null
  modelRoot = null
  dracoLoader = null
}

const fitModelToView = (root: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxAxis = Math.max(size.x, size.y, size.z)

  root.position.sub(center)

  const scale = maxAxis > 0 ? 4.2 / maxAxis : 1
  root.scale.setScalar(scale)

  const scaledBox = new THREE.Box3().setFromObject(root)
  root.position.y -= scaledBox.min.y + 0.62
  root.position.y += MODEL_VERTICAL_OFFSET
}

const animate = () => {
  if (!renderer || !scene || !camera || !modelRoot) {
    return
  }

  rotationVelocity += (targetRotation - currentRotation) * 0.08
  rotationVelocity *= 0.86
  currentRotation += rotationVelocity
  modelRoot.rotation.y = currentRotation

  renderer.render(scene, camera)
  animationFrameId = requestAnimationFrame(animate)
}

const initScene = async () => {
  if (!containerRef.value) {
    console.debug('[ProfileAvatar3D] initScene skipped: missing container', {
      modelUrl: props.modelUrl,
    })
    return
  }

  try {
    emit('loadingChange', true)
    console.debug('[ProfileAvatar3D] initScene start', {
      modelUrl: props.modelUrl,
      size: {
        width: containerRef.value.clientWidth,
        height: containerRef.value.clientHeight,
      },
    })
    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
    camera.position.set(0, 0.45, 11.6)

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.06
    containerRef.value.appendChild(renderer.domElement)

    const hemisphereLight = new THREE.HemisphereLight('#fffaf2', '#d9d5e5', 1.7)
    const keyLight = new THREE.DirectionalLight('#fff8ef', 2.5)
    keyLight.position.set(4, 6, 7)
    const fillLight = new THREE.DirectionalLight('#dce5ff', 1.3)
    fillLight.position.set(-4, 2, 5)
    const rimLight = new THREE.DirectionalLight('#f0d7ff', 1.4)
    rimLight.position.set(0, 4, -5)
    scene.add(hemisphereLight, keyLight, fillLight, rimLight)

    const floorShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 48),
      new THREE.MeshBasicMaterial({
        color: '#b7accd',
        transparent: true,
        opacity: 0.14,
      }),
    )
    floorShadow.rotation.x = -Math.PI / 2
    floorShadow.position.set(0, -1.48, 0)
    scene.add(floorShadow)

    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    dracoLoader.setDecoderConfig({ type: 'wasm' })

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    console.debug('[ProfileAvatar3D] loader.loadAsync start', {
      modelUrl: props.modelUrl,
      decoderPath: '/draco/',
    })
    const gltf = await loader.loadAsync(props.modelUrl)
    console.debug('[ProfileAvatar3D] loader.loadAsync success', {
      modelUrl: props.modelUrl,
      childCount: gltf.scene.children.length,
    })
    modelRoot = gltf.scene
    fitModelToView(modelRoot)
    scene.add(modelRoot)

    setCanvasSize()
    isLoading.value = false
    emit('loadingChange', false)
    animate()
  } catch (error) {
    console.error('[ProfileAvatar3D] Failed to load profile avatar model.', {
      modelUrl: props.modelUrl,
      error,
    })
    hasError.value = true
    isLoading.value = false
    emit('loadingChange', false)
    disposeScene()
  }
}

const reloadScene = async () => {
  isLoading.value = true
  hasError.value = false
  emit('loadingChange', true)
  console.debug('[ProfileAvatar3D] reloadScene', {
    modelUrl: props.modelUrl,
  })
  rotationVelocity = 0
  currentRotation = 0
  targetRotation = 0
  disposeScene()
  await nextTick()
  await initScene()
}

const handlePointerDown = (event: PointerEvent) => {
  isDragging.value = true
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  lastPointerX = event.clientX
  totalDeltaX = 0
  totalDeltaY = 0
  dragDistance = 0
  suppressClick = false
  gestureMode = null
  ;(event.currentTarget as HTMLDivElement | null)?.setPointerCapture?.(event.pointerId)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value) {
    return
  }

  const deltaX = event.clientX - lastPointerX
  lastPointerX = event.clientX
  totalDeltaX = event.clientX - pointerStartX
  totalDeltaY = event.clientY - pointerStartY
  dragDistance = Math.max(dragDistance, Math.abs(totalDeltaX), Math.abs(totalDeltaY))

  if (!gestureMode && dragDistance >= GESTURE_LOCK_THRESHOLD) {
    const horizontalDistance = Math.abs(totalDeltaX)
    const verticalDistance = Math.abs(totalDeltaY)

    if (props.enableVerticalSwipe && verticalDistance > horizontalDistance * 1.08) {
      gestureMode = 'vertical'
    } else {
      gestureMode = 'horizontal'
    }
  }

  suppressClick = dragDistance >= GESTURE_LOCK_THRESHOLD

  if (gestureMode !== 'vertical') {
    targetRotation += deltaX * 0.012
  }
}

const handlePointerUp = (event: PointerEvent) => {
  if (props.enableVerticalSwipe && gestureMode === 'vertical' && Math.abs(totalDeltaY) >= VERTICAL_SWIPE_THRESHOLD) {
    console.debug('[ProfileAvatar3D] emit swipeVertical', {
      direction: totalDeltaY < 0 ? 'up' : 'down',
      totalDeltaX,
      totalDeltaY,
      modelUrl: props.modelUrl,
    })
    emit('swipeVertical', totalDeltaY < 0 ? 'up' : 'down')
  }

  isDragging.value = false
  ;(event.currentTarget as HTMLDivElement | null)?.releasePointerCapture?.(event.pointerId)
}

const handleClick = () => {
  if (!props.enableToggle) {
    return
  }

  if (suppressClick) {
    suppressClick = false
    return
  }

  emit('toggle')
}

watch(
  () => props.modelUrl,
  async (nextModelUrl, previousModelUrl) => {
    if (!previousModelUrl || nextModelUrl === previousModelUrl) {
      return
    }

    console.debug('[ProfileAvatar3D] modelUrl changed', {
      previousModelUrl,
      nextModelUrl,
    })
    await reloadScene()
  },
)

onMounted(() => {
  console.debug('[ProfileAvatar3D] mounted', {
    modelUrl: props.modelUrl,
  })
  void initScene()
  window.addEventListener('resize', setCanvasSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', setCanvasSize)
  disposeScene()
})
</script>

<template>
  <div class="profile-avatar-3d">
    <div
      ref="containerRef"
      class="viewer-shell"
      :class="{ 'is-dragging': isDragging }"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @click="handleClick"
    >
      <div v-if="isLoading" class="viewer-overlay">
        <span class="viewer-chip">模型加载中...</span>
      </div>

      <div v-else-if="hasError" class="viewer-overlay">
        <img
          v-if="fallbackImage"
          :src="fallbackImage"
          :alt="alt"
          class="fallback-avatar"
        />
        <span class="viewer-chip">3D 加载失败，已回退静态形象</span>
      </div>
    </div>

    <p v-if="showTip" class="drag-tip">{{ tipText }}</p>
  </div>
</template>

<style scoped>
.profile-avatar-3d {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.viewer-shell {
  position: relative;
  width: min(100vw - 126px, 290px);
  min-width: 236px;
  height: 314px;
  overflow: hidden;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    radial-gradient(circle at 50% 24%, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0) 58%),
    radial-gradient(circle at 50% 80%, rgba(155, 142, 196, 0.16), rgba(155, 142, 196, 0) 54%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.32));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 18px 36px rgba(97, 90, 129, 0.12);
  backdrop-filter: blur(16px);
  touch-action: none;
  cursor: grab;
}

.viewer-shell.is-dragging {
  cursor: grabbing;
}

.viewer-shell :deep(canvas) {
  width: 100%;
  height: 100%;
  display: block;
}

.viewer-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  pointer-events: none;
}

.viewer-chip {
  border-radius: 999px;
  border: 1px solid rgba(155, 142, 196, 0.26);
  background: rgba(255, 255, 255, 0.88);
  padding: 6px 12px;
  color: #7d748d;
  font-size: 12px;
  letter-spacing: -0.08px;
}

.fallback-avatar {
  height: 180px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 10px 26px rgba(0, 0, 0, 0.1));
}

.drag-tip {
  margin-top: 10px;
  color: #8e8e93;
  font-size: 12px;
  letter-spacing: -0.12px;
}

@media (max-width: 390px) {
  .viewer-shell {
    width: min(100vw - 120px, 258px);
    min-width: 212px;
    height: 278px;
  }
}
</style>
