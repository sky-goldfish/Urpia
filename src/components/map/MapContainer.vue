
<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAP_CONFIG, assertMapConfig } from '../../config/mapConfig'
import { isStoreRenderableOnMap, type StoreCatalogItem } from '../../config/storeCatalog'

type MapboxMapLike = any
type MapboxMarkerLike = any

interface MarkerItem {
  id: string
  position: [number, number]
  title?: string
  color?: string
  data?: unknown
}

interface AvatarInput {
  x: number
  y: number
}

interface Props {
  center?: [number, number]
  zoom?: number
  markers?: MarkerItem[]
  storeMarkers?: StoreCatalogItem[]
  enableAvatar?: boolean
  avatarModelUrl?: string
  avatarImageUrl?: string
  avatarInitialPosition?: [number, number]
}

interface Emits {
  (e: 'markerClick', marker: MarkerItem): void
  (e: 'mapClick', position: { lng: number; lat: number }): void
  (e: 'ready', map: MapboxMapLike): void
  (e: 'nearestPremiumChange', store: StoreCatalogItem | null): void
  (e: 'storeLocatorClick', store: StoreCatalogItem): void
}

type CharacterRole = 'player' | 'npc'
type CharacterAnimationState = 'idle' | 'walk' | 'run'

interface NpcActor {
  id: string
  modelUrl: string
  imageUrl: string
  route: [number, number][]
  routeMode: 'loop' | 'pingpong'
  speed: number
  position: [number, number]
  targetIndex: number
  direction: 1 | -1
}

interface OverlayCharacter {
  id: string
  role: CharacterRole
  modelUrl: string
  markerImageUrl: string
  markerSize: number
  position: [number, number]
  group: THREE.Group
  markerElement: HTMLDivElement
  modelRoot: THREE.Object3D | null
  mixer: THREE.AnimationMixer | null
  activeAction: THREE.AnimationAction | null
  idleAction: THREE.AnimationAction | null
  walkAction: THREE.AnimationAction | null
  runAction: THREE.AnimationAction | null
  targetYaw: number
  currentYaw: number
  isMoving: boolean
  state: CharacterAnimationState
  loading: boolean
}

interface StoreRenderRecord {
  id: string
  store: StoreCatalogItem
  modelUrl: string
  root: THREE.Object3D | null
  model: THREE.Object3D | null
  loading: boolean
  x: number
  y: number
  z: number
  mercatorScale: number
}

interface StoreLayer extends mapboxgl.CustomLayerInterface {
  syncStores: (stores: StoreCatalogItem[]) => void
  disposeStores: () => void
}

const STORE_LAYER_ID = 'urpia-store-layer'
const PLAYER_CHARACTER_ID = 'player-avatar'
const METERS_PER_DEG_LAT = 111320
const STORE_ALTITUDE = 0
const STORE_SCALE_ADJUST = 44
const AVATAR_MOVE_SPEED = 52.5
const NPC_MOVE_SPEED = 12
const AVATAR_TURN_SPEED = 0.18
const STORE_MARKER_MIN_ZOOM = 14
const STORE_MARKER_MAX_VISIBLE = 6
const STORE_MARKER_PADDING_RATIO = 0.35
const STORE_SYNC_DEBOUNCE_MS = 90
const OVERLAY_BASE_SCALE = 60
const MAP_DEBUG_NAMESPACE = '[MapContainer]'
const DEFAULT_AVATAR_INPUT: AvatarInput = { x: 0, y: 0 }

const props = withDefaults(defineProps<Props>(), {
  center: () => MAP_CONFIG.DEFAULT_CENTER,
  zoom: () => MAP_CONFIG.DEFAULT_ZOOM,
  markers: () => [],
  storeMarkers: () => [],
  enableAvatar: false,
  avatarModelUrl: '',
  avatarImageUrl: '',
  avatarInitialPosition: () => MAP_CONFIG.DEFAULT_CENTER,
})

const emit = defineEmits<Emits>()

const mapCanvasHost = ref<HTMLDivElement | null>(null)
const avatarOverlayHost = ref<HTMLDivElement | null>(null)
const map = shallowRef<MapboxMapLike | null>(null)
const mapMarkers = ref<MapboxMarkerLike[]>([])
const storeLocatorMarkers = ref<Map<string, MapboxMarkerLike>>(new Map())
const isReady = ref(false)
const errorMessage = ref('')

let storeLayer: StoreLayer | null = null
let avatarPosition: [number, number] = [...props.avatarInitialPosition]
let avatarInput: AvatarInput = { ...DEFAULT_AVATAR_INPUT }
let avatarRafId = 0
let lastFrameTime = 0
let nearestPremiumStoreId = ''
let storeSyncTimer = 0
let npcActors: NpcActor[] = []

let overlayRenderer: THREE.WebGLRenderer | null = null
let overlayScene: THREE.Scene | null = null
let overlayCamera: THREE.OrthographicCamera | null = null
let overlayLoader: GLTFLoader | null = null
let overlayDracoLoader: DRACOLoader | null = null
const overlayCharacters = new Map<string, OverlayCharacter>()

const debugEnabled = () => import.meta.env.DEV

const logDebug = (message: string, payload?: Record<string, unknown>) => {
  if (!debugEnabled()) return
  if (payload) {
    console.info(`${MAP_DEBUG_NAMESPACE} ${message}`, payload)
  } else {
    console.info(`${MAP_DEBUG_NAMESPACE} ${message}`)
  }
}

