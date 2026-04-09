import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { onboardingFollowUps } from './onboarding.config'

interface Message {
  id: number
  role: 'ai' | 'user'
  text: string
}

type InputMode = 'voice' | 'text'

const SILICONFLOW_API_KEY = import.meta.env.VITE_SILICONFLOW_API_KEY || ''
const SILICONFLOW_ASR_URL = 'https://api.siliconflow.cn/v1/audio/transcriptions'
const SILICONFLOW_TTS_URL = 'https://api.siliconflow.cn/v1/audio/speech'

export const useOnboardingChat = () => {
  const router = useRouter()
  const messages = ref<Message[]>([])
  const inputText = ref('')
  const inputMode = ref<InputMode>('voice')
  const isAiTyping = ref(false)
  const chatEndRef = ref<HTMLDivElement | null>(null)
  const isRecording = ref(false)
  const speechSupported = ref(false)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let msgId = 0
  let userReplyCount = 0
  let initialized = false
  let currentAudio: HTMLAudioElement | null = null

  const scrollToBottom = async () => {
    await nextTick()
    chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  }

  // 使用本地预设回复（替代LLM调用，速度更快）
  const sendMessageToLLM = async (userMessage?: string): Promise<string> => {
    // 根据对话轮数返回预设回复
    const index = Math.min(userReplyCount, onboardingFollowUps.length - 1)
    const reply = onboardingFollowUps[index] ?? onboardingFollowUps[onboardingFollowUps.length - 1] ?? '了解你了，我们继续。'

    // 模拟短暂延迟，让交互更自然
    return new Promise((resolve) => {
      setTimeout(() => resolve(reply), 300 + Math.random() * 400)
    })
  }

  // 调用 SiliconFlow TTS API 播放语音
  const playTextToSpeech = async (text: string) => {
    try {
      // 停止之前的音频
      if (currentAudio) {
        currentAudio.pause()
        currentAudio = null
      }

      const response = await fetch(SILICONFLOW_TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'fnlp/MOSS-TTSD-v0.5',
          input: text.replace(/\[DONE\]\s*/, ''),
          voice: 'fnlp/MOSS-TTSD-v0.5:anna',
          response_format: 'mp3',
          speed: 1.1,
        }),
      })

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      currentAudio = new Audio(audioUrl)
      await currentAudio.play()

      // 播放结束后清理
      currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
      }
    } catch (error) {
      console.error('语音播放失败:', error)
    }
  }

  const addAiMessage = (text: string) => {
    const isDone = text.startsWith('[DONE]')
    const cleanText = isDone ? text.replace(/^\[DONE\]\s*/, '') : text

    messages.value.push({ id: ++msgId, role: 'ai', text: cleanText })
    void scrollToBottom()

    // 播放 AI 回复的语音
    void playTextToSpeech(cleanText)

    if (isDone) {
      window.setTimeout(() => {
        void router.push('/map')
      }, 3000)
    }
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
      const reply = await sendMessageToLLM(text)
      isAiTyping.value = false
      addAiMessage(reply)
    } catch (error) {
      console.error('对话API调用失败:', error)
      isAiTyping.value = false
      addAiMessage('网络好像走神了，能再说一次吗？')
    }
  }

  const canSend = () => inputText.value.trim().length > 0 && !isAiTyping.value

  const switchToTextMode = () => {
    if (isRecording.value && mediaRecorder) {
      stopRecording()
    }

    inputMode.value = 'text'
  }

  const switchToVoiceMode = () => {
    if (!speechSupported.value) return
    inputMode.value = 'voice'
  }

  // 发送音频到 SiliconFlow ASR API
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.mp3')
    formData.append('model', 'TeleAI/TeleSpeechASR')

    const response = await fetch(SILICONFLOW_ASR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`ASR API error: ${response.status}`)
    }

    const data = await response.json() as { text: string }
    return data.text
  }

  const initSpeechRecognition = () => {
    // 检查浏览器是否支持 MediaRecorder
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      speechSupported.value = false
      inputMode.value = 'text'
      return
    }

    speechSupported.value = true
    inputMode.value = 'voice'
  }

  const startRecording = async () => {
    if (isAiTyping.value) return
    inputText.value = ''

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunks = []

      // 权限获取成功，确保是语音模式
      speechSupported.value = true

      // 尝试使用支持的 MIME 类型
      const mimeType = MediaRecorder.isTypeSupported('audio/mp3')
        ? 'audio/mp3'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg'

      mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType })
        audioChunks = []

        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop())

        try {
          const transcript = await transcribeAudio(audioBlob)
          inputText.value = transcript
          if (inputMode.value === 'voice' && transcript.trim()) {
            void handleSend()
          }
        } catch (error) {
          console.error('语音识别失败:', error)
          inputText.value = ''
        }
      }

      mediaRecorder.start()
      isRecording.value = true
    } catch (error) {
      console.error('无法开始录音:', error)
      // 权限被拒绝，自动切换到文字输入模式
      speechSupported.value = false
      inputMode.value = 'text'

      // 提示用户
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        alert('请允许麦克风权限以使用语音输入，或切换到键盘输入模式')
      }
    }
  }

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording.value) return
    mediaRecorder.stop()
    isRecording.value = false
  }

  onBeforeUnmount(() => {
    if (mediaRecorder && isRecording.value) {
      try {
        mediaRecorder.stop()
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
      // 首次调用，不传用户消息，让 AI 主动打招呼
      const reply = await sendMessageToLLM()
      isAiTyping.value = false
      addAiMessage(reply)
    } catch (error) {
      console.error('初始化对话失败:', error)
      isAiTyping.value = false
      // 使用默认欢迎语
      addAiMessage(onboardingFollowUps[0] || '嗨，想先聊聊你平时的社交习惯吗？')
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
