<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { AMAP_CONFIG, AMAP_PLUGINS, assertAmapConfig } from '../../config/amapConfig'
import { isStoreRenderableOnMap, type StoreCatalogItem } from '../../config/storeCatalog'

// 高德地图类型定义
type AMapInstance = any
type AMapMarker = any

interface MarkerItem {
  id: string
  position: [number, number]
  title?: string
  color?: string
  data?: unknown
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
  (e: 'ready', map: AMapInstance): void
  (e: 'nearestPremiumChange', store: StoreCatalogItem | null): void
  (e: 'storeLocatorClick', store: StoreCatalogItem): void
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [121.6017, 31.2048],
  zoom: 14,
  markers: () => [],
  storeMarkers: () => [],
  enableAvatar: false,
  avatarModelUrl: '',
  avatarImageUrl: '',
  avatarInitialPosition: () => [121.6017, 31.2048],
})

const emit = defineEmits<Emits>()

// 常量定义
const PLAYER_CHARACTER_ID = 'player-avatar'
const METERS_PER_DEG_LAT = 111320
const STORE_ALTITUDE = 0
const STORE_SCALE_ADJUST = 11  // 缩小到原来的25%
const AVATAR_MOVE_SPEED = 52.5
const NPC_MOVE_SPEED = 12
const AVATAR_TURN_SPEED = 0.18
const STORE_MARKER_MIN_ZOOM = 11
const STORE_MARKER_MAX_VISIBLE = 10
const STORE_MARKER_PADDING_RATIO = 0.22
const STORE_SYNC_DEBOUNCE_MS = 90
const OVERLAY_BASE_SCALE = 5
const MAP_DEBUG_NAMESPACE = '[AmapContainer]'

// Refs
const mapContainer = ref<HTMLDivElement | null>(null)
const map = shallowRef<AMapInstance | null>(null)
const isReady = ref(false)
const errorMessage = ref('')

// 地图图层和加载器
let storeLayer: any = null
let gltfLoader: GLTFLoader | null = null
let dracoLoader: DRACOLoader | null = null

// 商店渲染记录
interface StoreRenderRecord {
  store: StoreCatalogItem
  model?: THREE.Object3D
  root?: THREE.Group
  x: number
  y: number
  z: number
  mercatorScale: number
}

const storeRecords = new Map<string, StoreRenderRecord>()

// 人物模型渲染记录
interface CharacterRenderRecord {
  id: string
  model?: THREE.Object3D
  root?: THREE.Group
  x: number
  y: number
  z: number
  mercatorScale: number
  rotation: number
}

const characterRecords = new Map<string, CharacterRenderRecord>()

// POI 标记点记录
const poiMarkers = new Map<string, any>()

// 初始化地图
const initMap = async () => {
  if (!mapContainer.value) return

  try {
    assertAmapConfig()

    const AMap = await AMapLoader.load({
      key: AMAP_CONFIG.KEY,
      version: AMAP_CONFIG.VERSION,
      plugins: AMAP_PLUGINS,
    })

    // 创建地图实例 - 配置双指旋转倾斜，单指移动
    const mapInstance = new AMap.Map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      pitch: AMAP_CONFIG.DEFAULT_PITCH,
      rotation: AMAP_CONFIG.DEFAULT_ROTATION,
      viewMode: '3D',
      mapStyle: AMAP_CONFIG.MAP_STYLE,
      zooms: [3, 20],
      // 手势控制配置
      rotateEnable: true,      // 启用旋转
      pitchEnable: true,       // 启用倾斜
      // 双指控制视角，单指移动
      touchZoom: true,
      dragEnable: true,
    })

    map.value = mapInstance

    // 添加比例尺控件（不添加 ControlBar，使用手势控制）
    mapInstance.addControl(new AMap.Scale())

    // 配置触摸手势
    setupTouchGestures(mapInstance, AMap)

    // 初始化 Three.js 加载器
    initLoaders()

    // 创建商店图层
    createStoreLayer(mapInstance, AMap)

    // 创建人物图层
    createCharacterLayer(mapInstance, AMap)

    // 绑定事件
    bindMapEvents(mapInstance)

    // 同步商店标记
    syncVisibleStores()

    // 同步人物模型
    syncCharacterModels()

    isReady.value = true
    emit('ready', mapInstance)

    console.log(MAP_DEBUG_NAMESPACE, '高德地图初始化完成')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '地图初始化失败'
    console.error(MAP_DEBUG_NAMESPACE, '地图初始化失败:', error)
  }
}

// 初始化加载器
const initLoaders = () => {
  dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/')
  gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)
}