const logWarn = (message: string, payload?: Record<string, unknown>) => {
  if (payload) {
    console.warn(`${MAP_DEBUG_NAMESPACE} ${message}`, payload)
  } else {
    console.warn(`${MAP_DEBUG_NAMESPACE} ${message}`)
  }
}

const metersToLng = (meters: number, lat: number) =>
  meters / (METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180))

const metersToLat = (meters: number) => meters / METERS_PER_DEG_LAT

const distanceMeters = (from: [number, number], to: [number, number]) => {
  const dLat = (to[1] - from[1]) * METERS_PER_DEG_LAT
  const dLng = (to[0] - from[0]) * METERS_PER_DEG_LAT * Math.cos((from[1] * Math.PI) / 180)
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

const offsetCoordinate = (origin: [number, number], eastMeters: number, northMeters: number): [number, number] => [
  origin[0] + metersToLng(eastMeters, origin[1]),
  origin[1] + metersToLat(northMeters),
]

const getStoreCoordinate = (storeId: string) =>
  props.storeMarkers.find((store) => store.id === storeId)?.coordinates ?? null

const buildNpcActors = (): NpcActor[] => {
  const changtai = getStoreCoordinate('hema-changtai')
  const huizhi = getStoreCoordinate('wagas-huizhi')
  const zte = getStoreCoordinate('seven-eleven-zhongxing')

  if (!changtai || !huizhi || !zte) {
    logWarn('npc actors skipped: missing anchor stores', {
      changtai: Boolean(changtai),
      huizhi: Boolean(huizhi),
      zte: Boolean(zte),
    })
    return []
  }

  return [
    {
      id: 'npc-a',
      modelUrl: '/models/profile-avatars/girl-02.glb',
      imageUrl: '/avatars/girl-02.jpg',
      routeMode: 'loop',
      speed: NPC_MOVE_SPEED,
      route: [
        offsetCoordinate(changtai, -18, 16),
        offsetCoordinate(changtai, 8, 22),
        offsetCoordinate(changtai, 26, 4),
        offsetCoordinate(changtai, 6, -18),
      ],
      position: offsetCoordinate(changtai, -18, 16),
      targetIndex: 1,
      direction: 1,
    },
    {
      id: 'npc-b',
      modelUrl: '/models/profile-avatars/boy-03.glb',
      imageUrl: '/avatars/boy-03.jpg',
      routeMode: 'loop',
      speed: NPC_MOVE_SPEED * 0.92,
      route: [
        offsetCoordinate(huizhi, -14, 14),
        offsetCoordinate(huizhi, -22, -6),
        offsetCoordinate(huizhi, 10, -20),
        offsetCoordinate(huizhi, 22, 8),
      ],
      position: offsetCoordinate(huizhi, -14, 14),
      targetIndex: 1,
      direction: 1,
    },
    {
      id: 'npc-c',
      modelUrl: '/models/profile-avatars/girl-04.glb',
      imageUrl: '/avatars/girl-04.jpg',
      routeMode: 'pingpong',
      speed: NPC_MOVE_SPEED * 1.08,
      route: [
        offsetCoordinate(zte, -12, 10),
        offsetCoordinate(zte, 10, 18),
        offsetCoordinate(zte, 22, -2),
        offsetCoordinate(zte, -6, -16),
      ],
      position: offsetCoordinate(zte, -12, 10),
      targetIndex: 1,
      direction: 1,
    },
  ]
}

const clearMarkers = () => {
  mapMarkers.value.forEach((marker) => marker.remove())
  mapMarkers.value = []
}

const createMarker = (markerData: MarkerItem) => {
  if (!map.value) return

  const color = markerData.color || '#FF2442'
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'custom-marker'
  el.setAttribute('aria-label', markerData.title || markerData.id)
  el.style.cssText = `
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: ${color};
    border: 3px solid rgba(255,255,255,0.98);
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  `

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.12)'
    el.style.boxShadow = '0 14px 28px rgba(0,0,0,0.22)'
  })

  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
    el.style.boxShadow = '0 10px 24px rgba(0,0,0,0.18)'
  })

  el.addEventListener('click', (event) => {
    event.stopPropagation()
    emit('markerClick', markerData)
  })

  const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat(markerData.position)
    .addTo(map.value)

  mapMarkers.value.push(marker)
}

const updateMarkers = () => {
  clearMarkers()
  props.markers.forEach(createMarker)
}

const clearStoreLocatorMarkers = () => {
  storeLocatorMarkers.value.forEach((marker) => marker.remove())
  storeLocatorMarkers.value.clear()
}

const createStoreLocatorMarker = (store: StoreCatalogItem) => {
  if (!map.value) return

  const el = document.createElement('div')
  el.className = 'store-locator-marker'
  el.setAttribute('aria-label', `${store.name} 位置`)
  el.title = store.name
  el.style.cssText = `
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(29,29,31,0.08);
    box-shadow: 0 8px 18px rgba(0,0,0,0.18);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    pointer-events: auto;
  `
  el.textContent = '⭐'

  el.addEventListener('click', (event) => {
    event.stopPropagation()
    emit('storeLocatorClick', store)
  })

  const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
    .setLngLat(store.coordinates)
    .addTo(map.value)

  storeLocatorMarkers.value.set(store.id, marker)
}

