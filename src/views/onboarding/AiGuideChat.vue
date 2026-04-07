<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface Message {
  id: number
  role: 'ai' | 'user'
  text: string
}

const messages = ref<Message[]>([])
const inputText = ref('')
const isAiTyping = ref(false)
const chatEndRef = ref<HTMLDivElement | null>(null)

// 语音输入
const isRecording = ref(false)
const speechSupported = ref(false)
let recognition: SpeechRecognition | null = null

let msgId = 0
let userReplyCount = 0
let initialized = false

// ---- LLM 对话 ----
const SYSTEM_PROMPT = `你是 Zoopia 的 AI 向导，正在通过自然对话了解用户的社交偏好，以便为ta生成一个情绪分身。
规则：
- 每次只问一个问题，语气轻松自然，像朋友聊天
- 问题围绕社交场景偏好、陌生人接触方式、情绪表达习惯、对分身的期望
- 根据用户的回答灵活追问，大约 3-5 轮后收尾
- 当你觉得已经足够了解用户时，回复以 [DONE] 开头，后面跟一句简短的总结（如"[DONE] 了解你了！正在为你生成专属分身..."）
- 不要使用列表或编号，口语化回答`

const mockFollowUps = [
  '你平时更喜欢怎样的社交场景呀？',
  '嗯嗯，那遇到陌生人的时候，你通常会怎么做呢？',
  '说得对。你觉得「舒服的社交」最重要的是什么？',
  '最后一个问题啦——你希望你的分身比你更外放，还是更像你本人？',
  '[DONE] 了解你了！正在为你生成专属分身...',
]

/**
 * 调用 LLM 获取回复。
 * TODO: 替换为真实后端 API，如 POST /api/onboarding/chat
 */
const sendMessageToLLM = async (_userText: string): Promise<string> => {
  // ---- mock 模式（后端 API 就绪后替换此处） ----
  const index = Math.min(userReplyCount, mockFollowUps.length - 1)
  const reply = mockFollowUps[index]

  return new Promise((resolve) => {
    setTimeout(() => resolve(reply), 600 + Math.random() * 800)
  })

  // ---- 真实 API 调用（取消上方 mock，启用下方代码） ----
  // const res = await fetch('/api/onboarding/chat', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     messages: [
  //       { role: 'system', content: SYSTEM_PROMPT },
  //       ...messages.value.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
  //       { role: 'user', content: _userText },
  //     ],
  //   }),
  // })
  // const data = await res.json()
  // return data.reply
}

// ---- 对话流程 ----
const scrollToBottom = async () => {
  await nextTick()
  chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
}

const addAiMessage = (text: string): boolean => {
  // 检测 [DONE] 指令
  if (text.startsWith('[DONE]')) {
    const cleanText = text.replace(/^\[DONE\]\s*/, '')
    messages.value.push({ id: ++msgId, role: 'ai', text: cleanText })
    scrollToBottom()
    setTimeout(() => {
      void router.push('/onboarding/generating')
    }, 1200)
    return true // 对话结束
  }

  messages.value.push({ id: ++msgId, role: 'ai', text })
  scrollToBottom()
  return false
}

const addUserMessage = (text: string) => {
  messages.value.push({ id: ++msgId, role: 'user', text })
  scrollToBottom()
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || isAiTyping.value) return

  addUserMessage(text)
  inputText.value = ''
  userReplyCount++
  isAiTyping.value = true
  scrollToBottom()

  try {
    const reply = await sendMessageToLLM(text)
    isAiTyping.value = false
    addAiMessage(reply)
  } catch {
    isAiTyping.value = false
    addAiMessage('网络好像走神了，能再说一次吗？')
  }
}

const canSend = () => {
  return inputText.value.trim().length > 0 && !isAiTyping.value
}

// ---- 语音输入 ----
const initSpeechRecognition = () => {
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognitionAPI) {
    speechSupported.value = false
    return
  }

  speechSupported.value = true
  recognition = new SpeechRecognitionAPI()
  recognition.lang = 'zh-CN'
  recognition.interimResults = true
  recognition.continuous = false

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let transcript = ''
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    inputText.value = transcript
  }

  recognition.onend = () => {
    isRecording.value = false
    if (inputText.value.trim()) {
      handleSend()
    }
  }

  recognition.onerror = () => {
    isRecording.value = false
  }
}

const toggleRecording = () => {
  if (!recognition || isAiTyping.value) return

  if (isRecording.value) {
    recognition.stop()
    isRecording.value = false
  } else {
    inputText.value = ''
    try {
      recognition.start()
      isRecording.value = true
    } catch {
      // 忽略重复启动错误
    }
  }
}

