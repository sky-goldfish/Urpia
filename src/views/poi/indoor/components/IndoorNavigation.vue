<script setup lang="ts">
interface Props {
  poiName?: string
  currentArea?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const goBack = () => {
  emit('back')
}

// 打开地图导航
const openMapNavigation = () => {
  // 可以集成地图导航功能
  console.log('打开地图导航')
}

// 分享POI
const sharePOI = () => {
  // 分享功能
  console.log('分享POI')
}
</script>

<template>
  <nav class="indoor-navigation">
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <button class="nav-back" @click="goBack">
        <span class="nav-icon">←</span>
        <span class="nav-text">返回地图</span>
      </button>
      
      <div class="nav-title">
        <h1 class="poi-name">{{ poiName || 'POI室内场景' }}</h1>
        <span class="area-badge">{{ currentArea || '室内' }}</span>
      </div>
      
      <div class="nav-actions">
        <button class="nav-btn" @click="sharePOI">
          <span class="nav-icon">↗</span>
        </button>
      </div>
    </div>
    
    <!-- 底部功能栏 -->
    <div class="nav-footer">
      <button class="footer-btn primary" @click="openMapNavigation">
        <span class="btn-icon">🧭</span>
        <span class="btn-text">导航</span>
      </button>
      
      <button class="footer-btn">
        <span class="btn-icon">📸</span>
        <span class="btn-text">拍照</span>
      </button>
      
      <button class="footer-btn">
        <span class="btn-icon">ℹ️</span>
        <span class="btn-text">信息</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.indoor-navigation {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: env(safe-area-inset-top) 16px calc(env(safe-area-inset-bottom) + 16px);
}

/* 顶部导航栏 */
.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: auto;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 20px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-back:hover {
  background: rgba(0, 0, 0, 0.7);
}

.nav-icon {
  font-size: 1rem;
}

.nav-text {
  font-size: 0.85rem;
}

.nav-title {
  text-align: center;
}

.poi-name {
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.area-badge {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.7rem;
  margin-top: 4px;
}

.nav-actions {
  display: flex;
  gap: 8px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

/* 底部功能栏 */
.nav-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  pointer-events: auto;
}

.footer-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.footer-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: translateY(-2px);
}

.footer-btn.primary {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.footer-btn.primary:hover {
  background: linear-gradient(135deg, #ff7b7b 0%, #ff6b6b 100%);
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
}

.btn-text {
  font-size: 0.75rem;
  opacity: 0.9;
}
</style>