const syncStoreLocatorMarkers = () => {
  if (!map.value || !isReady.value) return

  const renderableStores = props.storeMarkers.filter((store) => isStoreRenderableOnMap(store))
  const nextIds = new Set(renderableStores.map((store) => store.id))

  storeLocatorMarkers.value.forEach((marker, storeId) => {
    if (!nextIds.has(storeId)) {
      marker.remove()
      storeLocatorMarkers.value.delete(storeId)
    }
  })

  renderableStores.forEach((store) => {
    if (!storeLocatorMarkers.value.has(store.id)) {
      createStoreLocatorMarker(store)
    }
  })
}

const padBounds = (bounds: mapboxgl.LngLatBounds, ratio: number) => {
  const west = bounds.getWest()
  const east = bounds.getEast()
  const south = bounds.getSouth()
  const north = bounds.getNorth()
  const lngPad = (east - west) * ratio
  const latPad = (north - south) * ratio

  return new mapboxgl.LngLatBounds(
    [west - lngPad, south - latPad],
    [east + lngPad, north + latPad],
  )
}

const isInBounds = (bounds: mapboxgl.LngLatBounds, coordinates: [number, number]) =>
  bounds.contains(coordinates)

const scheduleStoreSync = () => {
  if (storeSyncTimer) {
    clearTimeout(storeSyncTimer)
  }

  storeSyncTimer = window.setTimeout(() => {
    storeSyncTimer = 0
    syncVisibleStores()
  }, STORE_SYNC_DEBOUNCE_MS)
}

const fitStoreModel = (root: THREE.Object3D, store: StoreCatalogItem) => {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxAxis = Math.max(size.x, size.y, size.z)
  // 缩小到原来的25%：基础缩放从6.4改为1.6，默认mapScale从1.4改为0.35
  const fitScale = maxAxis > 0 ? (1.6 / maxAxis) * (store.mapScale ?? 0.35) : 0.35

  root.position.sub(center)
  root.scale.setScalar(fitScale)

  const fittedBox = new THREE.Box3().setFromObject(root)
  // 将建筑物向上移动，使其显示在星标上方（增加Y轴偏移量）
  root.position.y -= fittedBox.min.y
  // 调整模型旋转：默认 facing camera (正面)，可通过 mapRotationY 覆盖
  root.rotation.y = store.mapRotationY ?? - Math.PI / 2
}

const createStoreLayer = (mapInstance: MapboxMapLike): StoreLayer => {
  let camera: THREE.Camera
  let scene: THREE.Scene
  let renderer: THREE.WebGLRenderer
  let dracoLoader: DRACOLoader | null = null
  let gltfLoader: GLTFLoader | null = null
  const storeRecords = new Map<string, StoreRenderRecord>()

  const refreshMercator = (record: StoreRenderRecord) => {
    const coordinate = mapboxgl.MercatorCoordinate.fromLngLat(record.store.coordinates, STORE_ALTITUDE)
    record.x = coordinate.x
    record.y = coordinate.y
    record.z = coordinate.z
    record.mercatorScale = coordinate.meterInMercatorCoordinateUnits() * STORE_SCALE_ADJUST
  }

  const disposeRecord = (record: StoreRenderRecord) => {
    record.model?.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((material: THREE.Material) => material.dispose())
        } else {
          child.material.dispose()
        }
      }
    })

    if (record.root) {
      scene.remove(record.root)
    }
  }

  const loadStoreModel = async (record: StoreRenderRecord) => {
    if (!gltfLoader || record.loading || record.root) {
      return
    }

    record.loading = true

    try {
      const gltf = await gltfLoader.loadAsync(record.modelUrl)
      record.model = gltf.scene
      
      // 优化模型材质以减少锯齿和方块化
      record.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // 启用阴影
          child.castShadow = true
          child.receiveShadow = true
          
          // 优化材质
          if (child.material) {
            // 如果材质是数组，遍历所有材质
            const materials = Array.isArray(child.material) ? child.material : [child.material]
            materials.forEach((mat) => {
              // 启用各向异性过滤以提高纹理质量
              if (mat.map) {
                mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy()
                mat.map.minFilter = THREE.LinearMipmapLinearFilter
                mat.map.magFilter = THREE.LinearFilter
              }
              // 启用平滑着色
              mat.flatShading = false
            })
          }
        }
      })
      
      fitStoreModel(record.model, record.store)
      record.root = new THREE.Group()
      record.root.matrixAutoUpdate = false
      record.root.add(record.model)
      scene.add(record.root)
      mapInstance.triggerRepaint()
    } catch (error) {
      console.error('[MapContainer] Failed to load store model in store layer.', {
        id: record.id,
        name: record.store.name,
        modelUrl: record.modelUrl,
        error,
      })
    } finally {
      record.loading = false
    }
  }

  return {
    id: STORE_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',

    syncStores(stores) {
      const nextIds = new Set(stores.map((store) => store.id))

      storeRecords.forEach((record, storeId) => {
        if (!nextIds.has(storeId)) {
          disposeRecord(record)
          storeRecords.delete(storeId)
        }
      })

      stores.forEach((store) => {
        const modelUrl = store.exteriorModelUrl || store.signboardModelUrl
        const existing = storeRecords.get(store.id)

        if (existing) {
          existing.store = store
          existing.modelUrl = modelUrl
          refreshMercator(existing)
          return
        }

        const record: StoreRenderRecord = {
          id: store.id,
          store,
          modelUrl,
          root: null,
          model: null,
          loading: false,
          x: 0,
          y: 0,
          z: 0,
          mercatorScale: 0,
        }

        refreshMercator(record)
        storeRecords.set(store.id, record)
        void loadStoreModel(record)
      })
    },

    disposeStores() {
      storeRecords.forEach((record) => disposeRecord(record))
      storeRecords.clear()
    },

    onAdd(_map, gl) {
      camera = new THREE.Camera()
      scene = new THREE.Scene()

      const ambient = new THREE.AmbientLight(0xffffff, 2.6)
      const key = new THREE.DirectionalLight(0xffffff, 2.1)
      key.position.set(12, 16, 18)
      const fill = new THREE.DirectionalLight(0xdbe7ff, 1.25)
      fill.position.set(-10, 10, 12)
      scene.add(ambient, key, fill)

      dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/')
      dracoLoader.setDecoderConfig({ type: 'wasm' })

      gltfLoader = new GLTFLoader()
      gltfLoader.setDRACOLoader(dracoLoader)

      renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true,
        powerPreference: 'high-performance',
      })
      renderer.autoClear = false
      renderer.outputColorSpace = THREE.SRGBColorSpace
      
      // 启用阴影和更好的渲染质量
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.0
    },

    onRemove() {
      storeRecords.forEach((record) => disposeRecord(record))
      storeRecords.clear()
      dracoLoader?.dispose()
      renderer?.dispose()
    },

    render(_gl, matrix) {
      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix)

      // 获取当前地图缩放级别，用于动态调整建筑物大小
      const currentZoom = mapInstance.getZoom?.() ?? 14
      // 调整缩放比例关系 - 与人物模型保持一致
      const zoomScale = Math.pow(1.5, currentZoom - 14)

      storeRecords.forEach((record) => {
        if (!record.root) return

        const translation = new THREE.Matrix4().makeTranslation(record.x, record.y, record.z)
        // 应用基于地图缩放的动态缩放
        const dynamicScale = record.mercatorScale * zoomScale
        const scaling = new THREE.Matrix4().makeScale(dynamicScale, -dynamicScale, dynamicScale)
        const baseRotation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ'))

        record.root.matrix.copy(translation).multiply(scaling).multiply(baseRotation)
      })

      renderer.resetState()
      renderer.render(scene, camera)
      mapInstance.triggerRepaint()
    },
  }
}

