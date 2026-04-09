# AMap Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all runtime Mapbox usage in the app with AMap JS API while preserving the existing map flows, marker interactions, and route-level behavior.

**Architecture:** Introduce one shared AMap loader plus a small map config module, then migrate the shared `MapContainer.vue` abstraction first so page-level code can stay stable where possible. Migrate the direct Mapbox pages next (`ExploreMap.vue`, `Map3DView.vue`, `Map3DEffects.vue`), explicitly degrading 3D visuals to 2D-first DOM/marker overlays while keeping POI interactions, navigation, and filtering intact.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), TypeScript, Vite, Vue Router, AMap JavaScript API v2 (script-loaded), Tailwind CSS utilities, npm

---

## File Map

- Create: `src/lib/amapLoader.ts`
  - Single-responsibility loader for AMap JS API script injection, env validation, singleton Promise reuse, and returning the global `AMap` object.
- Modify: `src/config/mapConfig.ts`
  - Replace Mapbox token/style config with shared AMap config and coordinate conventions.
- Modify: `src/components/map/MapContainer.vue`
  - Replace Mapbox internals with AMap internals while preserving props, emits, and exposed methods.
- Modify: `src/views/explore/MapEntry.vue`
  - Keep existing route behavior, update readiness copy/logging only if needed for AMap terminology.
- Modify: `src/views/explore/ExploreMap.vue`
  - Replace direct Mapbox map creation, navigation control, and DOM marker cleanup logic with AMap equivalents plus internal marker bookkeeping.
- Modify: `src/views/explore/Map3DView.vue`
  - Replace Mapbox 3D scene with AMap base map plus 2D DOM marker overlays and simplified zoom-driven effects.
- Modify: `src/components/map/Map3DEffects.vue`
  - Remove `mapbox-gl` types and marker logic; rebuild around AMap marker instances and DOM mount containers.
- Modify: `.env.example`
  - Replace Mapbox env example with AMap key and security code guidance.
- Modify: `package.json`
  - Remove `mapbox-gl` dependency after migration.
- Modify: `package-lock.json`
  - Update lockfile after dependency cleanup.
- Verify: `src/` search results
  - Confirm all runtime references to `mapbox-gl`, `mapboxgl`, and `VITE_MAPBOX_TOKEN` are removed.

## Implementation Notes Before Coding

- Public coordinate inputs remain `[lng, lat]` across component props and local page data.
- Do not add coordinate conversion unless AMap rendering reveals a real systematic offset.
- `MapContainer.vue` must expose the same methods currently used by `MapEntry.vue`: `getMap`, `setCenter`, `setZoom`, `flyTo`.
- AMap has no direct `NavigationControl` equivalent matching Mapbox usage; first implementation can enable built-in zoom controls via plugin or omit the visible control if the route already provides custom buttons. Preserve functional zooming via exposed methods even if control visuals differ.
- Because this codebase has no formal automated tests around map rendering, each task uses build verification plus targeted manual checks.

### Task 1: Add the shared AMap loader and config foundation

**Files:**
- Create: `src/lib/amapLoader.ts`
- Modify: `src/config/mapConfig.ts`
- Modify: `.env.example`
- Verify: `package.json`

- [ ] **Step 1: Create the AMap loader module**

Create `src/lib/amapLoader.ts` with this implementation:

```ts
declare global {
  interface Window {
    AMap?: AMapGlobal
    _AMapSecurityConfig?: {
      securityJsCode?: string
      serviceHost?: string
    }
  }
}

export interface AMapMarkerLike {
  setMap: (map: AMapMapLike | null) => void
  setPosition?: (position: [number, number]) => void
}

export interface AMapMapLike {
  destroy: () => void
  on: (event: string, handler: (...args: any[]) => void) => void
  off?: (event: string, handler: (...args: any[]) => void) => void
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setZoomAndCenter?: (zoom: number, center: [number, number]) => void
  getCenter?: () => { lng: number; lat: number }
  getZoom?: () => number
  plugin?: (plugins: string | string[], callback: () => void) => void
}

export interface AMapGlobal {
  Map: new (container: string | HTMLElement, options?: Record<string, any>) => AMapMapLike
  Marker: new (options?: Record<string, any>) => AMapMarkerLike
  Pixel?: new (x: number, y: number) => unknown
  Icon?: new (options?: Record<string, any>) => unknown
  ToolBar?: new (options?: Record<string, any>) => unknown
}

let amapPromise: Promise<AMapGlobal> | null = null

const AMAP_SCRIPT_ID = 'amap-jsapi'

const getRequiredEnv = (name: 'VITE_AMAP_KEY' | 'VITE_AMAP_SECURITY_JS_CODE') => {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required AMap environment variable: ${name}`)
  }
  return value
}

