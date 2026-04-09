<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMoodStore, moodColors } from '../../stores/moodStore'

const moodStore = useMoodStore()
const selectorRef = ref<HTMLDivElement | null>(null)

// 选择情绪
const selectMood = (index: number) => {
  const mood = moodColors[index]
  if (!mood) return
  moodStore.setMood(mood)
  moodStore.closeSelector()
}

// 点击外部关闭选择器
const handleClickOutside = (event: MouseEvent) => {
  if (selectorRef.value && !selectorRef.value.contains(event.target as Node)) {
    moodStore.closeSelector()
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="selectorRef" class="mood-selector">
    <!-- 触发按钮 -->
    <button
      class="mood-trigger"
      :style="{ backgroundColor: moodStore.currentMood.hex }"
      @click.stop="moodStore.toggleSelector()"
    >
      <span class="mood-emoji">{{ moodStore.currentMood.emoji }}</span>
    </button>

    <!-- 情绪颜色选择面板 -->
    <Transition name="mood-panel">
      <div v-show="moodStore.isSelectorOpen" class="mood-panel">
        <div class="mood-grid">
          <button
            v-for="(mood, index) in moodStore.allMoods"
            :key="mood.id"
            class="mood-item"
            :class="{ active: moodStore.currentMood.id === mood.id }"
            :style="{ backgroundColor: mood.hex }"
            @click.stop="selectMood(index)"
          >
            <span class="mood-item-emoji">{{ mood.emoji }}</span>
            <span class="mood-item-name">{{ mood.name }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mood-selector {
  position: relative;
  z-index: 100;
}

/* 触发按钮 - 缩小尺寸 */
.mood-trigger {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 3px rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mood-trigger:hover {
  transform: scale(1.15);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 0 4px rgba(255, 255, 255, 0.15);
}

.mood-trigger:active {
  transform: scale(0.95);
}

.mood-emoji {
  font-size: 1.1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

/* 情绪选择面板 - 水平排列 */
.mood-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 10px 12px;
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5);
}

.mood-grid {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.mood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 48px;
}

.mood-item:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.mood-item.active {
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 0 0 2px rgba(255, 255, 255, 0.4);
}

.mood-item-emoji {
  font-size: 1.1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.mood-item-name {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

/* 面板动画 */
.mood-panel-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mood-panel-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mood-panel-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.mood-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* 响应式适配 */
@media (max-width: 480px) {
  .mood-panel {
    right: -5px;
    padding: 8px 10px;
  }

  .mood-grid {
    gap: 6px;
  }

  .mood-item {
    padding: 6px 8px;
    min-width: 42px;
  }

  .mood-item-emoji {
    font-size: 1rem;
  }

  .mood-item-name {
    font-size: 0.6rem;
  }
}
</style>