const syncVisibleStores = () => {
  if (!map.value || !isReady.value || !storeLayer) {
    return
  }

  const zoom = map.value.getZoom?.() ?? props.zoom
  const renderableStores = props.storeMarkers.filter((store) => isStoreRenderableOnMap(store))

  if (zoom < STORE_MARKER_MIN_ZOOM) {
    storeLayer.syncStores([])
    return
  }

  const bounds = padBounds(map.value.getBounds(), STORE_MARKER_PADDING_RATIO)
  const center = map.value.getCenter?.()
  const centerPoint: [number, number] = center ? [center.lng, center.lat] : avatarPosition

  const visibleCandidates = renderableStores
    .filter((store) => isInBounds(bounds, store.coordinates))
    .sort((left, right) => distanceMeters(centerPoint, left.coordinates) - distanceMeters(centerPoint, right.coordinates))

  storeLayer.syncStores(visibleCandidates.slice(0, STORE_MARKER_MAX_VISIBLE))
}

const createOverlayMarkerElement = (imageUrl: string, size: number, alt: string) => {
  const el = document.createElement('div')
  el.className = 'overlay-avatar-marker'
  el.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: ${size}px;
    height: ${size}px;
    border-radius: 999px;
    background: rgba(255,255,255,0.98);
    border: 2px solid rgba(255,255,255,0.95);
    box-shadow: 0 10px 22px rgba(0,0,0,0.2);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 2;
  `

  const img = document.createElement('img')
  img.alt = alt
  img.src = imageUrl
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `
  el.appendChild(img)
  avatarOverlayHost.value?.appendChild(el)
  return el
}

const removeAvatarMarker = () => {
  const player = overlayCharacters.get(PLAYER_CHARACTER_ID)
  player?.markerElement.remove()
}

const setOverlaySize = () => {
  if (!avatarOverlayHost.value || !overlayRenderer || !overlayCamera) {
    return
  }

  const width = avatarOverlayHost.value.clientWidth
  const height = avatarOverlayHost.value.clientHeight
  overlayRenderer.setSize(width, height, false)
  overlayCamera.left = -width / 2
  overlayCamera.right = width / 2
  overlayCamera.top = height / 2
  overlayCamera.bottom = -height / 2
  overlayCamera.updateProjectionMatrix()
}

const fitAvatarModel = (root: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxAxis = Math.max(size.x, size.y, size.z)
  // 调整模型尺寸 - 增加到原来的3倍
  const fitScale = maxAxis > 0 ? 1.4 / maxAxis : 0.3

  root.position.sub(center)
  root.scale.setScalar(fitScale)

  const fittedBox = new THREE.Box3().setFromObject(root)
  root.position.y -= fittedBox.min.y
  root.rotation.y = -Math.PI / 2
}

