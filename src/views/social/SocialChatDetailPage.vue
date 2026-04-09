<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSocialInboxStore } from './socialInboxStore'

const route = useRoute()
const router = useRouter()
const { getSessionById, markSessionRead, sendMessage } = useSocialInboxStore()

const inputText = ref('')
const chatEndRef = ref<HTMLDivElement | null>(null)

const session = computed(() => getSessionById(String(route.params.id ?? '')))

const scrollToBottom = async () => {
  await nextTick()
  chatEndRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

const canSend = computed(() => inputText.value.trim().length > 0)

const handleBack = () => {
  void router.push('/match')
}

const handleSend = async () => {
  if (!session.value || !canSend.value) return

  sendMessage(session.value.id, inputText.value)
  inputText.value = ''
  await scrollToBottom()
}

watch(
  session,
  async (currentSession) => {
    if (!currentSession) {
      void router.replace('/match')
      return
    }

    markSessionRead(currentSession.id)
    await scrollToBottom()
  },
  { immediate: true },
)

onMounted(async () => {
  await scrollToBottom()
})
</script>

<template>
  <main v-if="session" class="chat-stage">
    <div class="iphone-shell">
      <div class="iphone-screen">
        <header class="wechat-header">
          <div class="nav-bar">
            <button type="button" class="nav-back" aria-label="返回消息列表" @click="handleBack">
              <span class="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div class="nav-title">
              <p class="nav-name">{{ session.name }}</p>
              <p class="nav-subtitle">{{ session.subtitle }}</p>
            </div>
            <div class="nav-spacer" />
          </div>
        </header>

        <section class="wechat-chat">
          <article
            v-for="msg in session.messages"
            :key="msg.id"
            class="message-row"
            :class="msg.role === 'self' ? 'message-row-user' : 'message-row-ai'"
          >
            <div
              v-if="msg.role === 'other'"
              class="message-avatar message-avatar-text"
              :style="{ background: session.avatarColor }"
            >
              {{ session.avatarText }}
            </div>

            <div class="message-bubble" :class="msg.role === 'self' ? 'message-bubble-user' : 'message-bubble-ai'">
              {{ msg.text }}
            </div>
          </article>

          <div ref="chatEndRef" />
        </section>

        <footer class="wechat-input">
          <div class="input-bar">
            <button type="button" class="mode-toggle" aria-label="表情">
              <span class="material-symbols-outlined text-[18px]">mood</span>
            </button>

            <input
              v-model="inputText"
              type="text"
              class="wechat-text-input"
              placeholder="发送消息"
              @keyup.enter="handleSend"
            />
            <button
              type="button"
              class="wechat-send"
              :class="{ 'is-active': canSend }"
              :disabled="!canSend"
              @click="handleSend"
            >
              发送
            </button>
          </div>
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

.wechat-header {
  position: relative;
  z-index: 10;
  background: rgba(247, 247, 247, 0.94);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 10px;
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
  margin: 0;
  color: #111111;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.nav-subtitle {
  margin: 2px 0 0;
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
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.message-avatar-text {
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 700;
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
