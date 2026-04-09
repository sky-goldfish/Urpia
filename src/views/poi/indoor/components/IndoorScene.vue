<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  poiData: any
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'hotspot-click', hotspotId: string): void
}>()

const sceneContainer = ref<HTMLDivElement | null>(null)
const isSceneReady = ref(false)

// 模拟3D场景初始化
onMounted(() => {
  // 这里将来会集成Three.js或其他3D引擎
  setTimeout(() => {
    isSceneReady.value = true
  }, 100)
})

onUnmounted(() => {
  // 清理3D场景资源
})

// 处理热点点击
const onHotspotClick = (hotspotId: string) => {
  emit('hotspot-click', hotspotId)
}
</script>

<template>
  <div ref="sceneContainer" class="indoor-scene">
    <!-- 3D场景渲染画布 -->
    <canvas class="scene-canvas"></canvas>
    
    <!-- 场景占位（美术资产加载前显示） -->
    <div v-if="!isSceneReady" class="scene-placeholder">
      <div class="placeholder-grid">
        <div v-for="n in 9" :key="n" class="grid-cell"></div>
      </div>
    </div>
    
    <!-- 交互热点层 -->
    <div class="hotspot-layer">
      <!-- 动态生成的交互点 -->
      <button
        v-for="hotspot in poiData?.hotspots || []"
        :key="hotspot.id"
        class="hotspot-button"
        :style="{
          left: `${hotspot.x}%`,
          top: `${hotspot.y}%`
        }"
        @click="onHotspotClick(hotspot.id)"
      >
        <span class="hotspot-pulse"></span>
        <span class="hotspot-icon">{{ hotspot.icon || '✦' }}</span>
      </button>
    </div>
    
    <!-- 场景信息覆盖层 -->
    <div class="scene-overlay">
      <div class="area-indicator">
        <span class="area-label">{{ poiData?.currentArea || '主区域' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.indoor-scene {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
}

.scene-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 场景占位 */
.scene-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%);
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

/* 交互热点层 */
.hotspot-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hotspot-button {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.hotspot-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translate(-50%, -50%) scale(1.1);
}

.hotspot-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  animation: hotspot-pulse 2s ease-out infinite;
}

@keyframes hotspot-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.hotspot-icon {
  color: #fff;
  font-size: 1.2rem;
  z-index: 1;
}

/* 场景覆盖层 */
.scene-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  padding: env(safe-area-inset-top) 20px 20px;
}

.area-indicator {
  position: absolute;
  top: env(safe-area-inset-top, 20px);
  left: 50%;
  transform: translateX(-50%);
}

.area-label {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  color: #fff;
  font-size: 0.9rem;
  letter-spacing: 1px;
}
</style>
