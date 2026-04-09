<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ActivityDots from '../../components/ui/ActivityDots.vue'
import { useOnboardingChat } from './useOnboardingChat'
import { onboardingChatContent } from './onboarding.config'

const router = useRouter()
const guideAvatarUrl = '/guide/urpia-guide-avatar.png'

const handleBack = () => {
  void router.back()
}

const {
  messages,
  currentQuestion,
  inputText,
  inputMode,
  isAiTyping,
  isStreamingQuestion,
  chatEndRef,
  isRecording,
  speechSupported,
  canSend,
  handleSend,
  startSession,
  switchToTextMode,
  switchToVoiceMode,
  startRecording,
  stopRecording,
} = useOnboardingChat()

onMounted(async () => {
  await startSession()
})
</script>

<template>
  <main class="chat-stage">
    <div class="iphone-shell">
      <div class="iphone-screen">
        <!-- iPhone 刘海屏 - 已注释掉
        <div class="iphone-notch" aria-hidden="true">
          <div class="iphone-speaker" />
        </div>
        -->

        <header class="wechat-header">
         <!-- <div class="status-bar">
            <span class="status-time">9:41</span>
            <div class="status-icons" aria-hidden="true">
              <span class="signal-bars">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span class="wifi-icon"><span /></span>
              <span class="battery-icon">
                <span class="battery-level" />
              </span>
            </div>
          </div>-->

          <div class="nav-bar">
            <button type="button" class="nav-back" aria-label="返回" @click="handleBack">
              <span class="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div class="nav-title">
              <p class="nav-name">{{ onboardingChatContent.title }}</p>
              <p class="nav-subtitle">{{ onboardingChatContent.subtitle }}</p>
            </div>
            <div class="nav-spacer" />
          </div>
        </header>

        <section class="wechat-chat">
          <article
            v-for="msg in messages"
            :key="msg.id"
            class="message-row"
            :class="msg.role === 'user' ? 'message-row-user' : 'message-row-ai'"
          >
            <img
              v-if="msg.role === 'ai'"
              :src="guideAvatarUrl"
              :alt="onboardingChatContent.title"
              class="message-avatar"
            />

            <div class="message-bubble" :class="msg.role === 'user' ? 'message-bubble-user' : 'message-bubble-ai'">
              {{ msg.text }}
            </div>
          </article>

          <div v-if="isStreamingQuestion" class="message-row message-row-ai">
            <img
              :src="guideAvatarUrl"
              :alt="onboardingChatContent.title"
              class="message-avatar"
            />
            <div class="message-bubble message-bubble-ai">
              {{ currentQuestion || '...' }}
            </div>
          </div>

          <div v-else-if="isAiTyping" class="message-row message-row-ai">
            <img
              :src="guideAvatarUrl"
              :alt="onboardingChatContent.title"
              class="message-avatar"
            />
            <div class="message-bubble message-bubble-ai">
              <ActivityDots dot-class="h-2 w-2 rounded-full bg-[#a9adb7]" />
            </div>
          </div>

          <div ref="chatEndRef" />
        </section>

        <footer class="wechat-input">
          <div class="input-bar">
            <button
              v-if="inputMode === 'voice'"
              type="button"
              class="mode-toggle"
              :disabled="isAiTyping"
              aria-label="切换到文字输入"
              @click="switchToTextMode"
            >
              <span class="material-symbols-outlined text-[18px]">keyboard</span>
            </button>

            <button
              v-else
              type="button"
              class="mode-toggle"
              :disabled="isAiTyping || !speechSupported"
              aria-label="切换到语音输入"
              @click="switchToVoiceMode"
            >
              <span class="material-symbols-outlined text-[18px]">mic</span>
            </button>

            <button
              v-if="inputMode === 'voice'"
              type="button"
              class="voice-box"
              :class="{ 'is-recording': isRecording }"
              :disabled="isAiTyping || !speechSupported"
              @mousedown="startRecording"
              @mouseup="stopRecording"
              @mouseleave="stopRecording"
              @touchstart.prevent="startRecording"
              @touchend.prevent="stopRecording"
            >
              <span v-if="isRecording" class="recording-bars" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>{{ isRecording ? onboardingChatContent.releaseToSendLabel : onboardingChatContent.pressToTalkLabel }}</span>
            </button>

            <template v-else>
              <input
                v-model="inputText"
                type="text"
                class="wechat-text-input"
                :placeholder="onboardingChatContent.textPlaceholder"
                :disabled="isAiTyping"
                @keyup.enter="handleSend"
              />
              <button
                type="button"
                class="wechat-send"
                :class="{ 'is-active': canSend() }"
                :disabled="!canSend()"
                @click="handleSend"
              >
                发送
              </button>
            </template>
          </div>
          <!-- Home 指示条 - 已注释掉
          <div class="home-indicator" aria-hidden="true" />
          -->
        </footer>
      </div>
    </div>
  </main>
</template>

<style scoped>
.chat-stage {
  position: fixed;
  inset: 0;
  width: 100vw;
  width: 100dvw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top, rgba(244, 244, 246, 0.75), rgba(228, 230, 235, 0.95)),
    linear-gradient(180deg, #d9dbe0, #cfd2d8);
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  padding: 24px 16px;
  box-sizing: border-box;
  overflow: hidden;
}

/* iPhone 外壳样式 - 已注释掉
.iphone-shell {
  width: 100%;
  max-width: min(100%, 480px);
  border-radius: 42px;
  padding: 10px;
  background: linear-gradient(180deg, #1a1a1d, #060607);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
*/

/* 简化的屏幕容器 */
.iphone-shell {
  width: 100%;
  max-width: min(100%, 480px);
  background: transparent;
}

