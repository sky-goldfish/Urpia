<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { POIIndoorData } from '../../../../stores/poiStore'

interface Props {
  poiData: POIIndoorData | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'hotspot-click', hotspotId: string): void
}>()

const INDOOR_MOVE_SPEED = 3.8
const INDOOR_BOUNDS = 6.8
const JOYSTICK_RADIUS = 34

const sceneContainer = ref<HTMLDivElement | null>(null)
const joystickRef = ref<HTMLDivElement | null>(null)
const isSceneReady = ref(false)
const hasLoadError = ref(false)
const joystickActive = ref(false)
const joystickOffset = ref({ x: 0, y: 0 })

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let modelRoot: THREE.Object3D | null = null
let dracoLoader: DRACOLoader | null = null
let frameId = 0
let pointerActive = false
let lastPointer = { x: 0, y: 0 }
let lastFrameTime = 0
let roamInput = new THREE.Vector2(0, 0)
let panTarget = new THREE.Vector3(0, 1.6, 0)
let cameraOffset = new THREE.Vector3(0, 4.2, 11.5)

const logDebug = (message: string, payload?: Record<string, unknown>) => {
  if (!import.meta.env.DEV) {
    return
  }

  if (payload) {
    console.info(`[IndoorScene] ${message}`, payload)
  } else {
    console.info(`[IndoorScene] ${message}`)
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const applyCamera = () => {
  if (!camera) {
    return
  }

  camera.position.copy(panTarget.clone().add(cameraOffset))
  camera.lookAt(panTarget)
}

const resizeRenderer = () => {
  if (!sceneContainer.value || !renderer || !camera) {
    return
  }

  const width = sceneContainer.value.clientWidth
  const height = sceneContainer.value.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / Math.max(height, 1)
  camera.updateProjectionMatrix()
}

const disposeScene = (reason = 'dispose') => {
  if (frameId) {
    cancelAnimationFrame(frameId)
    frameId = 0
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

  if (renderer?.domElement.parentElement === sceneContainer.value) {
    renderer.domElement.remove()
  }

  renderer?.dispose()
  dracoLoader?.dispose()
  renderer = null
  scene = null
  camera = null
  modelRoot = null
  dracoLoader = null

  logDebug('disposeScene', {
    reason,
    poiId: props.poiData?.id,
    modelUrl: props.poiData?.primaryModelUrl,
  })
}

const fitModel = (root: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxAxis = Math.max(size.x, size.y, size.z)

  root.position.sub(center)

  const scale = maxAxis > 0 ? 8.5 / maxAxis : 1
  root.scale.setScalar(scale)

  const fittedBox = new THREE.Box3().setFromObject(root)
  root.position.y -= fittedBox.min.y

  if (!props.poiData?.fixedCamera) {
    panTarget = new THREE.Vector3(0, Math.max(fittedBox.max.y * 0.36, 1.4), 0)
    cameraOffset = new THREE.Vector3(0, Math.max(fittedBox.max.y * 0.24, 3.8), Math.max(maxAxis * 1.35, 10.5))
  }
}

const animate = (timestamp: number) => {
  if (!renderer || !scene || !camera) {
    return
  }

  const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.05)
  lastFrameTime = timestamp

  if (Math.hypot(roamInput.x, roamInput.y) > 0.08) {
    panTarget.x = clamp(panTarget.x + roamInput.x * INDOOR_MOVE_SPEED * dt, -INDOOR_BOUNDS, INDOOR_BOUNDS)
    panTarget.z = clamp(panTarget.z + roamInput.y * INDOOR_MOVE_SPEED * dt, -INDOOR_BOUNDS, INDOOR_BOUNDS)
    applyCamera()
  }

  renderer.render(scene, camera)
  frameId = requestAnimationFrame(animate)
}

const initScene = async () => {
  if (!sceneContainer.value || !props.poiData?.primaryModelUrl) {
    return
  }

  try {
    hasLoadError.value = false
    isSceneReady.value = false
    logDebug('initScene start', {
      poiId: props.poiData.id,
      modelUrl: props.poiData.primaryModelUrl,
      canEnter: props.poiData.canEnter,
    })

    scene = new THREE.Scene()
    scene.background = new THREE.Color('#0b0c10')

    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000)

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.04

    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      console.warn('[IndoorScene] WebGL context lost.', {
        poiId: props.poiData?.id,
        modelUrl: props.poiData?.primaryModelUrl,
      })
    })

    sceneContainer.value.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight('#ffffff', 1.9))

    const key = new THREE.DirectionalLight('#fff8ef', 2.3)
    key.position.set(8, 10, 10)
    scene.add(key)

    const fill = new THREE.DirectionalLight('#dce8ff', 1.1)
    fill.position.set(-8, 6, 4)
    scene.add(fill)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(24, 64),
      new THREE.MeshBasicMaterial({
        color: '#5f6470',
        transparent: true,
        opacity: 0.08,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0.02
    scene.add(floor)

    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    dracoLoader.setDecoderConfig({ type: 'wasm' })

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    const gltf = await loader.loadAsync(props.poiData.primaryModelUrl)

    modelRoot = gltf.scene
    fitModel(modelRoot)
    scene.add(modelRoot)

    if (props.poiData.fixedCamera) {
      const { position, target } = props.poiData.fixedCamera
      panTarget = new THREE.Vector3(...target)
      cameraOffset = new THREE.Vector3(position[0] - target[0], position[1] - target[1], position[2] - target[2])
    }

    applyCamera()
    resizeRenderer()
    isSceneReady.value = true
    lastFrameTime = performance.now()
    frameId = requestAnimationFrame(animate)

    logDebug('initScene success', {
      poiId: props.poiData.id,
      modelUrl: props.poiData.primaryModelUrl,
    })
  } catch (error) {
    console.error('[IndoorScene] Failed to load indoor model.', {
      poiId: props.poiData?.id,
      modelUrl: props.poiData?.primaryModelUrl,
      error,
    })
    hasLoadError.value = true
    disposeScene('init-failed')
  }
}