export const loadAMap = async (): Promise<AMapGlobal> => {
  if (window.AMap) {
    return window.AMap
  }

  if (amapPromise) {
    return amapPromise
  }

  amapPromise = new Promise<AMapGlobal>((resolve, reject) => {
    try {
      const key = getRequiredEnv('VITE_AMAP_KEY')
      const securityJsCode = getRequiredEnv('VITE_AMAP_SECURITY_JS_CODE')

      window._AMapSecurityConfig = { securityJsCode }

      const existingScript = document.getElementById(AMAP_SCRIPT_ID) as HTMLScriptElement | null
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (window.AMap) resolve(window.AMap)
          else reject(new Error('AMap script loaded but window.AMap is unavailable'))
        })
        existingScript.addEventListener('error', () => {
          reject(new Error('Failed to load AMap script'))
        })
        return
      }

      const script = document.createElement('script')
      script.id = AMAP_SCRIPT_ID
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
      script.async = true
      script.onload = () => {
        if (window.AMap) {
          resolve(window.AMap)
          return
        }

        reject(new Error('AMap script loaded but window.AMap is unavailable'))
      }
      script.onerror = () => {
        reject(new Error('Failed to load AMap script'))
      }

      document.head.appendChild(script)
    } catch (error) {
      reject(error)
    }
  }).catch((error) => {
    amapPromise = null
    throw error
  })

  return amapPromise
}
```

- [ ] **Step 2: Replace the shared map config with AMap settings**

Replace `src/config/mapConfig.ts` with:

```ts
export const MAP_CONFIG = {
  AMAP_KEY: import.meta.env.VITE_AMAP_KEY || '',
  AMAP_SECURITY_JS_CODE: import.meta.env.VITE_AMAP_SECURITY_JS_CODE || '',
  DEFAULT_CENTER: [121.4737, 31.2304] as [number, number],
  DEFAULT_ZOOM: 14,
  DEFAULT_VIEW_MODE: '2D' as const,
}

export const assertMapConfig = () => {
  if (!MAP_CONFIG.AMAP_KEY || !MAP_CONFIG.AMAP_SECURITY_JS_CODE) {
    throw new Error('AMap config is incomplete. Please check VITE_AMAP_KEY and VITE_AMAP_SECURITY_JS_CODE.')
  }
}
```

- [ ] **Step 3: Replace the environment example file**

Replace `.env.example` with:

```dotenv
# Environment Variables
# Copy this file to .env.local and fill in the values

# AMap JS API key
# Get yours at: https://lbs.amap.com/
VITE_AMAP_KEY=your_amap_key_here

# AMap security JS code
# Configure this alongside the web key in the AMap console
VITE_AMAP_SECURITY_JS_CODE=your_amap_security_js_code_here
```

- [ ] **Step 4: Run build verification for the new foundation**

Run:

```bash
npm run build
```

Expected: PASS. The build should succeed because the new loader/config files are additive and no runtime path is using them yet.

- [ ] **Step 5: Commit the shared foundation**

Run:

```bash
git add src/lib/amapLoader.ts src/config/mapConfig.ts .env.example
git commit -m "feat: add shared amap loader and config"
```

### Task 2: Rewrite the shared map container around AMap

**Files:**
- Modify: `src/components/map/MapContainer.vue`
- Modify: `src/config/mapConfig.ts`
- Create: none

- [ ] **Step 1: Replace Mapbox imports and local state types**

Update the top of `src/components/map/MapContainer.vue` to use AMap loader types instead of `mapbox-gl`:

```ts
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { MAP_CONFIG, assertMapConfig } from '../../config/mapConfig'
import { loadAMap, type AMapGlobal, type AMapMapLike, type AMapMarkerLike } from '../../lib/amapLoader'

interface MarkerItem {
  id: string
  position: [number, number]
  title?: string
  color?: string
  data?: any
}

interface Props {
  center?: [number, number]
  zoom?: number
  markers?: MarkerItem[]
}

