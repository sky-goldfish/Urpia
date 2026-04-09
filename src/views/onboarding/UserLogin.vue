<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const USER_INFO_KEY = 'urpia:user-info'

const nickname = ref('')
const phone = ref('')
const isLoading = ref(false)

// 验证手机号格式
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 验证昵称
const isValidNickname = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 20
}

const canSubmit = computed(() => {
  return isValidNickname(nickname.value) && isValidPhone(phone.value)
})

const handleSubmit = async () => {
  if (!canSubmit.value) return
  
  isLoading.value = true
  
  // 保存用户信息到 localStorage
  const userInfo = {
    nickname: nickname.value.trim(),
    phone: phone.value.trim(),
    timestamp: Date.now()
  }
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
  
  console.debug('[UserLogin] user info saved', userInfo)
  
  // 跳转到形象选择页面
  await router.push('/onboarding/camera')
}

// 检查是否已有用户信息
onMounted(() => {
  const savedUserInfo = localStorage.getItem(USER_INFO_KEY)
  if (savedUserInfo) {
    try {
      const userInfo = JSON.parse(savedUserInfo)
      nickname.value = userInfo.nickname || ''
      phone.value = userInfo.phone || ''
    } catch (e) {
      console.error('[UserLogin] failed to parse user info', e)
    }
  }
})
</script>

<template>
  <main class="device-shell">
    <div class="page-container">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <!-- 情绪药丸组件 - MoodPill -->
        <div class="capsule-container" style="--capsule-scale: 0.5;">
          <!-- 透明胶囊外壳 -->
          <div class="capsule-shell">
            <!-- 内部液体 -->
            <div class="capsule-loader">
              <div class="capsule-liquid-container">
                <div class="capsule-liquid-fill"></div>
                <div class="capsule-wave"></div>
              </div>
            </div>
          </div>
        </div>
        <h1 class="main-title">UrPia</h1>
        <p class="subtitle">Ur Utopia</p>
      </div>

      <!-- 表单区域 -->
      <div class="form-section">
        <div class="input-group">
          <label class="input-label">昵称</label>
          <input
            v-model="nickname"
            type="text"
            placeholder="请输入昵称（2-20个字符）"
            class="input-field"
            maxlength="20"
          />
        </div>

        <div class="input-group">
          <label class="input-label">手机号</label>
          <input
            v-model="phone"
            type="tel"
            placeholder="请输入11位手机号"
            class="input-field"
            maxlength="11"
          />
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="button-section">
        <button
          type="button"
          class="submit-button"
          :disabled="!canSubmit || isLoading"
          @click="handleSubmit"
        >
          <span v-if="isLoading">保存中...</span>
          <span v-else>开始探索</span>
        </button>
      </div>

      <!-- 提示文字 -->
      <p class="hint-text">
        信息仅保存在本地，用于提供更好的体验
      </p>
    </div>
  </main>
</template>

<style scoped>
.device-shell {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100vw;
  width: 100dvw;
  background: linear-gradient(180deg, #f8f8fc 0%, #f0f0f5 100%);
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  overflow-x: hidden;
}

.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  max-width: min(100%, 480px);
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + 60px) 32px calc(env(safe-area-inset-bottom) + 40px);
  box-sizing: border-box;
}

/* Logo 区域 */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60px;
}

/* ============================================
   情绪药丸 - MoodPill 流体气泡胶囊组件样式
   ============================================ */

/* 根变量定义 - 可在父元素中覆盖 */
.capsule-container {
  /* 颜色变量 - 暖橙色 */
  --capsule-color-one: #ff9f43;
  --capsule-color-two: #ee5a24;
  --capsule-color-three: #ff9f4380;
  --capsule-color-four: #ee5a2480;
  --capsule-color-five: #ff9f4340;

  /* 尺寸变量 - 默认大尺寸，可通过 --capsule-scale 缩放 */
  --capsule-scale: 1;
  --capsule-width: calc(15vmin * var(--capsule-scale));
  --capsule-height: calc(40vmin * var(--capsule-scale));
  --capsule-shell-width: calc(11vmin * var(--capsule-scale));
  --capsule-shell-height: calc(32vmin * var(--capsule-scale));
  --capsule-border-radius: calc(6vmin * var(--capsule-scale));
  --capsule-liquid-radius: 0 0 calc(5vmin * var(--capsule-scale)) calc(5vmin * var(--capsule-scale));

  /* 动画变量 */
  --capsule-time-animation: 2s;
  --capsule-shadow-color: rgba(255, 159, 67, 0.3);

  /* 布局 */
  margin-bottom: 16px;
  position: relative;
  width: var(--capsule-width);
  height: var(--capsule-height);
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 calc(10px * var(--capsule-scale)) calc(30px * var(--capsule-scale)) var(--capsule-shadow-color));
  transform-origin: bottom center;
  animation: capsule-sway 3s ease-in-out infinite;
}