// 配置触摸手势 - 双指控制视角，单指移动
const setupTouchGestures = (mapInstance: AMapInstance, AMap: any) => {
  let lastTouchDistance = 0
  let lastTouchRotation = 0
  let lastTouchPitch = 0
  let isTwoFinger = false
  let startRotation = 0
  let startPitch = 0

  const container = mapInstance.getContainer()

  container.addEventListener('touchstart', (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // 双指开始
      isTwoFinger = true
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistance = Math.sqrt(dx * dx + dy * dy)
      lastTouchRotation = Math.atan2(dy, dx) * (180 / Math.PI)
      lastTouchPitch = (e.touches[0].clientY + e.touches[1].clientY) / 2
      startRotation = mapInstance.getRotation() || 0
      startPitch = mapInstance.getPitch() || 0
    } else {
      isTwoFinger = false
    }
  }, { passive: true })

  container.addEventListener('touchmove', (e: TouchEvent) => {
    if (e.touches.length === 2 && isTwoFinger) {
      // 双指移动 - 控制视角
      e.preventDefault()

      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY

      // 计算旋转
      const currentRotation = Math.atan2(dy, dx) * (180 / Math.PI)
      const rotationDelta = currentRotation - lastTouchRotation
      const newRotation = startRotation - rotationDelta

      // 计算倾斜
      const currentPitchY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const pitchDelta = (currentPitchY - lastTouchPitch) * 0.5
      const newPitch = Math.max(0, Math.min(83, startPitch + pitchDelta))

      // 应用视角变化
      mapInstance.setRotation(newRotation)
      mapInstance.setPitch(newPitch)
    }
  }, { passive: false })

  container.addEventListener('touchend', () => {
    isTwoFinger = false
  }, { passive: true })
}

// 创建商店图层 - 使用 CustomLayer 避免 WebGL 版本冲突
const createStoreLayer = (mapInstance: AMapInstance, AMap: any) => {
  // 创建独立的 canvas 和 renderer
  const canvas = document.createElement('canvas')
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none'

  const customLayer = new AMap.CustomLayer(canvas, {
    zIndex: 10,
    alwaysRender: true,
  })

  // 初始化 Three.js
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)

  // 使用独立的 WebGLRenderer，不共享上下文
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  // 设置像素比，使用更高的值以减少锯齿
  const pixelRatio = Math.min(window.devicePixelRatio, 2)
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(mapInstance.getSize().width, mapInstance.getSize().height)
  
  // 启用阴影和更好的渲染质量
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(100, 200, 100)
  scene.add(directionalLight)

  // 存储引用
  storeLayer = {
    scene,
    camera,
    renderer,
    canvas,
  }

  // 渲染函数
  const render = () => {
    if (!storeLayer) return

    const currentZoom = mapInstance.getZoom() ?? 14
    const zoomScale = Math.pow(2, (currentZoom - 14) * 0.5)

    storeRecords.forEach((record) => {
      if (!record.root) return

      const translation = new THREE.Matrix4().makeTranslation(record.x, record.y, record.z)
      const dynamicScale = record.mercatorScale * zoomScale
      const scaling = new THREE.Matrix4().makeScale(dynamicScale, dynamicScale, dynamicScale)
      const baseRotation = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ')
      )

      record.root.matrix.copy(translation).multiply(scaling).multiply(baseRotation)
      record.root.matrixAutoUpdate = false
    })

    renderer.render(scene, camera)
  }

  // 监听地图变化进行渲染
  mapInstance.on('zoomchange', render)
  mapInstance.on('moveend', render)

  customLayer.render = render

  mapInstance.add(customLayer)
}

// 人物图层
let characterLayer: any = null

// 创建人物图层
const createCharacterLayer = (mapInstance: AMapInstance, AMap: any) => {
  if (!props.enableAvatar || !props.avatarModelUrl) return

  const canvas = document.createElement('canvas')
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none'

  const customLayer = new AMap.CustomLayer(canvas, {
    zIndex: 20,
    alwaysRender: true,
  })

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  const pixelRatio = Math.min(window.devicePixelRatio, 2)
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(mapInstance.getSize().width, mapInstance.getSize().height)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(100, 200, 100)
  scene.add(directionalLight)

  characterLayer = {
    scene,
    camera,
    renderer,
    canvas,
  }

  const render = () => {
    if (!characterLayer) return

    const currentZoom = mapInstance.getZoom() ?? 14
    const zoomScale = Math.pow(1.5, currentZoom - 14)

    characterRecords.forEach((record) => {
      if (!record.root) return

      const translation = new THREE.Matrix4().makeTranslation(record.x, record.y, record.z)
      const dynamicScale = record.mercatorScale * zoomScale * OVERLAY_BASE_SCALE
      const scaling = new THREE.Matrix4().makeScale(dynamicScale, dynamicScale, dynamicScale)
      const rotation = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(Math.PI / 2, 0, record.rotation, 'XYZ')
      )

      record.root.matrix.copy(translation).multiply(scaling).multiply(rotation)
      record.root.matrixAutoUpdate = false
    })

    renderer.render(scene, camera)
  }

  mapInstance.on('zoomchange', render)
  mapInstance.on('moveend', render)

  customLayer.render = render

  mapInstance.add(customLayer)
}