interface Emits {
  (e: 'markerClick', marker: MarkerItem): void
  (e: 'mapClick', position: { lng: number; lat: number }): void
  (e: 'ready', map: AMapMapLike): void
}
```

Then replace the old refs with:

```ts
const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<AMapMapLike | null>(null)
const amap = ref<AMapGlobal | null>(null)
const mapMarkers = ref<AMapMarkerLike[]>([])
const isReady = ref(false)
const errorMessage = ref('')
```

- [ ] **Step 2: Replace `initMap()` with async AMap initialization**

Replace the existing `initMap()` with:

```ts
const initMap = async () => {
  if (!mapContainer.value) return

  try {
    assertMapConfig()
    amap.value = await loadAMap()

    const mapInstance = new amap.value.Map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      viewMode: MAP_CONFIG.DEFAULT_VIEW_MODE,
      zooms: [3, 20],
    })

    map.value = mapInstance

    mapInstance.on('click', (event: any) => {
      const lng = event?.lnglat?.getLng?.() ?? event?.lnglat?.lng
      const lat = event?.lnglat?.getLat?.() ?? event?.lnglat?.lat
      if (typeof lng === 'number' && typeof lat === 'number') {
        emit('mapClick', { lng, lat })
      }
    })

    if (mapInstance.plugin && amap.value.ToolBar) {
      mapInstance.plugin(['AMap.ToolBar'], () => {
        if (!map.value || !amap.value?.ToolBar || !(map.value as any).addControl) return
        ;(map.value as any).addControl(new amap.value.ToolBar({ position: 'RB' }))
      })
    }

    isReady.value = true
    errorMessage.value = ''
    emit('ready', mapInstance)
    updateMarkers()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '地图初始化失败，请检查高德配置。'
  }
}
```

- [ ] **Step 3: Replace marker creation and update logic**

Replace `createMarker()` and `updateMarkers()` with:

```ts
const createMarker = (markerData: MarkerItem) => {
  if (!map.value || !amap.value) return

  const color = markerData.color || '#FF2442'
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${color};
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    cursor: pointer;
    transition: transform 0.2s;
  `

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
  })
  el.addEventListener('click', (event) => {
    event.stopPropagation()
    emit('markerClick', markerData)
  })

  const marker = new amap.value.Marker({
    position: markerData.position,
    content: el,
    anchor: 'bottom-center',
    title: markerData.title,
  })

  marker.setMap(map.value)
  mapMarkers.value.push(marker)
}

const clearMarkers = () => {
  mapMarkers.value.forEach((marker) => marker.setMap(null))
  mapMarkers.value = []
}

const updateMarkers = () => {
  clearMarkers()
  props.markers.forEach(createMarker)
}
```

- [ ] **Step 4: Replace watcher/unmount/expose behavior to AMap equivalents**

Update the center/zoom watchers, unmount cleanup, and `defineExpose()` block to:

```ts
watch(() => props.markers, updateMarkers, { deep: true })

watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    map.value.setCenter(newCenter)
  }
}, { deep: true })

watch(() => props.zoom, (newZoom) => {
  if (map.value && typeof newZoom === 'number') {
    map.value.setZoom(newZoom)
  }
})

onMounted(() => {
  void initMap()
})

onUnmounted(() => {
  clearMarkers()
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
})

defineExpose({
  getMap: () => map.value,
  setCenter: (center: [number, number]) => {
    map.value?.setCenter(center)
  },
  setZoom: (zoom: number) => {
    map.value?.setZoom(zoom)
  },
  flyTo: (options: { center?: [number, number]; zoom?: number }) => {
    if (!map.value) return
    if (typeof options.zoom === 'number' && options.center && map.value.setZoomAndCenter) {
      map.value.setZoomAndCenter(options.zoom, options.center)
      return
    }
    if (options.center) map.value.setCenter(options.center)
    if (typeof options.zoom === 'number') map.value.setZoom(options.zoom)
  },
})
```

- [ ] **Step 5: Add loading + error UI and remove Mapbox-specific styles**

Replace the template and style tail of `MapContainer.vue` with:

```vue
<template>
  <div ref="mapContainer" class="map-container">
    <div v-if="!isReady && !errorMessage" class="map-loading">
      <div class="loading-spinner"></div>
      <span>地图加载中...</span>
    </div>
    <div v-else-if="errorMessage" class="map-error">
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-loading,
.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #666;
  font-size: 14px;
  gap: 12px;
  padding: 24px;
  text-align: center;
}

.map-error {
  color: #b42318;
  background: #fff5f5;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
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
```

- [ ] **Step 6: Run build verification after the shared container rewrite**

Run:

```bash
npm run build
```

Expected: PASS. Type errors may require small adjustments to the loader interfaces; fix those before proceeding.

- [ ] **Step 7: Commit the shared container migration**

Run:

```bash
git add src/components/map/MapContainer.vue src/config/mapConfig.ts src/lib/amapLoader.ts
git commit -m "feat: migrate shared map container to amap"
```

### Task 3: Update the shared map entry route to the new container semantics

**Files:**
- Modify: `src/views/explore/MapEntry.vue`

- [ ] **Step 1: Update AMap-specific readiness copy and keep route behavior stable**

In `src/views/explore/MapEntry.vue`, replace:

```ts
const handleMapReady = (_map: any) => {
  console.log('Mapbox 地图已就绪')
}
```

with:

```ts
const handleMapReady = (_map: any) => {
  console.log('AMap 地图已就绪')
}
```

Then replace the template comment:

```vue
      <!-- Mapbox 地图容器 -->
```

with:

```vue
      <!-- AMap 地图容器 -->
```

- [ ] **Step 2: Run build verification for the route wrapper**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit the route-wrapper cleanup**

Run:

```bash
git add src/views/explore/MapEntry.vue
git commit -m "refactor: update map entry for amap terminology"
```

### Task 4: Migrate `ExploreMap.vue` from direct Mapbox usage to direct AMap usage

**Files:**
- Modify: `src/views/explore/ExploreMap.vue`
- Modify: `src/lib/amapLoader.ts` (only if missing a type needed by this view)
- Modify: `src/config/mapConfig.ts` (only if defaults need reuse)

- [ ] **Step 1: Replace Mapbox imports and direct token usage**

At the top of `src/views/explore/ExploreMap.vue`, replace the Mapbox imports and token constant with:

```ts
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import SocialMatchChat from '../social/SocialMatchChat.vue'
import { poiList } from '../../lib/mockData'
import { loadAMap, type AMapGlobal, type AMapMapLike, type AMapMarkerLike } from '../../lib/amapLoader'
import { MAP_CONFIG, assertMapConfig } from '../../config/mapConfig'
```

Add these refs near the top-level state:

```ts
const amap = ref<AMapGlobal | null>(null)
const map = ref<AMapMapLike | null>(null)
const poiMarkers = ref<Map<string, AMapMarkerLike>>(new Map())
const mapError = ref('')
```

Delete these Mapbox-only lines entirely:

```ts
;(mapboxgl as any).workerUrl = ''
type MapboxMap = InstanceType<typeof mapboxgl.Map>
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string
```

- [ ] **Step 2: Replace POI marker creation with AMap markers plus explicit bookkeeping**

Replace `createPoiMarker()` and add a new `clearPoiMarkers()` helper:

```ts
const clearPoiMarkers = () => {
  poiMarkers.value.forEach((marker) => marker.setMap(null))
  poiMarkers.value.clear()
}

const createPoiMarker = (poi: typeof poiList[number]) => {
  if (!map.value || !amap.value) return

  const coords = poiCoords[poi.id] ?? MAP_CENTER
  const color = getPoiColor(poi.id)

  const el = document.createElement('div')
  el.className = 'poi-marker'
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${color};
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    cursor: pointer;
    transition: transform 0.2s;
  `
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.3)' })
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
  el.addEventListener('click', () => openPoi(poi.id))

  const marker = new amap.value.Marker({
    position: coords,
    content: el,
    anchor: 'bottom-center',
    title: poi.name,
  })

  marker.setMap(map.value)
  poiMarkers.value.set(poi.id, marker)
}
```

- [ ] **Step 3: Replace the mood watcher and map init lifecycle**

Replace the current watcher and `onMounted()` block with:

```ts
const renderFilteredPois = () => {
  clearPoiMarkers()
  const filtered = activeMood.value
    ? poiList.filter((poi) => poiMoodMap[poi.id] === activeMood.value)
    : poiList

  filtered.forEach(createPoiMarker)
}

