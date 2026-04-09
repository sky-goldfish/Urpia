import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { onboardingFollowUps } from './onboarding.config'

interface Message {
  id: number
  role: 'ai' | 'user'
  text: string
}

type InputMode = 'voice' | 'text'

interface BrowserSpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface BrowserSpeechRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

export const useOnboardingChat = () => {
  const router = useRouter()
  const messages = ref<Message[]>([])
  const inputText = ref('')
  const inputMode = ref<InputMode>('voice')
  const isAiTyping = ref(false)
  const chatEndRef = ref<HTMLDivElement | null>(null)
  const isRecording = ref(false)
  const speechSupported = ref(false)

  let recognition: BrowserSpeechRecognition | null = null
  let msgId = 0
  let userReplyCount = 0
  let initialized = false

  const scrollToBottom = async () => {
    await nextTick()
    chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessageToLLM = async (): Promise<string> => {
    const index = Math.min(userReplyCount, onboardingFollowUps.length - 1)
    const reply =
      onboardingFollowUps[index] ??
      onboardingFollowUps[onboardingFollowUps.length - 1] ??
      '了解你了，我们继续。'

    return new Promise((resolve) => {
      setTimeout(() => resolve(reply), 600 + Math.random() * 800)
    })
  }

  const addAiMessage = (text: string) => {
    if (text.startsWith('[DONE]')) {
      const cleanText = text.replace(/^\[DONE\]\s*/, '')
      messages.value.push({ id: ++msgId, role: 'ai', text: cleanText })
      void scrollToBottom()
      window.setTimeout(() => {
        void router.push('/map')
      }, 1200)
      return
    }

    messages.value.push({ id: ++msgId, role: 'ai', text })
    void scrollToBottom()
  }

  const addUserMessage = (text: string) => {
    messages.value.push({ id: ++msgId, role: 'user', text })
    void scrollToBottom()
  }

  const handleSend = async () => {
    const text = inputText.value.trim()
    if (!text || isAiTyping.value) return

    addUserMessage(text)
    inputText.value = ''
    userReplyCount++
    isAiTyping.value = true

    try {
      const reply = await sendMessageToLLM()
      isAiTyping.value = false
      addAiMessage(reply)
    } catch {
      isAiTyping.value = false
      addAiMessage('网络好像走神了，能再说一次吗？')
    }
  }

  const canSend = () => inputText.value.trim().length > 0 && !isAiTyping.value

  const switchToTextMode = () => {
    if (isRecording.value && recognition) {
      recognition.stop()
      isRecording.value = false
    }

    inputMode.value = 'text'
  }

  const switchToVoiceMode = () => {
    if (!speechSupported.value) return
    inputMode.value = 'voice'
  }

  const initSpeechRecognition = () => {
    const SpeechRecognitionAPI = ((window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition)

    if (!SpeechRecognitionAPI) {
      speechSupported.value = false
      inputMode.value = 'text'
      return
    }

    speechSupported.value = true
    inputMode.value = 'voice'
    recognition = new SpeechRecognitionAPI()
    recognition.lang = 'zh-CN'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const alternative = result?.[0]
        if (alternative) {
          transcript += alternative.transcript
        }
      }
      inputText.value = transcript
    }

    recognition.onend = () => {
      isRecording.value = false
      if (inputMode.value === 'voice' && inputText.value.trim()) {
        void handleSend()
      }
    }

    recognition.onerror = () => {
      isRecording.value = false
    }
  }

  const startRecording = () => {
    if (!recognition || isAiTyping.value) return
    inputText.value = ''

    try {
      recognition.start()
      isRecording.value = true
    } catch {
      // Ignore duplicate start errors from rapid interaction.
    }
  }

  const stopRecording = () => {
    if (!recognition || !isRecording.value) return
    recognition.stop()
    isRecording.value = false
  }

  onBeforeUnmount(() => {
    if (recognition) {
      recognition.onend = null
      recognition.onerror = null
      try {
        recognition.stop()
      } catch {
        // noop
      }
    }
  })

  onMounted(async () => {
    if (initialized) return
    initialized = true

    initSpeechRecognition()
    isAiTyping.value = true
    void scrollToBottom()

    try {
      const reply = await sendMessageToLLM()
      isAiTyping.value = false
      addAiMessage(reply)
    } catch {
      isAiTyping.value = false
      addAiMessage('嗨，想先聊聊你平时的社交习惯吗？')
    }
  })

  return {
    messages,
    inputText,
    inputMode,
    isAiTyping,
    chatEndRef,
    isRecording,
    speechSupported,
    canSend,
    handleSend,
    switchToTextMode,
    switchToVoiceMode,
    startRecording,
    stopRecording,
  }
}