// 同步人物模型
const syncCharacterModels = async () => {
  if (!map.value || !gltfLoader || !props.enableAvatar || !props.avatarModelUrl) return

  const zoom = map.value.getZoom?.() ?? props.zoom

  // 清理现有人物
  characterRecords.forEach((record) => {
    if (record.root && characterLayer?.scene) {
      characterLayer.scene.remove(record.root)
    }
  })
  characterRecords.clear()

  // 加载主人物模型
  try {
    const record: CharacterRenderRecord = {
      id: PLAYER_CHARACTER_ID,
      x: 0,
      y: 0,
      z: 0,
      mercatorScale: 0,
      rotation: -Math.PI / 2,
    }

    const pixel = map.value.lngLatToContainer(props.avatarInitialPosition)
    const containerSize = map.value.getSize()
    record.x = (pixel.x / containerSize.width - 0.5) * 2
    record.y = -(pixel.y / containerSize.height - 0.5) * 2
    record.z = 0
    record.mercatorScale = 0.001 * Math.pow(2, zoom - 14)

    const gltf = await gltfLoader.loadAsync(props.avatarModelUrl)
    record.model = gltf.scene

    // 优化材质
    record.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((mat) => {
            if (mat.map && characterLayer?.renderer) {
              mat.map.anisotropy = characterLayer.renderer.capabilities.getMaxAnisotropy()
              mat.map.minFilter = THREE.LinearMipmapLinearFilter
              mat.map.magFilter = THREE.LinearFilter
            }
            mat.flatShading = false
          })
        }
      }
    })

    fitCharacterModel(record.model)
    record.root = new THREE.Group()
    record.root.add(record.model)

    if (characterLayer?.scene) {
      characterLayer.scene.add(record.root)
    }

    characterRecords.set(PLAYER_CHARACTER_ID, record)
  } catch (error) {
    console.error(MAP_DEBUG_NAMESPACE, '加载人物模型失败:', error)
  }
}

// 适配人物模型
const fitCharacterModel = (root: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxAxis = Math.max(size.x, size.y, size.z)
  const fitScale = maxAxis > 0 ? 1.4 / maxAxis : 0.3

  root.position.sub(center)
  root.scale.setScalar(fitScale)

  const fittedBox = new THREE.Box3().setFromObject(root)
  root.position.y -= fittedBox.min.y
  root.rotation.y = -Math.PI / 2
}

// 更新人物位置（地图移动时）
const updateCharacterPositions = () => {
  if (!map.value) return

  const zoom = map.value.getZoom?.() ?? props.zoom

  characterRecords.forEach((record) => {
    if (!record.root) return

    let pixel
    if (record.id === PLAYER_CHARACTER_ID) {
      pixel = map.value!.lngLatToContainer(props.avatarInitialPosition)
    } else {
      // 其他NPC的位置
      return
    }

    const containerSize = map.value.getSize()
    record.x = (pixel.x / containerSize.width - 0.5) * 2
    record.y = -(pixel.y / containerSize.height - 0.5) * 2
    record.mercatorScale = 0.001 * Math.pow(2, zoom - 14)
  })
}

// 绑定地图事件
const bindMapEvents = (mapInstance: AMapInstance) => {
  // 点击事件
  mapInstance.on('click', (e: any) => {
    emit('mapClick', { lng: e.lnglat.lng, lat: e.lnglat.lat })
  })

  // 缩放事件
  mapInstance.on('zoomchange', () => {
    syncVisibleStores()
    updateCharacterPositions()
  })

  // 移动事件
  mapInstance.on('moveend', () => {
    syncVisibleStores()
    updateCharacterPositions()
  })
}