watch(activeMood, () => {
  renderFilteredPois()
})

onMounted(async () => {
  if (!mapContainer.value) return

  try {
    assertMapConfig()
    amap.value = await loadAMap()

    const instance = new amap.value.Map(mapContainer.value, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      viewMode: MAP_CONFIG.DEFAULT_VIEW_MODE,
      zooms: [3, 20],
    })

    map.value = instance

    if (instance.plugin && amap.value.ToolBar && (instance as any).addControl) {
      instance.plugin(['AMap.ToolBar'], () => {
        if (!map.value || !amap.value?.ToolBar) return
        ;(map.value as any).addControl(new amap.value.ToolBar({ position: 'RB' }))
      })
    }

    mapError.value = ''
    renderFilteredPois()
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '地图加载失败，请检查高德配置。'
  }
})

onUnmounted(() => {
  clearPoiMarkers()
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
})
```

Also replace `locateUser()` with:

```ts
const locateUser = () => {
  if (!map.value) return
  if (map.value.setZoomAndCenter) {
    map.value.setZoomAndCenter(15, MAP_CENTER)
    return
  }
  map.value.setCenter(MAP_CENTER)
  map.value.setZoom(15)
}
```

- [ ] **Step 4: Add an inline map error state and remove Mapbox-specific comments/styles**

In the template, replace:

```vue
      <!-- Mapbox GL 地图容器 -->
      <div ref="mapContainer" class="absolute inset-0 z-0" />