const initOverlayScene = () => {
  if (!avatarOverlayHost.value) return

  overlayScene = new THREE.Scene()
  overlayCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 2000)
  overlayCamera.position.set(0, 0, 1000)

  overlayRenderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  overlayRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  overlayRenderer.outputColorSpace = THREE.SRGBColorSpace
  overlayRenderer.domElement.style.position = 'absolute'
  overlayRenderer.domElement.style.inset = '0'
  overlayRenderer.domElement.style.pointerEvents = 'none'
  avatarOverlayHost.value.appendChild(overlayRenderer.domElement)

  const hemisphere = new THREE.HemisphereLight('#fff8ef', '#dfe5ff', 2.4)
  const key = new THREE.DirectionalLight('#fffdf7', 2.6)
  key.position.set(120, 180, 220)
  const fill = new THREE.DirectionalLight('#dbe6ff', 1.2)
  fill.position.set(-140, 40, 120)
  const front = new THREE.DirectionalLight('#ffffff', 0.8)
  front.position.set(0, 0, 240)
  overlayScene.add(hemisphere, key, fill, front)

  overlayDracoLoader = new DRACOLoader()
  overlayDracoLoader.setDecoderPath('/draco/')
  overlayDracoLoader.setDecoderConfig({ type: 'wasm' })

  overlayLoader = new GLTFLoader()
  overlayLoader.setDRACOLoader(overlayDracoLoader)
  setOverlaySize()
}

const disposeOverlayCharacter = (character: OverlayCharacter) => {
  character.mixer?.stopAllAction()

  character.modelRoot?.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach((material: THREE.Material) => material.dispose())
      } else {
        child.material.dispose()
      }
    }
  })

  overlayScene?.remove(character.group)
  character.markerElement.remove()
  character.modelRoot = null
  character.mixer = null
  character.activeAction = null
  character.idleAction = null
  character.walkAction = null
  character.runAction = null
  character.loading = false
}

const disposeOverlayScene = () => {
  overlayCharacters.forEach((character) => disposeOverlayCharacter(character))
  overlayCharacters.clear()

  if (overlayRenderer?.domElement.parentElement === avatarOverlayHost.value) {
    overlayRenderer.domElement.remove()
  }

  overlayRenderer?.dispose()
  overlayDracoLoader?.dispose()
  overlayRenderer = null
  overlayScene = null
  overlayCamera = null
  overlayLoader = null
  overlayDracoLoader = null
}

const fadeToAction = (character: OverlayCharacter, nextAction: THREE.AnimationAction | null) => {
  if (!nextAction || character.activeAction === nextAction) {
    return
  }

  nextAction.reset()
  nextAction.enabled = true
  nextAction.setEffectiveTimeScale(1)
  nextAction.setEffectiveWeight(1)
  nextAction.fadeIn(0.2)
  nextAction.play()

  if (character.activeAction) {
    character.activeAction.fadeOut(0.2)
  }

  character.activeAction = nextAction
}

const syncOverlayAnimation = (character: OverlayCharacter) => {
  if (character.role === 'player') {
    fadeToAction(character, character.isMoving ? character.runAction : character.idleAction)
    return
  }

  if (character.state === 'walk') {
    fadeToAction(character, character.walkAction ?? character.idleAction ?? character.runAction)
    return
  }

  if (character.state === 'run') {
    fadeToAction(character, character.runAction ?? character.walkAction ?? character.idleAction)
    return
  }

  fadeToAction(character, character.idleAction ?? character.walkAction ?? character.runAction)
}

const ensureOverlayCharacter = (config: {
  id: string
  role: CharacterRole
  modelUrl: string
  markerImageUrl: string
  markerSize: number
  position: [number, number]
  state?: CharacterAnimationState
}) => {
  if (!overlayScene || !overlayLoader) return

  const existing = overlayCharacters.get(config.id)
  if (existing) {
    existing.position = config.position
    existing.role = config.role
    existing.markerImageUrl = config.markerImageUrl
    existing.markerSize = config.markerSize
    existing.state = config.state ?? existing.state
    const existingImg = existing.markerElement.querySelector('img')
    if (existingImg) {
      existingImg.setAttribute('src', config.markerImageUrl)
    }

    if (existing.modelUrl !== config.modelUrl) {
      existing.modelUrl = config.modelUrl
      disposeOverlayCharacter(existing)
      overlayScene.add(existing.group)
      existing.loading = false
    } else {
      syncOverlayAnimation(existing)
      return
    }
  }

  const character = existing ?? {
    id: config.id,
    role: config.role,
    modelUrl: config.modelUrl,
    markerImageUrl: config.markerImageUrl,
    markerSize: config.markerSize,
    position: config.position,
    group: new THREE.Group(),
    markerElement: createOverlayMarkerElement(
      config.markerImageUrl,
      config.markerSize,
      `${config.id} marker`,
    ),
    modelRoot: null,
    mixer: null,
    activeAction: null,
    idleAction: null,
    walkAction: null,
    runAction: null,
    targetYaw: 0,
    currentYaw: 0,
    isMoving: false,
    state: config.state ?? (config.role === 'npc' ? 'walk' : 'idle'),
    loading: false,
  }

  character.group.matrixAutoUpdate = true
  overlayCharacters.set(character.id, character)
  overlayScene.add(character.group)

  if (character.loading) return
  character.loading = true

  overlayLoader.load(
    character.modelUrl,
    (gltf: GLTF) => {
      const target = overlayCharacters.get(character.id)
      if (!target) {
        return
      }

      target.modelRoot = gltf.scene
      target.modelRoot.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.SkinnedMesh) {
          child.frustumCulled = false
          child.normalizeSkinWeights()
        }
      })
      fitAvatarModel(target.modelRoot)
      target.group.clear()
      target.group.add(target.modelRoot)

      if (gltf.animations.length > 0) {
        target.mixer = new THREE.AnimationMixer(target.modelRoot)
        target.idleAction = gltf.animations[0] ? target.mixer.clipAction(gltf.animations[0]) : null
        target.walkAction = gltf.animations[1] ? target.mixer.clipAction(gltf.animations[1]) : null
        target.runAction = gltf.animations[2] ? target.mixer.clipAction(gltf.animations[2]) : null
        syncOverlayAnimation(target)
      }

      target.loading = false
      logDebug('overlay avatar loaded', { id: target.id, modelUrl: target.modelUrl })
    },
    undefined,
    (error) => {
      character.loading = false
      console.error('[MapContainer] Failed to load overlay avatar model.', {
        id: character.id,
        modelUrl: character.modelUrl,
        error,
      })
    },
  )
}

