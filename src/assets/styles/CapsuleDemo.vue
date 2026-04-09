<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isPlaying = ref(true)
const scale = ref(1)
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- 顶部导航 -->
    <div class="absolute top-0 left-0 right-0 z-20 p-6">
      <div class="flex items-center justify-between max-w-4xl mx-auto">
        <div>
          <h1 class="text-2xl font-bold text-white">3D 胶囊特效</h1>
          <p class="text-sm text-gray-400 mt-1">Capsule 3D Animation Demo</p>
        </div>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
          @click="router.push('/homemap')"
        >
          <span class="material-symbols-outlined text-white">close</span>
        </button>
      </div>
    </div>

    <!-- 3D 胶囊展示区域 -->
    <div class="relative z-10 flex items-center justify-center" :style="{ transform: `scale(${scale})` }">
      <div class="content">
        <div class="pill" :class="{ 'animation-paused': !isPlaying }">
          <div class="medicine">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i
            ><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
          <div class="side"></div>
          <div class="side"></div>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
      <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4">
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          @click="isPlaying = !isPlaying"
        >
          <span class="material-symbols-outlined text-white">
            {{ isPlaying ? 'pause' : 'play_arrow' }}
          </span>
          <span class="text-white text-sm">{{ isPlaying ? '暂停' : '播放' }}</span>
        </button>

        <div class="w-px h-8 bg-white/20"></div>

        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-white/60 text-sm">zoom_out</span>
          <input
            v-model="scale"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            class="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
          <span class="material-symbols-outlined text-white/60 text-sm">zoom_in</span>
        </div>

        <div class="w-px h-8 bg-white/20"></div>

        <div class="text-white/60 text-sm">
          缩放: {{ Math.round(scale * 100) }}%
        </div>
      </div>
    </div>

    <!-- 说明文字 -->
    <div class="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 text-center">
      <p class="text-gray-400 text-sm">
        这是一个 3D 胶囊动画效果，使用纯 CSS 实现
      </p>
    </div>
  </main>
</template>

<style scoped>
.content {
  width: 50vmin;
  height: 50vmin;
  background: #fff0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill {
  background: #fff0;
  width: 15vmin;
  height: 40vmin;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  transform: rotate(180deg);
  animation: spin 4s linear 0s infinite;
  position: relative;
}

.pill.animation-paused {
  animation-play-state: paused;
}

@keyframes spin {
  100% {
    transform: rotate(-540deg);
  }
}

/* 透明胶囊外壳 */
.pill .side {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.4) 0%, 
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.2) 100%);
  position: relative;
  overflow: hidden;
  width: 11vmin;
  height: 15vmin;
  border-radius: 6vmin 6vmin 0 0;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-bottom: none;
  backdrop-filter: blur(2px);
  box-shadow: 
    inset 0 2px 10px rgba(255, 255, 255, 0.3),
    inset 0 -2px 10px rgba(255, 255, 255, 0.1),
    0 0 20px rgba(100, 200, 255, 0.2);
}

.pill .side + .side {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2) 0%, 
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.4) 100%);
  border-radius: 0 0 6vmin 6vmin;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top: none;
  animation: open 2s ease-in-out 0s infinite;
  box-shadow: 
    inset 0 -2px 10px rgba(255, 255, 255, 0.3),
    inset 0 2px 10px rgba(255, 255, 255, 0.1),
    0 0 20px rgba(100, 200, 255, 0.2);
}

.pill.animation-paused .side + .side {
  animation-play-state: paused;
}

@keyframes open {
  0%,
  20%,
  80%,
  100% {
    margin-top: 0;
  }
  30%,
  70% {
    margin-top: 10vmin;
  }
}

/* 玻璃反光效果 */
.pill .side:before {
  content: "";
  position: absolute;
  width: 3vmin;
  height: 12vmin;
  bottom: 1vmin;
  right: 1.5vmin;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.8) 0%, 
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.4) 100%);
  border-radius: 1.5vmin;
  filter: blur(1px);
  animation: shine 2s ease-out -1s infinite alternate-reverse;
}

.pill.animation-paused .side:before {
  animation-play-state: paused;
}

.pill .side + .side:before {
  bottom: inherit;
  top: 1vmin;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.4) 0%, 
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.8) 100%);
}

/* 外壳边缘高光 */
.pill .side:after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  bottom: 0;
  left: 0;
  border-radius: 6vmin 6vmin 0 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-bottom-color: transparent;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.5);
}

.pill .side + .side:after {
  bottom: inherit;
  top: 0;
  border-radius: 0 0 6vmin 6vmin;
  border-top-color: transparent;
  border-bottom-color: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 -2px 4px rgba(255, 255, 255, 0.5);
}

.pill .side + .side:after {
  bottom: inherit;
  top: 0;
  border-radius: 0 0 6vmin 6vmin;
  border-top-color: #fff0;
  border-top-width: 0vmin;
  border-bottom-width: 1vmin;
}

@keyframes shine {
  0%,
  46% {
    right: 1.5vmin;
  }
  54%,
  100% {
    right: 7.5vmin;
  }
}