```

with:

```vue
      <!-- AMap 地图容器 -->
      <div ref="mapContainer" class="absolute inset-0 z-0" />
      <div
        v-if="mapError"
        class="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+64px)] z-20 rounded-2xl bg-white/95 px-4 py-3 text-[13px] text-[#B42318] shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
      >
        {{ mapError }}
      </div>
```

At the bottom, replace the Mapbox-specific style block with:

```css
<style scoped>
:deep(.device-shell) {
  overflow: visible;
}
</style>
```

- [ ] **Step 5: Run build verification after the direct map page migration**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Manually verify the `/map` experience**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

Then open:

```text
http://127.0.0.1:5174/map
```

Confirm all of the following:

- AMap tiles load without Mapbox network requests.
- The top-right search and palette controls still render.
- Clicking a mood chip updates visible POI markers.
- The top-left locate button recenters the map.
- Clicking a POI marker still routes to `/poi/:id`.
- The bottom social CTA and `TabBar` remain visible.

- [ ] **Step 7: Commit the explore page migration**

Run:

```bash
git add src/views/explore/ExploreMap.vue src/lib/amapLoader.ts src/config/mapConfig.ts
git commit -m "feat: migrate explore map page to amap"
```

### Task 5: Migrate `Map3DView.vue` to a 2D-first AMap implementation

**Files:**
- Modify: `src/views/explore/Map3DView.vue`
- Modify: `src/lib/amapLoader.ts` (if extra type surface is needed)

- [ ] **Step 1: Replace Mapbox imports/state with AMap imports/state**

At the top of `src/views/explore/Map3DView.vue`, replace the Mapbox imports with:

```ts
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import MoodColorSelector from '../../components/ui/MoodColorSelector.vue'
import { MAP_CONFIG, assertMapConfig } from '../../config/mapConfig'
import Capsule3D from '../../components/effects/Capsule3D.vue'
import { loadAMap, type AMapGlobal, type AMapMapLike, type AMapMarkerLike } from '../../lib/amapLoader'
```

Replace these refs:

```ts
const mapContainer = ref<HTMLDivElement | null>(null)
const amap = ref<AMapGlobal | null>(null)
const map = ref<AMapMapLike | null>(null)
const isMapLoaded = ref(false)
const effectOverlays = ref<Map<string, {
  marker: AMapMarkerLike
  element: HTMLDivElement
}>>(new Map())
```

- [ ] **Step 2: Replace the 3D effect marker creation and visual update logic**

Replace `create3DEffect()`, `updateEffectVisuals()`, `updateAllEffects()`, and `clearEffects()` with:

```ts
const create3DEffect = (poi: POIItem) => {
  if (!map.value || !amap.value) return

  const container = document.createElement('div')
  container.className = 'poi-3d-effect'
  container.style.cssText = `
    position: relative;
    width: 120px;
    height: 120px;
    pointer-events: auto;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
  `

  const vueMount = document.createElement('div')
  vueMount.className = 'capsule-wrapper'
  vueMount.style.cssText = `
    width: 100%;
    height: 100%;
    transform: scale(0.45);
    transform-origin: center bottom;
    opacity: 0.95;
  `
  container.appendChild(vueMount)

  container.addEventListener('click', () => {
    void router.push(`/poi/${poi.id}/indoor`)
  })

  const marker = new amap.value.Marker({
    position: poi.coordinates,
    content: container,
    anchor: 'bottom-center',
    offset: [0, 0],
    title: poi.name,
  })

  marker.setMap(map.value)
  effectOverlays.value.set(poi.id, { marker, element: vueMount })
  updateEffectVisuals(poi.id)
}