onBeforeUnmount(() => {
  if (recognition) {
    recognition.onend = null
    recognition.onerror = null
    try { recognition.stop() } catch { /* noop */ }
  }
})

onMounted(async () => {
  if (initialized) return
  initialized = true

  initSpeechRecognition()
  isAiTyping.value = true
  scrollToBottom()
  try {
    const reply = await sendMessageToLLM('')
    isAiTyping.value = false
    addAiMessage(reply)
  } catch {
    isAiTyping.value = false
    addAiMessage('嗨，想先聊聊你平时的社交习惯吗？')
  }
})
</script>

<template>
  <main class="device-shell">
    <div class="flex h-[100dvh] flex-col">
      <!-- 顶栏 -->
      <header class="flex items-center gap-3 px-5 py-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#0071e3]/10">
          <span class="material-symbols-outlined text-[18px] text-[#0071e3]">auto_awesome</span>
        </div>
        <div class="flex-1">
          <p class="text-[15px] font-medium text-[#1d1d1f]" style="letter-spacing: -0.224px">Zoopia Guide</p>
          <p class="text-[11px] text-[#86868b]" style="letter-spacing: -0.08px">正在了解你的社交偏好</p>
        </div>
        <div class="flex items-center gap-1.5 rounded-full bg-[#30d158]/10 px-2.5 py-1">
          <div class="h-1.5 w-1.5 rounded-full bg-[#30d158]" />
          <span class="text-[11px] text-[#30d158]" style="letter-spacing: -0.08px">在线</span>
        </div>
      </header>

      <!-- 对话区域 -->
      <section class="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4">
        <article
          v-for="msg in messages"
          :key="msg.id"
          class="flex"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <!-- AI 头像 -->
          <div v-if="msg.role === 'ai'" class="mr-2 flex-shrink-0 mt-5">
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6]">
              <span class="material-symbols-outlined text-white text-[14px]" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 14">auto_awesome</span>
            </div>
          </div>

          <div class="max-w-[78%]">
            <div
              class="rounded-2xl px-4 py-3 text-[15px] leading-relaxed"
              :class="
                msg.role === 'user'
                  ? 'bg-[#0071e3] text-white rounded-br-md'
                  : 'bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-md'
              "
              style="letter-spacing: -0.224px"
            >
              {{ msg.text }}
            </div>
          </div>
        </article>

        <!-- AI 正在输入 -->
        <div v-if="isAiTyping" class="flex items-start gap-2">
          <div class="flex-shrink-0 mt-0.5">
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6]">
              <span class="material-symbols-outlined text-white text-[14px]" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 14">auto_awesome</span>
            </div>
          </div>
          <div class="rounded-2xl rounded-bl-md bg-[#f5f5f7] px-4 py-3">
            <div class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-full bg-[#86868b]/40 animate-[bounce_1.4s_ease-in-out_infinite]" />
              <div class="h-2 w-2 rounded-full bg-[#86868b]/40 animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
              <div class="h-2 w-2 rounded-full bg-[#86868b]/40 animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
            </div>
          </div>
        </div>

        <div ref="chatEndRef" />
      </section>

      <!-- 底部输入区 -->
      <section class="border-t border-[#e8e8ed]/60 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <div class="flex items-center gap-2.5">
          <!-- 语音输入 -->
          <button
            v-if="speechSupported"
            type="button"
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all"
            :class="isRecording
              ? 'bg-[#ff3b30] text-white animate-[voice-pulse_1.2s_ease-in-out_infinite]'
              : 'bg-[#f5f5f7] text-[#86868b] active:bg-[#e8e8ed]'"
            :disabled="isAiTyping"
            @click="toggleRecording"
          >
            <span class="material-symbols-outlined text-[20px]">
              {{ isRecording ? 'stop' : 'mic' }}
            </span>
          </button>

          <!-- 输入框 -->
          <input
            v-model="inputText"
            type="text"
            class="flex-1 rounded-full bg-[#f5f5f7] px-4 py-2.5 text-[15px] text-[#1d1d1f] outline-none placeholder:text-[#86868b]/60 transition-shadow focus:shadow-[0_0_0_2px_rgba(0,113,227,0.3)]"
            style="letter-spacing: -0.224px"
            :placeholder="isRecording ? '正在聆听...' : '说说你的想法...'"
            :disabled="isAiTyping"
            @keyup.enter="handleSend"
          />

          <!-- 发送 -->
          <button
            type="button"
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all"
            :class="canSend() ? 'bg-[#0071e3] text-white active:scale-90' : 'bg-[#e8e8ed] text-[#86868b]/40'"
            :disabled="!canSend()"
            @click="handleSend"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}

@keyframes voice-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 59, 48, 0); }
}
</style>
