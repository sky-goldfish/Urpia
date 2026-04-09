<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isPlaying = ref(true)
const scale = ref(1)
const animationSpeed = ref(1)

// 颜色定义接口 - 从数据库获取
interface LiquidColorConfig {
  baseColor: string      // 基础颜色 (如: #ffbf48)
  gradientEnd?: string   // 渐变结束颜色 (可选，默认为基础颜色的深色版本)
  opacity?: number       // 透明度 (0-1, 默认 1)
}

// 模拟从数据库获取的颜色配置
const colorConfig = ref<LiquidColorConfig>({
  baseColor: '#ffbf48',  // 默认橙黄色
  gradientEnd: '#be4a1d', // 默认红棕色
  opacity: 1
})

// 计算渐变颜色
const gradientColors = computed(() => {
  const base = colorConfig.value.baseColor
  const end = colorConfig.value.gradientEnd || adjustColorBrightness(base, -40)
  return {
    colorOne: base,
    colorTwo: end,
    opacity: colorConfig.value.opacity ?? 1
  }
})

// 调整颜色亮度 (辅助函数)
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex flex-col items-center justify-center relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
    </div>

    <!-- 顶部导航 -->
    <div class="absolute top-0 left-0 right-0 z-20 p-6">
      <div class="flex items-center justify-between max-w-4xl mx-auto">
        <div>
          <h1 class="text-2xl font-bold text-white">Spirit Bubble</h1>
          <p class="text-sm text-gray-400 mt-1">流体气泡动画效果</p>
        </div>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
          @click="router.push('/map')"
        >
          <span class="material-symbols-outlined text-white">close</span>
        </button>
      </div>
    </div>

    <!-- Spirit Bubble 展示区域 -->
    <div class="relative z-10 flex items-center justify-center" :style="{ transform: `scale(${scale})` }">
      <div class="capsule-container" :class="{ 'animation-paused': !isPlaying }" :style="{
        '--time-animation': `${2 / animationSpeed}s`,
        '--color-one': gradientColors.colorOne,
        '--color-two': gradientColors.colorTwo,
        '--liquid-opacity': gradientColors.opacity
      }">
        <!-- 透明胶囊外壳 -->
        <div class="capsule-shell">
          <!-- 内部液体 -->
          <div class="loader" :class="{ 'animation-paused': !isPlaying }" :style="{ '--time-animation': `${2 / animationSpeed}s` }">
            <div class="liquid-container">
              <div class="liquid-fill"></div>
              <div class="wave"></div>
            </div>
          </div>
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

        <div class="flex items-center gap-2">
          <span class="text-white/60 text-sm">速度</span>
          <input
            v-model="animationSpeed"
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            class="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
          <span class="text-white/60 text-xs">{{ animationSpeed.toFixed(1) }}x</span>
        </div>
      </div>
    </div>

    <!-- 说明文字 -->
    <div class="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 text-center">
      <p class="text-gray-400 text-sm">
        流体变形气泡效果，使用 SVG mask 和 CSS 滤镜实现
      </p>
    </div>
  </main>
</template>

<style scoped>
/* 胶囊容器 - 参考 capsule_3d.vue 的尺寸比例 */
.capsule-container {
  --color-one: #ffbf48;
  --color-two: #be4a1d;
  --color-three: #ffbf4780;
  --color-four: #bf4a1d80;
  --color-five: #ffbf4740;
  --time-animation: 2s;
  position: relative;
  width: 15vmin;
  height: 40vmin;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 10px 30px rgba(255, 191, 72, 0.3));
}

/* 透明胶囊外壳 */
.capsule-shell {
  width: 11vmin;
  height: 32vmin;
  position: relative;
  overflow: hidden;
  border-radius: 6vmin;
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(2px);
  box-shadow:
    inset 0 2px 15px rgba(255, 255, 255, 0.2),
    inset 0 -2px 15px rgba(255, 255, 255, 0.1),
    0 0 30px rgba(255, 191, 72, 0.2),
    0 0 60px rgba(255, 100, 50, 0.1);
}

/* 外壳高光效果 */
.capsule-shell::before {
  content: '';
  position: absolute;
  top: 5%;
  left: 15%;
  width: 20%;
  height: 40%;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.1) 100%);
  border-radius: 50%;
  filter: blur(3px);
  z-index: 10;
  pointer-events: none;
}