// 同步可见商店
const syncVisibleStores = () => {
  if (!map.value || !isReady.value) return

  const zoom = map.value.getZoom?.() ?? props.zoom
  const renderableStores = props.storeMarkers.filter((store) => isStoreRenderableOnMap(store))

  if (zoom < STORE_MARKER_MIN_ZOOM) {
    // 隐藏所有商店
    storeRecords.forEach((record) => {
      if (record.root) {
        record.root.visible = false
      }
    })
    return
  }

  const bounds = map.value.getBounds()
  const visibleStores = renderableStores
    .filter((store) => {
      const { lng, lat } = { lng: store.coordinates[0], lat: store.coordinates[1] }
      return (
        lng >= bounds.southWest.lng &&
        lng <= bounds.northEast.lng &&
        lat >= bounds.southWest.lat &&
        lat <= bounds.northEast.lat
      )
    })
    .slice(0, STORE_MARKER_MAX_VISIBLE)

  // 同步商店记录
  syncStoreRecords(visibleStores)
}

// 同步商店记录
const syncStoreRecords = async (stores: StoreCatalogItem[]) => {
  if (!map.value || !gltfLoader) return

  // 移除不再可见的商店
  storeRecords.forEach((record, id) => {
    if (!stores.find((s) => s.id === id)) {
      if (record.root && storeLayer?.scene) {
        storeLayer.scene.remove(record.root)
      }
      storeRecords.delete(id)
      
      // 移除对应的 POI 标记
      if (poiMarkers.has(id)) {
        map.value?.remove(poiMarkers.get(id))
        poiMarkers.delete(id)
      }
    }
  })

  // 添加新商店
  for (const store of stores) {
    if (storeRecords.has(store.id)) continue

    try {
      const record: StoreRenderRecord = {
        store,
        x: 0,
        y: 0,
        z: 0,
        mercatorScale: 0,
      }

      // 使用地图实例的 lngLatToContainer 方法进行坐标转换
      const pixel = map.value.lngLatToContainer(store.coordinates)
      
      // 将像素坐标转换为 Three.js 坐标系
      const containerSize = map.value.getSize()
      record.x = (pixel.x / containerSize.width - 0.5) * 2
      record.y = -(pixel.y / containerSize.height - 0.5) * 2
      record.z = 0
      
      // 根据缩放级别计算缩放比例
      const zoom = map.value.getZoom()
      record.mercatorScale = 0.001 * STORE_SCALE_ADJUST * Math.pow(2, zoom - 14)

      // 加载模型
      if (store.modelUrl) {
        const gltf = await gltfLoader.loadAsync(store.modelUrl)
        record.model = gltf.scene
        
        // 优化模型材质以减少锯齿和方块化
        record.model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // 启用阴影
            child.castShadow = true
            child.receiveShadow = true
            
            // 优化材质
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material]
              materials.forEach((mat) => {
                // 启用各向异性过滤以提高纹理质量
                if (mat.map && storeLayer?.renderer) {
                  mat.map.anisotropy = storeLayer.renderer.capabilities.getMaxAnisotropy()
                  mat.map.minFilter = THREE.LinearMipmapLinearFilter
                  mat.map.magFilter = THREE.LinearFilter
                }
                // 启用平滑着色
                mat.flatShading = false
              })
            }
          }
        })
        
        fitStoreModel(record.model, store)
        record.root = new THREE.Group()
        record.root.add(record.model)
        
        if (storeLayer?.scene) {
          storeLayer.scene.add(record.root)
        }
      }

      storeRecords.set(store.id, record)
      
      // 添加 POI 标记点
      createPOIMarker(store, AMap)
    } catch (error) {
      console.error(MAP_DEBUG_NAMESPACE, `加载商店模型失败: ${store.id}`, error)
    }
  }
}

// 门店心情配置 - 根据门店类型映射到对应的心情emoji
const storeMoodConfig: Record<string, { bgColor: string; emoji: string; label: string; mood: string }> = {
  'convenience': { bgColor: '#007AFF', emoji: '😊', label: '便利店', mood: '轻松' },
  'coffee': { bgColor: '#FF9500', emoji: '😌', label: '咖啡', mood: '惬意' },
  'food': { bgColor: '#FF3B30', emoji: '😋', label: '餐饮', mood: '满足' },
  'fitness': { bgColor: '#34C759', emoji: '💪', label: '健身', mood: '活力' },
  'sushi': { bgColor: '#FF2D55', emoji: '🥰', label: '日料', mood: '享受' },
  'hotpot': { bgColor: '#FF6B35', emoji: '❤️', label: '火锅', mood: '心脏' },
  'default': { bgColor: '#FFFFFF', emoji: '😌', label: '商店', mood: '惬意' },
}