const updateEffectVisuals = (poiId: string) => {
  const overlay = effectOverlays.value.get(poiId)
  if (!overlay || !map.value) return

  const zoom = map.value.getZoom?.() ?? MAP_CONFIG.DEFAULT_ZOOM
  const finalScale = Math.min(Math.max(0.3 + (zoom - 14) * 0.08, 0.25), 0.7)
  const opacity = Math.min(Math.max(0.55 + (zoom - 12) * 0.06, 0.55), 1)

  overlay.element.style.transform = `scale(${finalScale})`
  overlay.element.style.opacity = String(opacity)
}

const updateAllEffects = () => {
  effectOverlays.value.forEach((_, poiId) => {
    updateEffectVisuals(poiId)
  })
}

const clearEffects = () => {
  effectOverlays.value.forEach((overlay) => {
    overlay.marker.setMap(null)
  })
  effectOverlays.value.clear()
}
```

- [ ] **Step 3: Replace `initMap()` and `flyToPOI()` with AMap behavior**

Replace the current map lifecycle code with:

```ts
const initMap = async () => {
  if (!mapContainer.value) return

  try {
    assertMapConfig()
    amap.value = await loadAMap()

    const mapInstance = new amap.value.Map(mapContainer.value, {
      center: MAP_CONFIG.DEFAULT_CENTER,
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
      viewMode: MAP_CONFIG.DEFAULT_VIEW_MODE,
      zooms: [3, 20],
    })

    map.value = mapInstance
    isMapLoaded.value = true

    mapInstance.on('moveend', updateAllEffects)
    mapInstance.on('zoomend', updateAllEffects)

    nextTick(() => {
      verifiedPOIs.value.forEach((poi) => create3DEffect(poi))
    })
  } catch (error) {
    console.error('AMap init failed:', error)
  }
}

const flyToPOI = (poi: POIItem) => {
  if (!map.value) return
  if (map.value.setZoomAndCenter) {
    map.value.setZoomAndCenter(16, poi.coordinates)
    return
  }
  map.value.setCenter(poi.coordinates)
  map.value.setZoom(16)
}
```

Also update unmount cleanup to:

```ts
onUnmounted(() => {
  clearEffects()
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
})
```

- [ ] **Step 4: Remove Mapbox-specific comments/styles and keep Teleport rendering**

Replace these template comments:

```vue
      <!-- 3D地图容器 -->
```

with:

```vue
      <!-- AMap 地图容器 -->
```

Remove the Mapbox-specific style section:

```css
/* Mapbox样式覆盖 */
:deep(.mapboxgl-canvas) {
  outline: none;
}
```

Keep the rest of the Teleport-based `Capsule3D` rendering intact.

- [ ] **Step 5: Run build verification after the 3D-route downgrade migration**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Manually verify the downgraded 3D route**

With the dev server running, open the route used by this view and confirm:

- the base map loads through AMap,
- the floating `Capsule3D` visuals still appear above POIs,
- zooming changes the visual scale/opacity,
- clicking an effect still routes to `/poi/:id/indoor`,
- there are no runtime `mapboxgl is not defined` errors.

- [ ] **Step 7: Commit the 3D view migration**

Run:

```bash
git add src/views/explore/Map3DView.vue src/lib/amapLoader.ts
git commit -m "feat: migrate map 3d view to amap"
```

### Task 6: Migrate `Map3DEffects.vue` to AMap markers

**Files:**
- Modify: `src/components/map/Map3DEffects.vue`
- Modify: `src/lib/amapLoader.ts` (only if more shared types are needed)

- [ ] **Step 1: Replace Mapbox imports/types with shared AMap types**

At the top of `src/components/map/Map3DEffects.vue`, replace:

```ts
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import mapboxgl from 'mapbox-gl'
import Capsule3D from '../../components/effects/Capsule3D.vue'
```

with:

```ts
import { ref, onUnmounted, watch, nextTick } from 'vue'
import Capsule3D from '../../components/effects/Capsule3D.vue'
import type { AMapMapLike, AMapMarkerLike, AMapGlobal } from '../../lib/amapLoader'
```

Update props and refs to:

```ts
interface Props {
  map: AMapMapLike | null
  poiItems: POIItem[]
  visible?: boolean
  amap?: AMapGlobal | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  amap: null,
})