const reloadScene = async () => {
  disposeScene('reload')
  await initScene()
}

const onHotspotClick = (hotspotId: string) => {
  emit('hotspot-click', hotspotId)
}

const handlePointerDown = (event: PointerEvent) => {
  pointerActive = true
  lastPointer = { x: event.clientX, y: event.clientY }
}

const handlePointerMove = (event: PointerEvent) => {
  if (!pointerActive) {
    return
  }

  const deltaX = event.clientX - lastPointer.x
  const deltaY = event.clientY - lastPointer.y
  lastPointer = { x: event.clientX, y: event.clientY }

  panTarget.x = clamp(panTarget.x - deltaX * 0.02, -INDOOR_BOUNDS, INDOOR_BOUNDS)
  panTarget.z = clamp(panTarget.z - deltaY * 0.02, -INDOOR_BOUNDS, INDOOR_BOUNDS)
  applyCamera()
}

const handlePointerUp = () => {
  pointerActive = false
}

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
  const limitedDistance = Math.min(distance, JOYSTICK_RADIUS)
  const angle = Math.atan2(deltaY, deltaX)
  const x = Math.cos(angle) * limitedDistance
  const y = Math.sin(angle) * limitedDistance

  joystickOffset.value = { x, y }
  roamInput = new THREE.Vector2(clamp(x / JOYSTICK_RADIUS, -1, 1), clamp(y / JOYSTICK_RADIUS, -1, 1))
}

const resetJoystick = () => {
  joystickActive.value = false
  joystickOffset.value = { x: 0, y: 0 }
  roamInput = new THREE.Vector2(0, 0)
  window.removeEventListener('pointermove', handleJoystickMove)
  window.removeEventListener('pointerup', handleJoystickUp)
  logDebug('joystick stop', {
    poiId: props.poiData?.id,
  })
}

const handleJoystickMove = (event: PointerEvent) => {
  if (!joystickActive.value) {
    return
  }

  updateJoystick(event.clientX, event.clientY)
}

const handleJoystickUp = () => {
  resetJoystick()
}

const startJoystick = (event: PointerEvent) => {
  joystickActive.value = true
  updateJoystick(event.clientX, event.clientY)
  window.addEventListener('pointermove', handleJoystickMove)
  window.addEventListener('pointerup', handleJoystickUp)
  logDebug('joystick start', {
    poiId: props.poiData?.id,
  })
}