const removeOverlayCharacter = (id: string) => {
  const character = overlayCharacters.get(id)
  if (!character) return
  disposeOverlayCharacter(character)
  overlayCharacters.delete(id)
}

const updateOverlayCharacterPosition = (id: string, position: [number, number]) => {
  const character = overlayCharacters.get(id)
  if (character) {
    character.position = position
  }
}

const setOverlayCharacterTargetYaw = (id: string, yaw: number) => {
  const character = overlayCharacters.get(id)
  if (character) {
    character.targetYaw = yaw
  }
}

const setOverlayCharacterMoving = (id: string, isMoving: boolean) => {
  const character = overlayCharacters.get(id)
  if (!character || character.isMoving === isMoving) return
  character.isMoving = isMoving
  syncOverlayAnimation(character)
}

const setOverlayCharacterState = (id: string, state: CharacterAnimationState) => {
  const character = overlayCharacters.get(id)
  if (!character || character.state === state) return
  character.state = state
  syncOverlayAnimation(character)
}

const renderOverlayScene = (dt: number) => {
  if (!map.value || !overlayRenderer || !overlayScene || !overlayCamera || !avatarOverlayHost.value) {
    return
  }

  const width = avatarOverlayHost.value.clientWidth
  const height = avatarOverlayHost.value.clientHeight
  const zoom = map.value.getZoom?.() ?? props.zoom
  // 调整缩放比例关系 - 使用更平缓的指数使模型随缩放变化更自然
  const zoomScale = Math.pow(1.5, zoom - 14)

  overlayCharacters.forEach((character) => {
    character.mixer?.update(dt)

    let diff = character.targetYaw - character.currentYaw
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    character.currentYaw += diff * AVATAR_TURN_SPEED

    const screenPoint = map.value.project(character.position)
    const scale = OVERLAY_BASE_SCALE * zoomScale

    character.group.visible =
      screenPoint.x > -220 &&
      screenPoint.x < width + 220 &&
      screenPoint.y > -320 &&
      screenPoint.y < height + 220

    // 统一坐标：GLB模型和头像标记都基于屏幕坐标系
    // GLB模型位置（Three.js坐标系：原点在屏幕中心，Y轴向上）
    const modelScreenX = screenPoint.x
    const modelScreenY = screenPoint.y - character.markerSize / 2 // 模型中心与头像中心对齐
    
    // 转换为Three.js坐标
    character.group.position.set(
      modelScreenX - width / 2, 
      height / 2 - modelScreenY, 
      0
    )
    character.group.rotation.set(0, character.currentYaw, 0)
    character.group.scale.setScalar(scale)

    // 头像标记位置（CSS坐标系：原点在左上角，Y轴向下）
    character.markerElement.style.display = character.group.visible ? 'flex' : 'none'
    const markerX = screenPoint.x - character.markerSize / 2
    const markerY = screenPoint.y - character.markerSize / 2
    character.markerElement.style.transform = `translate(${markerX}px, ${markerY}px)`
  })

  overlayRenderer.clear()
  overlayRenderer.render(overlayScene, overlayCamera)
}

const syncAvatarToMap = () => {
  if (!map.value) return
  updateOverlayCharacterPosition(PLAYER_CHARACTER_ID, avatarPosition)
  map.value.easeTo({
    center: avatarPosition,
    duration: 80,
    easing: (t: number) => t,
    essential: true,
  })
}

const updateNearestPremiumStore = () => {
  const candidateStores = props.storeMarkers.filter(
    (store) => store.tier === 'premium' && store.canEnter && isStoreRenderableOnMap(store),
  )

  let nearestStorePayload: StoreCatalogItem | null = null
  let nextId = ''
  let shortestDistance = Number.POSITIVE_INFINITY

  candidateStores.forEach((store) => {
    const currentDistance = distanceMeters(avatarPosition, store.coordinates)
    if (currentDistance < 20 && currentDistance < shortestDistance) {
      shortestDistance = currentDistance
      nearestStorePayload = store
      nextId = store.id
    }
  })

  if (nextId !== nearestPremiumStoreId) {
    nearestPremiumStoreId = nextId
    emit('nearestPremiumChange', nearestStorePayload)
  }
}

const removeNpcActors = () => {
  npcActors.forEach((actor) => {
    removeOverlayCharacter(actor.id)
  })
  npcActors = []
}

const syncNpcActors = () => {
  removeNpcActors()
  npcActors = buildNpcActors()

  npcActors.forEach((actor) => {
    ensureOverlayCharacter({
      id: actor.id,
      role: 'npc',
      modelUrl: actor.modelUrl,
      markerImageUrl: actor.imageUrl,
      markerSize: 38,
      position: actor.position,
      state: 'walk',
    })
  })
}