/* 胶囊左右摇摆动画 - 顶部晃动15度，底部位置不变 */
@keyframes capsule-sway {
  0%, 100% {
    transform: rotate(5deg);
  }
  50% {
    transform: rotate(35deg);
  }
}

/* 透明胶囊外壳 */
.capsule-shell {
  width: var(--capsule-shell-width);
  height: var(--capsule-shell-height);
  position: relative;
  overflow: hidden;
  border-radius: var(--capsule-border-radius);
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(2px);
  box-shadow:
    inset 0 2px 15px rgba(255, 255, 255, 0.2),
    inset 0 -2px 15px rgba(255, 255, 255, 0.1),
    0 0 30px rgba(155, 142, 196, 0.2),
    0 0 60px rgba(155, 142, 196, 0.1);
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
.capsule-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: capsule-colorize calc(var(--capsule-time-animation) * 3) ease-in-out infinite;
}

.capsule-loader.animation-paused {
  animation-play-state: paused !important;
}

/* 液体容器 */
.capsule-liquid-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 80%;
  overflow: hidden;
  border-radius: var(--capsule-liquid-radius);
}

/* 液体填充 - 纯色填充到75%高度，带漏斗形旋转效果 */
.capsule-liquid-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 75%;
  background: linear-gradient(180deg,
    var(--capsule-color-one) 0%,
    var(--capsule-color-two) 100%);
  animation: capsule-funnel-rotate 8s linear infinite;
  transform-origin: center center;
}

/* 漏斗形旋转效果 - 液体内部形成缓慢旋转的漏斗形状 */
.capsule-liquid-fill::before {
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
  animation: capsule-funnel-swirl 6s ease-in-out infinite;
  border-radius: 50%;
}

/* 漏斗中心漩涡 */
.capsule-liquid-fill::after {
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
  animation: capsule-funnel-vortex 10s linear infinite;
  border-radius: 50%;
  filter: blur(2px);
}

/* 波浪效果 - 只在液体表面 */
.capsule-wave {
  width: 200%;
  height: 100%;
  background: linear-gradient(180deg,
    var(--capsule-color-one) 0%,
    var(--capsule-color-two) 100%);
  position: absolute;
  left: -50%;
  top: 5%;
  border-radius: 40%;
  animation: capsule-wave-surface 4s ease-in-out infinite;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.capsule-wave::before {
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

/* ============================================
   动画关键帧定义
   ============================================ */

@keyframes capsule-wave-surface {
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

@keyframes capsule-colorize {
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
@keyframes capsule-funnel-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 漏斗漩涡动画 - 形成漏斗形状的旋转效果 */
@keyframes capsule-funnel-swirl {
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
@keyframes capsule-funnel-vortex {
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

.main-title {
  font-size: 36px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.5px;
  margin: 0;
}

.subtitle {
  font-size: 15px;
  color: #8e8e93;
  margin-top: 8px;
  letter-spacing: 1px;
  font-weight: 500;
}

/* 表单区域 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 40px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-field {
  height: 52px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid #e5e5ea;
  background: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  color: #1d1d1f;
  outline: none;
  transition: all 0.2s ease;
}

.input-field::placeholder {
  color: #c7c7cc;
}

.input-field:focus {
  border-color: #9b8ec4;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 3px rgba(155, 142, 196, 0.1);
}

/* 按钮区域 */
.button-section {
  margin-top: auto;
  margin-bottom: 16px;
}

.submit-button {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%);
  color: white;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 提示文字 */
.hint-text {
  text-align: center;
  font-size: 12px;
  color: #8e8e93;
  margin: 0;
}
</style>
