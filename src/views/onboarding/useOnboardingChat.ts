import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '../../lib/api'
import { useOnboardingChatStore } from '../../stores/onboardingChat'
import type {
  OnboardingMessage,
  PersonaConfirmResponse,
  OnboardingSessionStartResponse,
  OnboardingTurnResponse
} from '../../types/onboardingChat'
import {
  readStoredProfileAvatarUrl,
  readStoredProfileNickname,
  writeStoredProfileUserId
} from '../profile/profileModel.config'

const STREAM_CHUNK_MS = Number(import.meta.env.VITE_ONBOARDING_STREAM_CHUNK_MS ?? 28)

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const useOnboardingChat = () => {
  const router = useRouter()
  const store = useOnboardingChatStore()
  const inputText = ref('')
  const chatEndRef = ref<HTMLDivElement | null>(null)
  const isRecording = ref(false)
  const speechSupported = ref(
    typeof window !== 'undefined' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia
  )

  let msgId = store.messages.length
  let recorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let recordedChunks: BlobPart[] = []

  const scrollToBottom = async () => {
    await nextTick()
    chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  }

  const pushMessage = (role: OnboardingMessage['role'], text: string) => {
    store.messages.push({ id: ++msgId, role, text })
    void scrollToBottom()
  }

  const streamQuestion = async (text: string) => {
    store.isStreamingQuestion = true
    store.currentQuestion = ''

    for (const char of text) {
      store.currentQuestion += char
      await sleep(STREAM_CHUNK_MS)
    }

    pushMessage('ai', text)
    store.isStreamingQuestion = false
  }

  const finishIfDone = async (done: boolean) => {
    if (!done) {
      return
    }

    const confirmed = await apiClient.postJson<PersonaConfirmResponse>('/api/personas/confirm', {
      sessionId: store.sessionId,
      nickname: readStoredProfileNickname(),
      avatarUrl: readStoredProfileAvatarUrl()
    })

    writeStoredProfileUserId(confirmed.user.id)
    window.setTimeout(() => {
      void router.push('/map')
    }, 1200)
  }

  const startSession = async () => {
    const data = await apiClient.postJson<OnboardingSessionStartResponse>('/api/onboarding/session', {})
    store.sessionId = data.sessionId
    store.questionIndex = data.questionIndex
    store.totalQuestions = data.totalQuestions
    await streamQuestion(data.questionText)
  }

  const submitText = async (text: string) => {
    const normalized = text.trim()
    if (!normalized || store.isSubmitting || store.isStreamingQuestion) {
      return null
    }

    store.isSubmitting = true
    pushMessage('user', normalized)
    inputText.value = ''

    try {
      const data = await apiClient.postJson<OnboardingTurnResponse>('/api/onboarding/turns/text', {
        sessionId: store.sessionId,
        text: normalized
      })

      await streamQuestion(data.reply)
      await finishIfDone(data.done)
      return data
    } finally {
      store.isSubmitting = false
    }
  }

  const submitVoice = async (audioBlob: Blob) => {
    if (store.isSubmitting || store.isStreamingQuestion) {
      return null
    }

    store.isSubmitting = true

    try {
      const form = new FormData()
      form.append('sessionId', store.sessionId)
      form.append('audio', audioBlob, 'onboarding.webm')

      const data = await apiClient.postForm<OnboardingTurnResponse>('/api/onboarding/turns/voice', form)
      if (data.transcript) {
        pushMessage('user', data.transcript)
      }

      await streamQuestion(data.reply)
      await finishIfDone(data.done)
      return data
    } finally {
      store.isSubmitting = false
    }
  }

  const handleSend = async () => submitText(inputText.value)

  const canSend = () => inputText.value.trim().length > 0 && !store.isSubmitting && !store.isStreamingQuestion

  const switchToTextMode = () => {
    if (isRecording.value) {
      void stopRecording()
    }

    store.inputMode = 'text'
  }

  const switchToVoiceMode = () => {
    if (!speechSupported.value) {
      return
    }

    store.inputMode = 'voice'
  }

  const startRecording = async () => {
    if (!speechSupported.value || store.isSubmitting || store.isStreamingQuestion || isRecording.value) {
      return
    }

    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordedChunks = []
    recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    recorder.start()
    isRecording.value = true
  }

  const stopRecording = async () => {
    if (!recorder || !isRecording.value) {
      return
    }

    const activeRecorder = recorder
    const activeStream = stream

    isRecording.value = false

    const audioBlob = await new Promise<Blob>((resolve) => {
      activeRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: activeRecorder.mimeType || 'audio/webm' })
        recordedChunks = []
        resolve(blob)
      }

      activeRecorder.stop()
      activeStream?.getTracks().forEach((track) => track.stop())
    })

    recorder = null
    stream = null

    if (audioBlob.size > 0) {
      await submitVoice(audioBlob)
    }
  }

  return {
    sessionId: computed(() => store.sessionId),
    currentQuestion: computed(() => store.currentQuestion),
    messages: computed(() => store.messages),
    inputText,
    inputMode: computed(() => store.inputMode),
    isAiTyping: computed(() => store.isStreamingQuestion || store.isSubmitting),
    isStreamingQuestion: computed(() => store.isStreamingQuestion),
    chatEndRef,
    isRecording,
    speechSupported,
    canSend,
    handleSend,
    submitText,
    submitVoice,
    startSession,
    switchToTextMode,
    switchToVoiceMode,
    startRecording,
    stopRecording
  }
}