// 根据门店名称识别类型
const detectStoreType = (storeName: string): keyof typeof storeMoodConfig => {
  const name = storeName.toLowerCase()
  if (name.includes('seven') || name.includes('eleven') || name.includes('便利店')) return 'convenience'
  if (name.includes('coffee') || name.includes('咖啡') || name.includes('peet') || name.includes('wagas')) return 'coffee'
  if (name.includes('寿司') || name.includes('sushi')) return 'sushi'
  if (name.includes('火锅') || name.includes('湊湊') || name.includes('coucou')) return 'hotpot'
  if (name.includes('健身') || name.includes('运动') || name.includes('lefit')) return 'fitness'
  if (name.includes('餐厅') || name.includes('food') || name.includes('餐饮')) return 'food'
  return 'default'
}

// 创建 POI 标记图标 - 根据门店类型显示不同颜色和emoji
const createPOIIcon = (store: StoreCatalogItem) => {
  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 48
  const ctx = canvas.getContext('2d')!
  
  const centerX = 24
  const centerY = 24
  const radius = 22
  
  // 识别门店类型
  const storeType = detectStoreType(store.name)
  const config = storeMoodConfig[storeType]
  
  // 绘制圆形背景（根据类型不同颜色）
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  ctx.fillStyle = config.bgColor
  ctx.fill()
  
  // 绘制白色边框
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3
  ctx.stroke()
  
  // 绘制阴影效果
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 2
  
  // 绘制emoji
  ctx.font = '24px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(config.emoji, centerX, centerY)
  
  // 重置阴影
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  
  return canvas.toDataURL()
}

// 创建 POI 标记点
const createPOIMarker = (store: StoreCatalogItem, AMap: any) => {
  if (!map.value) return
  
  // 如果标记已存在，先移除
  if (poiMarkers.has(store.id)) {
    map.value.remove(poiMarkers.get(store.id))
    poiMarkers.delete(store.id)
  }
  
  // 创建图标
  const iconUrl = createPOIIcon(store)
  const icon = new AMap.Icon({
    size: new AMap.Size(48, 48),
    image: iconUrl,
    imageSize: new AMap.Size(48, 48),
  })
  
  // 创建标记点
  const marker = new AMap.Marker({
    position: store.coordinates,
    title: store.name,
    anchor: 'bottom-center',
    offset: new AMap.Pixel(0, -20),
    icon: icon,
  })
  
  // 添加点击事件
  marker.on('click', () => {
    console.log(MAP_DEBUG_NAMESPACE, `POI 点击: ${store.name}`)
    emit('storeLocatorClick', store)
  })
  
  // 保存标记引用
  poiMarkers.set(store.id, marker)
  
  // 添加到地图
  map.value.add(marker)
}

// 清除所有 POI 标记
const clearPOIMarkers = () => {
  if (!map.value) return
  
  poiMarkers.forEach((marker) => {
    map.value.remove(marker)
  })
  poiMarkers.clear()
}

// 适配商店模型
const fitStoreModel = (root: THREE.Object3D, store: StoreCatalogItem) => {
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxAxis = Math.max(size.x, size.y, size.z)
  
  // 缩小到原来的25%
  const fitScale = maxAxis > 0 ? (1.6 / maxAxis) * (store.mapScale ?? 0.35) : 0.35

  root.position.sub(center)
  root.scale.setScalar(fitScale)

  const fittedBox = new THREE.Box3().setFromObject(root)
  root.position.y -= fittedBox.min.y
  
  // 调整模型旋转：默认 facing camera (正面)
  root.rotation.y = store.mapRotationY ?? -Math.PI / 2
}

// 监听属性变化
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    map.value.setCenter(newCenter)
  }
})

watch(() => props.zoom, (newZoom) => {
  if (map.value && newZoom) {
    map.value.setZoom(newZoom)
  }
})

watch(() => props.storeMarkers, () => {
  syncVisibleStores()
}, { deep: true })

watch(() => props.avatarModelUrl, () => {
  syncCharacterModels()
})

watch(() => props.avatarInitialPosition, () => {
  syncCharacterModels()
})

// 生命周期
onMounted(() => {
  initMap()
})

onUnmounted(() => {
  // 清除所有 POI 标记
  clearPOIMarkers()
  
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
  dracoLoader?.dispose()
})

// 暴露方法
defineExpose({
  getMap: () => map.value,
  setCenter: (center: [number, number]) => map.value?.setCenter(center),
  setZoom: (zoom: number) => map.value?.setZoom(zoom),
})
</script>

<template>
  <div ref="mapContainer" class="amap-container">
    <div v-if="errorMessage" class="map-error">
      {{ errorMessage }}
    </div>
    <div v-if="!isReady && !errorMessage" class="map-loading">
      地图加载中...
    </div>
  </div>
</template>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  color: #d32f2f;
  text-align: center;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  color: #666;
  text-align: center;
}
</style>