const advanceNpcTarget = (actor: NpcActor) => {
  if (actor.routeMode === 'loop') {
    actor.targetIndex = (actor.targetIndex + 1) % actor.route.length
    return
  }

  const nextIndex = actor.targetIndex + actor.direction
  if (nextIndex < 0 || nextIndex >= actor.route.length) {
    actor.direction = actor.direction === 1 ? -1 : 1
    actor.targetIndex += actor.direction
    return
  }

  actor.targetIndex = nextIndex
}

const updateNpcActors = (dt: number) => {
  npcActors.forEach((actor) => {
    if (actor.route.length < 2) return

    const target = actor.route[actor.targetIndex]
    if (!target) return

    const [lng, lat] = actor.position
    const eastMeters = (target[0] - lng) * METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180)
    const northMeters = (target[1] - lat) * METERS_PER_DEG_LAT
    const distance = Math.hypot(eastMeters, northMeters)

    setOverlayCharacterState(actor.id, 'walk')

    if (distance < 0.35) {
      actor.position = [target[0], target[1]]
      updateOverlayCharacterPosition(actor.id, actor.position)
      advanceNpcTarget(actor)
      return
    }

    const dx = eastMeters / distance
    const dz = -northMeters / distance
    const step = Math.min(actor.speed * dt, distance)

    actor.position = [
      lng + metersToLng(step * dx, lat),
      lat + metersToLat(step * (-dz)),
    ]

    updateOverlayCharacterPosition(actor.id, actor.position)
    setOverlayCharacterTargetYaw(actor.id, -Math.atan2(dx, -dz) + Math.PI / 2)
  })
}

const runAvatarLoop = (timestamp: number) => {
  const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.05)
  lastFrameTime = timestamp || performance.now()

  if (map.value && props.enableAvatar && props.avatarModelUrl) {
    const inputMagnitude = Math.hypot(avatarInput.x, avatarInput.y)
    setOverlayCharacterMoving(PLAYER_CHARACTER_ID, inputMagnitude > 0.08)

    if (inputMagnitude > 0.08) {
      const bearing = ((map.value.getBearing?.() ?? 0) * Math.PI) / 180
      let dx = avatarInput.x * Math.cos(bearing) - avatarInput.y * Math.sin(bearing)
      let dz = avatarInput.x * Math.sin(bearing) + avatarInput.y * Math.cos(bearing)
      const vectorLength = Math.hypot(dx, dz)

      if (vectorLength > 0) {
        dx /= vectorLength
        dz /= vectorLength

        setOverlayCharacterTargetYaw(PLAYER_CHARACTER_ID, -Math.atan2(dx, -dz) + Math.PI / 2)

        const step = AVATAR_MOVE_SPEED * dt
        const [lng, lat] = avatarPosition
        avatarPosition = [
          lng + metersToLng(step * dx, lat),
          lat + metersToLat(step * (-dz)),
        ]

        syncAvatarToMap()
        updateNearestPremiumStore()
        scheduleStoreSync()
      }
    }
  }

  updateNpcActors(dt)
  renderOverlayScene(dt)
  avatarRafId = requestAnimationFrame(runAvatarLoop)
}

const startAvatarLoop = () => {
  stopAvatarLoop()
  lastFrameTime = performance.now()
  avatarRafId = requestAnimationFrame(runAvatarLoop)
}

const stopAvatarLoop = () => {
  if (avatarRafId) {
    cancelAnimationFrame(avatarRafId)
    avatarRafId = 0
  }
}

const resetAvatarPosition = () => {
  avatarPosition = [...props.avatarInitialPosition]
  updateOverlayCharacterPosition(PLAYER_CHARACTER_ID, avatarPosition)
  syncAvatarToMap()
  updateNearestPremiumStore()
  scheduleStoreSync()
}

const initMap = async () => {
  if (!mapCanvasHost.value) return

  try {
    assertMapConfig()
    mapboxgl.accessToken = MAP_CONFIG.MAPBOX_TOKEN

    // 禁用 Mapbox 遥测/事件统计功能
    // @ts-ignore
    mapboxgl.config = { ...mapboxgl.config, EVENTS_URL: null }

    const mapInstance = new mapboxgl.Map({
      container: mapCanvasHost.value,
      style: MAP_CONFIG.MAPBOX_STYLE,
      center: props.center,
      zoom: props.zoom,
      pitch: MAP_CONFIG.DEFAULT_PITCH,
      bearing: MAP_CONFIG.DEFAULT_BEARING,
      antialias: true,
      attributionControl: false,
      maxZoom: 22,
      minZoom: 3,
    })

    const safeMap = mapInstance as MapboxMapLike
    safeMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    safeMap.on('click', (event: any) => {
      emit('mapClick', { lng: event.lngLat.lng, lat: event.lngLat.lat })
    })

    safeMap.on('load', () => {
      isReady.value = true
      errorMessage.value = ''
      emit('ready', safeMap)
      updateMarkers()
      syncStoreLocatorMarkers()
      syncVisibleStores()
      updateNearestPremiumStore()
      logDebug('map load complete')
    })

    safeMap.on('style.load', () => {
      if (storeLayer && safeMap.getLayer?.(STORE_LAYER_ID)) {
        safeMap.removeLayer(STORE_LAYER_ID)
      }

      storeLayer = createStoreLayer(safeMap)
      safeMap.addLayer(storeLayer)
      syncVisibleStores()

      if (props.enableAvatar && props.avatarModelUrl) {
        ensureOverlayCharacter({
          id: PLAYER_CHARACTER_ID,
          role: 'player',
          modelUrl: props.avatarModelUrl,
          markerImageUrl: props.avatarImageUrl || '/avatars/girl-01.jpg',
          markerSize: 42,
          position: avatarPosition,
          state: 'idle',
        })
      }

      syncNpcActors()
      startAvatarLoop()
    })

    safeMap.on('move', () => renderOverlayScene(0))
    safeMap.on('zoom', () => renderOverlayScene(0))
    safeMap.on('rotate', () => renderOverlayScene(0))
    safeMap.on('pitch', () => renderOverlayScene(0))
    safeMap.on('moveend', () => scheduleStoreSync())
    safeMap.on('zoomend', () => scheduleStoreSync())
    safeMap.on('rotateend', () => scheduleStoreSync())

    map.value = safeMap
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '地图初始化失败，请检查 Mapbox 配置。'
    logWarn('initMap failed', { error: error instanceof Error ? error.message : String(error) })
  }
}