watch(
  () => props.poiData?.primaryModelUrl,
  async (nextModelUrl, previousModelUrl) => {
    if (!nextModelUrl || nextModelUrl === previousModelUrl) {
      return
    }

    await reloadScene()
  },
)

onMounted(() => {
  void initScene()
  window.addEventListener('resize', resizeRenderer)
  window.addEventListener('pointerup', handlePointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeRenderer)
  window.removeEventListener('pointerup', handlePointerUp)
  resetJoystick()
  disposeScene('unmount')
})
</script>

<template>
  <div
    ref="sceneContainer"
    class="indoor-scene"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
  >
    <div v-if="!isSceneReady && !hasLoadError" class="scene-placeholder">
      <div class="placeholder-grid">
        <div v-for="n in 9" :key="n" class="grid-cell"></div>
      </div>
    </div>

    <div v-else-if="hasLoadError" class="scene-error">
      <p>室内模型加载失败</p>
      <span>{{ poiData?.name }}</span>
    </div>

    <div class="hotspot-layer">
      <button
        v-for="hotspot in props.poiData?.hotspots || []"
        :key="hotspot.id"
        class="hotspot-button"
        :style="{
          left: `${hotspot.x}%`,
          top: `${hotspot.y}%`,
        }"
        @click="onHotspotClick(hotspot.id)"
      >
        <span class="hotspot-pulse"></span>
        <span class="hotspot-icon">{{ hotspot.icon || '✦' }}</span>
      </button>
    </div>

    <div class="scene-overlay">
      <div class="area-indicator">
        <span class="area-label">{{ props.poiData?.currentArea || '主区域' }}</span>
      </div>
    </div>

    <div class="indoor-joystick-wrap">
      <div
        ref="joystickRef"
        class="indoor-joystick"
        style="touch-action: none;"
        @pointerdown.prevent="startJoystick"
      >
        <div class="indoor-joystick-ring"></div>
        <div
          class="indoor-joystick-knob"
          :style="{
            left: `calc(50% + ${joystickOffset.x}px)`,
            top: `calc(50% + ${joystickOffset.y}px)`,
            transform: 'translate(-50%, -50%)',
          }"
        >
          <span>◎</span>
        </div>
      </div>
      <p class="indoor-joystick-tip">摇杆漫游</p>
    </div>
  </div>
</template>

<style scoped>
.indoor-scene {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
  overflow: hidden;
}

:deep(canvas) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.scene-placeholder,
.scene-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%);
  z-index: 1;
}

.scene-error {
  flex-direction: column;
  gap: 8px;
  color: white;
}

.placeholder-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  opacity: 0.3;
}

.grid-cell {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
  border-radius: 12px;
  animation: pulse 2s ease-in-out infinite;
}

.grid-cell:nth-child(2) { animation-delay: 0.2s; }
.grid-cell:nth-child(3) { animation-delay: 0.4s; }
.grid-cell:nth-child(4) { animation-delay: 0.6s; }
.grid-cell:nth-child(5) { animation-delay: 0.8s; }
.grid-cell:nth-child(6) { animation-delay: 1s; }
.grid-cell:nth-child(7) { animation-delay: 1.2s; }
.grid-cell:nth-child(8) { animation-delay: 1.4s; }
.grid-cell:nth-child(9) { animation-delay: 1.6s; }

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

.hotspot-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hotspot-button {
  position: absolute;
  width: 48px;
  height: 48px;
  border: none;
  background: none;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
}

.hotspot-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.3);
  animation: hotspot-pulse 2s ease-out infinite;
}

.hotspot-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  border-radius: 50%;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
}

@keyframes hotspot-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.scene-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.area-indicator {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 92px);
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
}

.area-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.86);
}

.indoor-joystick-wrap {
  position: absolute;
  left: 18px;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.indoor-joystick {
  position: relative;
  width: 102px;
  height: 102px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.24);
}

.indoor-joystick-ring {
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.indoor-joystick-knob {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #0f1014;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
}

.indoor-joystick-tip {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 0.04em;
}
</style>
