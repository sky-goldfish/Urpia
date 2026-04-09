<script setup lang="ts">
import { computed } from 'vue'
import { useMoodStore } from '../../stores/moodStore'

// 3D胶囊特效组件 - 使用 SpiritBubbleDemo 样式
interface Props {
  color?: string
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  color: '#f7c340',
  size: 'medium'
})

const moodStore = useMoodStore()

// 使用情绪颜色或传入的颜色
const capsuleColor = computed(() => {
  return props.color || moodStore.currentMood.hex
})

// 计算渐变结束颜色（深色版本）
const gradientEndColor = computed(() => {
  const hex = capsuleColor.value
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * -40)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
})

const sizeMap = {
  small: { '--capsule-scale': '0.6' },
  medium: { '--capsule-scale': '1' },
  large: { '--capsule-scale': '1.4' }
}
</script>

<template>
  <div class="capsule-wrapper" :style="sizeMap[size]">
    <div class="capsule-container">
      <!-- 透明胶囊外壳 -->
      <div class="capsule-shell">
        <!-- 内部液体 -->
        <div class="loader">
          <div class="liquid-container">
            <div class="liquid-fill"></div>
            <div class="wave"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.capsule-wrapper {
  --color-one: v-bind(capsuleColor);
  --color-two: v-bind(gradientEndColor);
  --capsule-scale: 1;
  width: calc(15vmin * var(--capsule-scale));
  height: calc(40vmin * var(--capsule-scale));
  display: flex;
  align-items: center;
  justify-content: center;
}

.capsule-container {
  --time-animation: 2s;
  position: relative;
  width: 100%;
  height: 100%;
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
</style>