const effectMarkers = ref<Map<string, AMapMarkerLike>>(new Map())
const effectContainers = ref<Map<string, HTMLDivElement>>(new Map())
```

- [ ] **Step 2: Replace marker creation and visual-update logic**

Replace `create3DEffectMarker()`, `updateMarkerPosition()`, `removeEffectMarker()`, and `clearAllEffects()` with:

```ts
const create3DEffectMarker = (poi: POIItem) => {
  if (!props.map || !props.visible || !props.amap) return

  removeEffectMarker(poi.id)

  const container = document.createElement('div')
  container.className = 'effect-3d-container'
  container.style.cssText = `
    position: relative;
    width: 120px;
    height: 120px;
    pointer-events: none;
    transform-origin: center bottom;
  `

  const mountPoint = document.createElement('div')
  mountPoint.style.cssText = `
    width: 100%;
    height: 100%;
    transform: scale(0.45);
    opacity: 0.95;
  `
  container.appendChild(mountPoint)

  const marker = new props.amap.Marker({
    position: poi.coordinates,
    content: container,
    anchor: 'bottom-center',
    title: poi.name,
  })

  marker.setMap(props.map)

  effectMarkers.value.set(poi.id, marker)
  effectContainers.value.set(poi.id, mountPoint)

  updateMarkerPosition(poi.id, poi.coordinates, poi.altitude || 50)
}

const updateMarkerPosition = (id: string, coordinates: [number, number], altitude: number) => {
  const marker = effectMarkers.value.get(id)
  if (!marker || !props.map) return

  marker.setPosition?.(coordinates)

  const zoom = props.map.getZoom?.() ?? 14
  const scale = Math.min(Math.max(0.35 + (zoom - 14) * 0.08, 0.25), 0.75)
  const container = effectContainers.value.get(id)

  if (container) {
    container.style.transform = `scale(${scale}) translateY(${-Math.min(altitude / 20, 10)}px)`
  }
}

const removeEffectMarker = (id: string) => {
  const marker = effectMarkers.value.get(id)
  if (marker) {
    marker.setMap(null)
    effectMarkers.value.delete(id)
    effectContainers.value.delete(id)
  }
}

const clearAllEffects = () => {
  effectMarkers.value.forEach((marker) => marker.setMap(null))
  effectMarkers.value.clear()
  effectContainers.value.clear()
}
```

- [ ] **Step 3: Replace map event listeners with AMap-compatible listeners**

Replace the watcher block with:

```ts
const handleMapMove = () => {
  if (!props.map) return

  props.poiItems.forEach((poi) => {
    updateMarkerPosition(poi.id, poi.coordinates, poi.altitude || 50)
  })
}

const initEffects = () => {
  if (!props.map || !props.visible || !props.amap) return

  const verifiedPOIs = props.poiItems.filter((poi) => poi.verified !== false)
  verifiedPOIs.forEach((poi) => {
    create3DEffectMarker(poi)
  })
}

watch(() => props.map, (newMap) => {
  if (newMap) {
    nextTick(() => {
      initEffects()
      newMap.on('moveend', handleMapMove)
      newMap.on('zoomend', handleMapMove)
    })
  }
}, { immediate: true })

watch(() => props.poiItems, () => {
  clearAllEffects()
  initEffects()
}, { deep: true })

watch(() => props.visible, (visible) => {
  if (visible) {
    initEffects()
  } else {
    clearAllEffects()
  }
})
```

And replace unmount cleanup with:

```ts
onUnmounted(() => {
  if (props.map && props.map.off) {
    props.map.off('moveend', handleMapMove)
    props.map.off('zoomend', handleMapMove)
  }
  clearAllEffects()
})
```

- [ ] **Step 4: Update the template comment and run build verification**

Replace:

```vue
  <!-- 3D特效通过Mapbox Marker渲染，不需要额外的DOM -->
```

with:

```vue
  <!-- 3D特效通过 AMap Marker 渲染，不需要额外的DOM -->
```

Then run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit the AMap effects migration**

Run:

```bash
git add src/components/map/Map3DEffects.vue src/lib/amapLoader.ts
git commit -m "refactor: migrate map 3d effects to amap markers"
```

### Task 7: Remove Mapbox dependency and verify no runtime references remain

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Verify: `.env.example`
- Verify: `src/`

- [ ] **Step 1: Remove `mapbox-gl` from `package.json`**

Edit the dependencies block in `package.json` from:

```json
  "dependencies": {
    "mapbox-gl": "^3.21.0",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0"
  },
```

to:

```json
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4.5.0"
  },