/* 流体动画容器 */
.loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
}

.loader.animation-paused,
.loader.animation-paused .liquid,
.loader.animation-paused svg #clipping-liquid,
.loader.animation-paused svg polygon {
  animation-play-state: paused !important;
}

/* 液体容器 */
.liquid-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 80%;
  overflow: hidden;
  border-radius: 0 0 5vmin 5vmin;
}

/* 液体填充 - 纯色填充到75%高度，带漏斗形旋转效果 */
.liquid-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 75%;
  background: linear-gradient(180deg,
    var(--color-one) 0%,
    var(--color-two) 100%);
  animation: funnel-rotate 8s linear infinite;
  transform-origin: center center;
}

/* 漏斗形旋转效果 - 液体内部形成缓慢旋转的漏斗形状 */
.liquid-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 100%;
  background: radial-gradient(ellipse at center,
    transparent 0%,
    transparent 30%,
    rgba(255, 255, 255, 0.15) 40%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.15) 60%,
    transparent 70%,
    transparent 100%);
  animation: funnel-swirl 6s ease-in-out infinite;
  border-radius: 50%;
}

/* 漏斗中心漩涡 */
.liquid-fill::after {
  content: '';
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 20%;
  height: 60%;
  background: conic-gradient(from 0deg,
    transparent 0deg,
    rgba(255, 255, 255, 0.2) 60deg,
    rgba(255, 255, 255, 0.4) 120deg,
    rgba(255, 255, 255, 0.2) 180deg,
    transparent 240deg,
    rgba(255, 255, 255, 0.1) 300deg,
    transparent 360deg);
  animation: funnel-vortex 10s linear infinite;
  border-radius: 50%;
  filter: blur(2px);
}

/* 波浪效果 - 只在液体表面 */
.wave {
  width: 200%;
  height: 100%;
  background: linear-gradient(180deg,
    var(--color-one) 0%,
    var(--color-two) 100%);
  position: absolute;
  left: -50%;
  top: 5%;
  border-radius: 40%;
  animation: wave-surface 4s ease-in-out infinite;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.wave::before {
  content: '';
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 50%);
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 40%;
}

@keyframes wave-surface {
  0%, 100% {
    transform: translateX(0) translateY(0) rotate(0deg);
    border-radius: 40% 45% 42% 48%;
  }
  25% {
    transform: translateX(-2%) translateY(-5%) rotate(2deg);
    border-radius: 45% 40% 48% 42%;
  }
  50% {
    transform: translateX(-4%) translateY(0) rotate(0deg);
    border-radius: 42% 48% 40% 45%;
  }
  75% {
    transform: translateX(-2%) translateY(5%) rotate(-2deg);
    border-radius: 48% 42% 45% 40%;
  }
}

@keyframes colorize {
  0% {
    filter: hue-rotate(0deg);
  }
  20% {
    filter: hue-rotate(-30deg);
  }
  40% {
    filter: hue-rotate(-60deg);
  }
  60% {
    filter: hue-rotate(-90deg);
  }
  80% {
    filter: hue-rotate(-45deg);
  }
  100% {
    filter: hue-rotate(0deg);
  }
}

/* 漏斗旋转动画 - 整体缓慢旋转 */
@keyframes funnel-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 漏斗漩涡动画 - 形成漏斗形状的旋转效果 */
@keyframes funnel-swirl {
  0%, 100% {
    transform: translateX(-50%) scaleY(1) rotate(0deg);
    opacity: 0.6;
  }
  25% {
    transform: translateX(-50%) scaleY(0.9) rotate(90deg);
    opacity: 0.8;
  }
  50% {
    transform: translateX(-50%) scaleY(1.1) rotate(180deg);
    opacity: 0.6;
  }
  75% {
    transform: translateX(-50%) scaleY(0.95) rotate(270deg);
    opacity: 0.9;
  }
}

/* 漏斗中心漩涡 - 锥形旋转效果 */
@keyframes funnel-vortex {
  0% {
    transform: translateX(-50%) rotate(0deg) scale(1);
  }
  50% {
    transform: translateX(-50%) rotate(180deg) scale(1.1);
  }
  100% {
    transform: translateX(-50%) rotate(360deg) scale(1);
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
