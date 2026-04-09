<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface Props {
  modelUrl: string
  label: string
  scale?: number
  rotationY?: number
}

const props = withDefaults(defineProps<Props>(), {
  scale: 1,
  rotationY: 0,
})

const containerRef = ref<HTMLDivElement | null>(null)
const hasError = ref(false)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let modelRoot: THREE.Object3D | null = null
let dracoLoader: DRACOLoader | null = null

const logDebug = (message: string, payload?: Record<string, unknown>) => {
  if (!import.meta.env.DEV) {
    return
  }

  if (payload) {
    console.info(`[StoreModelMarker] ${message}`, payload)
  } else {
    console.info(`[StoreModelMarker] ${message}`)
  }
}

const fitModel = (root: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxAxis = Math.max(size.x, size.y, size.z)
  const fitScale = maxAxis > 0 ? (3.8 / maxAxis) * props.scale : props.scale

  root.position.sub(center)
  root.scale.setScalar(fitScale)

  const fittedBox = new THREE.Box3().setFromObject(root)
  root.position.y -= fittedBox.min.y + 0.2
  root.rotation.y = props.rotationY
}

const renderScene = () => {
  if (!renderer || !scene || !camera) {
    return
  }

  renderer.render(scene, camera)
}

const resizeCanvas = () => {
  if (!containerRef.value || !renderer || !camera) {
    return
  }

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / Math.max(height, 1)
  camera.updateProjectionMatrix()
  renderScene()
}

const disposeScene = (reason = 'dispose') => {
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

  try {
    renderer?.forceContextLoss()
  } catch (error) {
    logDebug('forceContextLoss skipped', {
      label: props.label,
      reason,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  renderer?.dispose()
  dracoLoader?.dispose()
  renderer = null
  scene = null
  camera = null
  modelRoot = null
  dracoLoader = null

  logDebug('disposeScene', {
    label: props.label,
    modelUrl: props.modelUrl,
    reason,
  })
}

const initScene = async () => {
  if (!containerRef.value) {
    return
  }

  try {
    hasError.value = false
    logDebug('initScene start', {
      label: props.label,
      modelUrl: props.modelUrl,
    })

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
    camera.position.set(0, 1.2, 8.2)

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02

    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      hasError.value = true
      console.warn('[StoreModelMarker] WebGL context lost.', {
        label: props.label,
        modelUrl: props.modelUrl,
      })
    })

    containerRef.value.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight('#ffffff', '#d8dbe8', 1.8))

    const key = new THREE.DirectionalLight('#fffef9', 2.1)
    key.position.set(4, 7, 8)
    scene.add(key)

    const fill = new THREE.DirectionalLight('#d8e4ff', 0.9)
    fill.position.set(-5, 3, 4)
    scene.add(fill)

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 32),
      new THREE.MeshBasicMaterial({
        color: '#a8b1cf',
        transparent: true,
        opacity: 0.14,
      }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -1.05
    scene.add(shadow)

    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    dracoLoader.setDecoderConfig({ type: 'wasm' })

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    const gltf = await loader.loadAsync(props.modelUrl)

    modelRoot = gltf.scene
    fitModel(modelRoot)
    scene.add(modelRoot)
    resizeCanvas()
    renderScene()

    logDebug('initScene success', {
      label: props.label,
      modelUrl: props.modelUrl,
    })
  } catch (error) {
    hasError.value = true
    console.error('[StoreModelMarker] Failed to load store model.', {
      modelUrl: props.modelUrl,
      label: props.label,
      error,
    })
    disposeScene('init-failed')
  }
}

const reloadScene = async () => {
  logDebug('reloadScene', {
    label: props.label,
    modelUrl: props.modelUrl,
  })
  disposeScene('reload')
  await nextTick()
  await initScene()
}

watch(
  () => [props.modelUrl, props.scale, props.rotationY],
  async () => {
    if (containerRef.value) {
      await reloadScene()
    }
  },
)

onMounted(() => {
  logDebug('mounted', {
    label: props.label,
    modelUrl: props.modelUrl,
  })
  void initScene()
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
  disposeScene('unmount')
})
</script>

<template>
  <div class="store-model-marker">
    <div ref="containerRef" class="store-model-canvas" />
    <div v-if="hasError" class="store-model-fallback">
      <span>{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.store-model-marker {
  position: relative;
  width: 148px;
  height: 148px;
  pointer-events: none;
}

.store-model-canvas {
  width: 100%;
  height: 100%;
}

.store-model-fallback {
  position: absolute;
  inset: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(229, 229, 234, 0.9);
  color: #1d1d1f;
  font-size: 12px;
  text-align: center;
  padding: 8px;
}
</style>