watch(
  () => props.markers,
  () => {
    if (isReady.value) {
      updateMarkers()
    }
  },
  { deep: true },
)

watch(
  () => props.storeMarkers,
  () => {
    if (!isReady.value) return
    syncStoreLocatorMarkers()
    syncVisibleStores()
    syncNpcActors()
    updateNearestPremiumStore()
  },
  { deep: true },
)

watch(
  () => props.center,
  (newCenter) => {
    if (map.value && newCenter) {
      map.value.easeTo({ center: newCenter, duration: 600 })
    }
  },
  { deep: true },
)

watch(
  () => props.zoom,
  (newZoom) => {
    if (map.value && typeof newZoom === 'number') {
      map.value.easeTo({ zoom: newZoom, duration: 600 })
    }
  },
)

watch(
  () => props.avatarModelUrl,
  (nextModelUrl, previousModelUrl) => {
    if (!props.enableAvatar || !nextModelUrl || nextModelUrl === previousModelUrl) {
      return
    }

    ensureOverlayCharacter({
      id: PLAYER_CHARACTER_ID,
      role: 'player',
      modelUrl: nextModelUrl,
      markerImageUrl: props.avatarImageUrl || '/avatars/girl-01.jpg',
      markerSize: 42,
      position: avatarPosition,
      state: 'idle',
    })
    startAvatarLoop()
  },
)

watch(
  () => props.avatarImageUrl,
  () => {
    if (!props.enableAvatar || !props.avatarModelUrl) {
      return
    }
    ensureOverlayCharacter({
      id: PLAYER_CHARACTER_ID,
      role: 'player',
      modelUrl: props.avatarModelUrl,
      markerImageUrl: props.avatarImageUrl || '/avatars/girl-01.jpg',
      markerSize: 42,
      position: avatarPosition,
      state: 'idle',
    })
  },
)

onMounted(() => {
  avatarPosition = [...props.avatarInitialPosition]
  initOverlayScene()
  window.addEventListener('resize', setOverlaySize)
  void initMap()
})

onUnmounted(() => {
  if (storeSyncTimer) {
    clearTimeout(storeSyncTimer)
    storeSyncTimer = 0
  }

  window.removeEventListener('resize', setOverlaySize)
  stopAvatarLoop()
  removeAvatarMarker()
  removeNpcActors()
  disposeOverlayScene()
  clearMarkers()
  clearStoreLocatorMarkers()
  storeLayer?.disposeStores()
  if (map.value?.getLayer?.(STORE_LAYER_ID)) {
    map.value.removeLayer(STORE_LAYER_ID)
  }
  map.value?.remove()
  map.value = null
})

defineExpose({
  getMap: () => map.value,
  setCenter: (center: [number, number]) => {
    map.value?.easeTo({ center, duration: 600 })
  },
  setZoom: (zoom: number) => {
    map.value?.easeTo({ zoom, duration: 600 })
  },
  flyTo: (options: { center?: [number, number]; zoom?: number }) => {
    if (!map.value) return
    map.value.easeTo({
      center: options.center,
      zoom: options.zoom,
      duration: 850,
      essential: true,
    })
  },
  setAvatarInput: (nextInput: AvatarInput) => {
    avatarInput = { ...nextInput }
  },
  centerOnAvatar: () => {
    syncAvatarToMap()
  },
  resetAvatarPosition,
})
</script>

<template>
  <div class="map-shell">
    <div ref="mapCanvasHost" class="map-canvas-host"></div>
    <div ref="avatarOverlayHost" class="avatar-overlay-host"></div>

    <div v-if="!isReady && !errorMessage" class="map-loading">
      <div class="loading-spinner"></div>
      <span>Mapbox 地图加载中...</span>
    </div>

    <div v-else-if="errorMessage" class="map-error">
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.map-shell {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-canvas-host,
.avatar-overlay-host {
  position: absolute;
  inset: 0;
}

.avatar-overlay-host {
  pointer-events: none;
  z-index: 1;
}

.map-loading,
.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.9), rgba(245, 245, 247, 0.96)),
    #f5f5f7;
  color: #6c6c6c;
  font-size: 14px;
  text-align: center;
  z-index: 3;
}

.map-error {
  color: #b42318;
  background: #fff5f5;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e5ea;
  border-top-color: #1d1d1f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