.iphone-screen {
  position: relative;
  height: calc(100vh - 48px);
  height: calc(100dvh - 48px);
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  overflow: hidden;
  border-radius: 0;
  background: #ededed;
  display: flex;
  flex-direction: column;
}

.iphone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 210px;
  height: 31px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  background: #090909;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.iphone-speaker {
  width: 72px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
}

.wechat-header {
  position: relative;
  z-index: 10;
  background: rgba(247, 247, 247, 0.94);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 10px;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 18px 6px;
  margin-top: 22px;
  color: #111111;
  font-size: 13px;
  font-weight: 600;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.signal-bars {
  display: flex;
  align-items: end;
  gap: 2px;
}

.signal-bars i {
  display: block;
  width: 3px;
  background: #111111;
  border-radius: 999px;
}

.signal-bars i:nth-child(1) { height: 5px; opacity: 0.55; }
.signal-bars i:nth-child(2) { height: 7px; opacity: 0.7; }
.signal-bars i:nth-child(3) { height: 9px; opacity: 0.82; }
.signal-bars i:nth-child(4) { height: 11px; }

.wifi-icon {
  position: relative;
  width: 15px;
  height: 11px;
}

.wifi-icon::before,
.wifi-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border: 1.8px solid transparent;
  border-top-color: #111111;
  border-radius: 50%;
}

.wifi-icon::before {
  top: 0;
  width: 14px;
  height: 14px;
}

.wifi-icon::after {
  top: 3px;
  width: 8px;
  height: 8px;
}

.wifi-icon span {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: #111111;
}

.battery-icon {
  width: 22px;
  height: 11px;
  border: 1.8px solid #111111;
  border-radius: 3px;
  padding: 1px;
  position: relative;
}

.battery-icon::after {
  content: '';
  position: absolute;
  right: -3.5px;
  top: 2.4px;
  width: 2px;
  height: 5px;
  border-radius: 0 2px 2px 0;
  background: #111111;
}

.battery-level {
  display: block;
  width: 72%;
  height: 100%;
  border-radius: 2px;
  background: #111111;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 6px 14px 12px;
}

.nav-back {
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  color: #1b1b1d;
  display: grid;
  place-items: center;
}

.nav-title {
  flex: 1;
  text-align: center;
}

.nav-name {
  color: #111111;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.nav-subtitle {
  margin-top: 2px;
  color: #8b8d94;
  font-size: 11px;
  letter-spacing: -0.08px;
}

.nav-spacer {
  min-width: 36px;
}

.wechat-chat {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0)),
    #ededed;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-row-ai {
  justify-content: flex-start;
}

.message-row-user {
  justify-content: flex-end;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  background: #fff;
}

.message-bubble {
  max-width: 76%;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.58;
  letter-spacing: -0.18px;
  position: relative;
  word-break: break-word;
}

.message-bubble-ai {
  background: #ffffff;
  color: #111111;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.message-bubble-ai::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 12px;
  border-width: 7px 7px 7px 0;
  border-style: solid;
  border-color: transparent #ffffff transparent transparent;
}

.message-bubble-user {
  background: #95ec69;
  color: #111111;
}

.message-bubble-user::after {
  content: '';
  position: absolute;
  right: -7px;
  top: 12px;
  border-width: 7px 0 7px 7px;
  border-style: solid;
  border-color: transparent transparent transparent #95ec69;
}

.wechat-input {
  background: #f7f7f7;
  border-top: 1px solid rgba(60, 60, 67, 0.12);
  padding: 10px 12px 8px;
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-toggle {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(60, 60, 67, 0.14);
  border-radius: 999px;
  background: #ffffff;
  color: #7a7d85;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.voice-box {
  flex: 1;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: #ffffff;
  color: #4a4d55;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: inset 0 0 0 1px rgba(60, 60, 67, 0.08);
  font-size: 15px;
}

.voice-box.is-recording {
  background: #f2f3f6;
}

.recording-bars {
  display: inline-flex;
  align-items: end;
  gap: 3px;
}

.recording-bars i {
  width: 3px;
  border-radius: 999px;
  background: #07c160;
  animation: voice-bar 0.85s ease-in-out infinite;
}

.recording-bars i:nth-child(1) { height: 10px; animation-delay: 0s; }
.recording-bars i:nth-child(2) { height: 16px; animation-delay: 0.1s; }
.recording-bars i:nth-child(3) { height: 12px; animation-delay: 0.2s; }
.recording-bars i:nth-child(4) { height: 18px; animation-delay: 0.3s; }

.wechat-text-input {
  flex: 1;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: #ffffff;
  padding: 0 14px;
  color: #111111;
  font-size: 16px;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(60, 60, 67, 0.08);
}

.wechat-text-input::placeholder {
  color: #b1b4bc;
}

.wechat-send {
  min-width: 56px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: #d7d9de;
  color: rgba(17, 17, 17, 0.48);
  font-size: 15px;
  font-weight: 600;
  transition: transform 120ms ease, background 120ms ease, color 120ms ease;
}

.wechat-send.is-active {
  background: #ffffff;
  color: #111111;
  box-shadow: inset 0 0 0 1px rgba(60, 60, 67, 0.1);
}

.wechat-send:not(:disabled):active {
  transform: scale(0.96);
}

.home-indicator {
  width: 134px;
  height: 5px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.88);
  margin: 10px auto 0;
}

@keyframes voice-bar {
  0%, 100% { transform: scaleY(0.45); opacity: 0.58; }
  50% { transform: scaleY(1); opacity: 1; }
}

@media (max-width: 430px) {
  .chat-stage {
    padding: 0;
    background: #2e3138;
  }

  .iphone-shell {
    width: 100%;
    border-radius: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
  }

  .iphone-screen {
    min-height: 100dvh;
    max-height: none;
    border-radius: 0;
  }
}
</style>
