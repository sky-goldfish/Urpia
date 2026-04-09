<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePOIStore } from '../../../stores/poiStore'
import IndoorScene from './components/IndoorScene.vue'
import IndoorNavigation from './components/IndoorNavigation.vue'
import AssetPreloader from './components/AssetPreloader.vue'

const route = useRoute()
const router = useRouter()
const poiStore = usePOIStore()

// 从路由参数获取POI信息
const poiId = ref<string>(route.params.id as string)
const poiData = ref<any>(null)
const isLoading = ref(true)
const loadProgress = ref(0)

// 加载POI室内场景数据
const loadPOIData = async () => {
  isLoading.value = true
  loadProgress.value = 0
  
  try {
    // 模拟加载进度
    const progressInterval = setInterval(() => {
      if (loadProgress.value < 90) {
        loadProgress.value += Math.random() * 15
      }
    }, 200)
    
    // 从store获取POI数据
    poiData.value = await poiStore.getPOIIndoorData(poiId.value)
    
    clearInterval(progressInterval)
    loadProgress.value = 100
    
    // 延迟隐藏加载界面，确保资源准备完成
    setTimeout(() => {
      isLoading.value = false
    }, 500)
  } catch (error) {
    console.error('加载POI室内数据失败:', error)
    // 加载失败时返回地图
    setTimeout(() => {
      router.back()
    }, 2000)
  }
}

// 返回地图
const backToMap = () => {
  router.push('/homemap')
}

// 处理场景中的交互点
const handleHotspotClick = (hotspotId: string) => {
  console.log('点击交互点:', hotspotId)
  // 可以触发详情弹窗或其他交互
}

onMounted(() => {
  loadPOIData()
})
</script>

<template>
  <main class="poi-indoor-view">
    <!-- 资源预加载器 -->
    <AssetPreloader 
      :poi-id="poiId" 
      @progress="loadProgress = $event"
    />
    
    <!-- 加载界面 -->
    <Transition name="fade">
      <div v-if="isLoading" class="loading-screen">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <p class="loading-text">正在进入室内场景...</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${Math.min(loadProgress, 100)}%` }"></div>
          </div>
          <p class="progress-text">{{ Math.round(Math.min(loadProgress, 100)) }}%</p>
        </div>
      </div>
    </Transition>
    
    <!-- 室内场景主体 -->
    <Transition name="scene-fade">
      <div v-show="!isLoading" class="indoor-container">
        <!-- 3D场景渲染区域 -->
        <IndoorScene 
          :poi-data="poiData"
          @hotspot-click="handleHotspotClick"
        />
        
        <!-- 室内导航UI -->
        <IndoorNavigation 
          :poi-name="poiData?.name"
          :current-area="poiData?.currentArea"
          @back="backToMap"
        />
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.poi-indoor-view {
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
}

/* 加载界面 */
.loading-screen {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-content {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: #ff6b6b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-ring:nth-child(2) {
  border-top-color: #4ecdc4;
  animation-duration: 1.5s;
  animation-direction: reverse;
  inset: 10px;
}

.spinner-ring:nth-child(3) {
  border-top-color: #ffe66d;
  animation-duration: 2s;
  inset: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  letter-spacing: 2px;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

/* 室内场景容器 */
.indoor-container {
  position: fixed;
  inset: 0;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scene-fade-enter-active {
  transition: opacity 0.8s ease 0.3s;
}

.scene-fade-leave-active {
  transition: opacity 0.3s ease;
}

.scene-fade-enter-from,
.scene-fade-leave-to {
  opacity: 0;
}
</style>