@keyframes shadow {
  0%,
  49.999% {
    transform: rotateY(0deg);
    left: 0;
  }
  50%,
  100% {
    transform: rotateY(180deg);
    left: -3vmin;
  }
}

/* 发光液体容器 */
.medicine {
  position: absolute;
  width: calc(100% - 4vmin);
  height: calc(100% - 8vmin);
  background: linear-gradient(180deg,
    rgba(0, 255, 200, 0.3) 0%,
    rgba(0, 200, 255, 0.5) 30%,
    rgba(100, 100, 255, 0.6) 60%,
    rgba(200, 50, 255, 0.4) 100%);
  border-radius: 4vmin;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  box-shadow: 
    inset 0 0 30px rgba(0, 255, 200, 0.3),
    0 0 30px rgba(0, 200, 255, 0.4),
    0 0 60px rgba(100, 100, 255, 0.3);
  animation: liquid-glow 3s ease-in-out infinite alternate;
  overflow: hidden;
}

.medicine::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%);
  animation: liquid-shimmer 4s linear infinite;
}

.pill.animation-paused .medicine::before {
  animation-play-state: paused;
}

@keyframes liquid-glow {
  0% {
    box-shadow: 
      inset 0 0 30px rgba(0, 255, 200, 0.3),
      0 0 30px rgba(0, 200, 255, 0.4),
      0 0 60px rgba(100, 100, 255, 0.3);
  }
  100% {
    box-shadow: 
      inset 0 0 50px rgba(0, 255, 200, 0.5),
      0 0 50px rgba(0, 200, 255, 0.6),
      0 0 100px rgba(100, 100, 255, 0.5);
  }
}

@keyframes liquid-shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

/* 发光粒子 */
.medicine i {
  width: 0.8vmin;
  height: 0.8vmin;
  background: radial-gradient(circle, 
    rgba(255, 255, 255, 1) 0%, 
    rgba(200, 255, 255, 0.8) 40%,
    rgba(100, 200, 255, 0) 100%);
  border-radius: 100%;
  position: absolute;
  box-shadow: 
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(0, 255, 200, 0.6),
    0 0 30px rgba(100, 200, 255, 0.4);
  animation: particle-float 2s ease-in-out infinite alternate;
}

.pill.animation-paused .medicine i {
  animation-play-state: paused;
}

.medicine i:nth-child(2n + 2) {
  width: 1.2vmin;
  height: 1.2vmin;
  margin-top: -4vmin;
  margin-right: -4vmin;
  animation-delay: -0.3s;
}

.medicine i:nth-child(3n + 3) {
  width: 1.5vmin;
  height: 1.5vmin;
  margin-top: 3vmin;
  margin-right: 2vmin;
  animation-delay: -0.5s;
}

.medicine i:nth-child(4) {
  margin-top: -4vmin;
  margin-right: 3vmin;
  animation-delay: -0.6s;
}

.medicine i:nth-child(5) {
  margin-top: 4vmin;
  margin-right: -3vmin;
  animation-delay: -0.8s;
}

.medicine i:nth-child(6) {
  margin-top: 0vmin;
  margin-right: -2.5vmin;
  animation-delay: -1s;
}

.medicine i:nth-child(7) {
  margin-top: -1vmin;
  margin-right: 5vmin;
  animation-delay: -1.1s;
}

.medicine i:nth-child(8) {
  margin-top: 5vmin;
  margin-right: -0.5vmin;
  animation-delay: -1.3s;
}

.medicine i:nth-child(9) {
  margin-top: 3vmin;
  margin-right: -5vmin;
  animation-delay: -1.5s;
}

.medicine i:nth-child(10) {
  margin-top: -5vmin;
  margin-right: 0vmin;
  animation-delay: -1.7s;
}

.medicine i:nth-child(1n + 10) {
  width: 0.5vmin;
  height: 0.5vmin;
}

.medicine i:nth-child(11) {
  margin-top: 5vmin;
  margin-right: 5vmin;
  animation-delay: -1.9s;
}

.medicine i:nth-child(12) {
  margin-top: -6vmin;
  margin-right: -6vmin;
  animation-delay: -2.1s;
}

.medicine i:nth-child(13) {
  margin-top: -1vmin;
  margin-right: 2vmin;
  animation-delay: -2.3s;
}

.medicine i:nth-child(14) {
  margin-top: -2vmin;
  margin-right: -0.5vmin;
  animation-delay: -2.5s;
}

.medicine i:nth-child(15) {
  margin-top: -0.5vmin;
  margin-right: -5vmin;
  animation-delay: -2.7s;
}

@keyframes particle-float {
  0%,
  100% {
    transform: translate3d(0vmin, 0vmin, 0) scale(1);
    opacity: 0.8;
  }
  25% {
    transform: translate3d(0.2vmin, 3vmin, 0) scale(1.2);
    opacity: 1;
  }
  75% {
    transform: translate3d(-0.1vmin, -2vmin, 0) scale(0.9);
    opacity: 0.6;
  }
}

/* 滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