```

- [ ] **Step 2: Refresh the lockfile**

Run:

```bash
npm uninstall mapbox-gl
```

Expected: `package.json` and `package-lock.json` update together with `mapbox-gl` removed.

- [ ] **Step 3: Search the codebase for remaining Mapbox runtime references**

Run:

```bash
rg "mapbox-gl|mapboxgl|VITE_MAPBOX_TOKEN|mapbox://styles" src .env.example package.json
```

Expected: no matches in active source files or env examples. If comments remain in unrelated docs, leave them unless they cause confusion during implementation.

- [ ] **Step 4: Run the final production build verification**

Run:

```bash
npm run build
```

Expected: PASS with no `Cannot resolve 'mapbox-gl'` errors and no TypeScript references to removed Mapbox types.

- [ ] **Step 5: Commit dependency cleanup and final migration wiring**

Run:

```bash
git add package.json package-lock.json .env.example src
git commit -m "chore: remove mapbox dependency after amap migration"
```

### Task 8: End-to-end manual verification of migrated flows

**Files:**
- Modify: none unless a bug is found during verification
- Verify: `src/views/explore/MapEntry.vue`
- Verify: `src/views/explore/ExploreMap.vue`
- Verify: `src/views/explore/Map3DView.vue`
- Verify: `src/components/map/MapContainer.vue`
- Verify: `.env.local`

- [ ] **Step 1: Prepare local AMap env values**

Ensure `.env.local` contains real credentials in this exact shape:

```dotenv
VITE_AMAP_KEY=your_real_amap_key
VITE_AMAP_SECURITY_JS_CODE=your_real_amap_security_js_code
```

Expected: credentials are present before launching the app, otherwise the new error state should appear.

- [ ] **Step 2: Start the app for manual verification**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

Expected: Vite serves the application successfully.

- [ ] **Step 3: Verify the shared map entry flow**

Open the route that renders `MapEntry.vue` and confirm:

- markers render with the expected custom colors,
- marker clicks still log or trigger the same event path,
- tapping the location button zooms/recenters,
- tapping “开始探索” still routes to `/map`.

- [ ] **Step 4: Verify the main explore map flow**

Open `/map` and confirm:

- no Mapbox requests appear in the network panel,
- mood filtering adds/removes markers correctly,
- the search/filter overlays still open/close correctly,
- the left locate button recenters the map,
- clicking a POI marker routes to the expected POI page,
- the social chat overlay and `TabBar` still behave as before.

- [ ] **Step 5: Verify the downgraded 3D view flow**

Open the route for `Map3DView.vue` and confirm:

- AMap loads successfully,
- the `Capsule3D` visual overlays still appear,
- zooming changes overlay scale visually,
- clicking an overlay navigates to `/poi/:id/indoor`,
- there are no console errors referencing Mapbox.

- [ ] **Step 6: Validate error handling by temporarily breaking env config**

Temporarily clear one env value, restart the dev server, and confirm:

- `MapContainer.vue` shows an actionable error state,
- `ExploreMap.vue` shows its inline error card,
- the message clearly points to `VITE_AMAP_KEY` / `VITE_AMAP_SECURITY_JS_CODE`.

Restore the env values afterward.

- [ ] **Step 7: Commit only if verification uncovered and fixed issues**

If no fixes were required, do nothing. If fixes were required, run:

```bash
git add src package.json package-lock.json .env.example
git commit -m "fix: polish amap migration verification issues"
```

## Plan Self-Review Notes

- Spec coverage check:
  - Shared AMap loader and env handling: covered by Task 1.
  - Map config rewrite: covered by Task 1.
  - `MapContainer.vue` migration with preserved public interface: covered by Task 2.
  - `MapEntry.vue` compatibility: covered by Task 3.
  - `ExploreMap.vue` migration and mood-filter marker refresh: covered by Task 4.
  - `Map3DView.vue` and `Map3DEffects.vue` migration with 2D-first downgrade: covered by Tasks 5 and 6.
  - Removal of `mapbox-gl` and `VITE_MAPBOX_TOKEN`: covered by Task 7.
  - Build and manual verification, including config-error states and coordinate sanity checks: covered by Tasks 4, 5, 7, and 8.
- Placeholder scan:
  - No `TODO`, `TBD`, “implement later”, or vague “write tests for above” placeholders remain.
  - Every code-changing step contains concrete code or an exact file replacement target.
- Type consistency check:
  - Shared AMap names are consistently `AMapGlobal`, `AMapMapLike`, and `AMapMarkerLike`.
  - The existing external `MapContainer` API remains `getMap`, `setCenter`, `setZoom`, and `flyTo` throughout the plan.
  - Coordinate inputs stay `[number, number]` / `[lng, lat]` in every task.