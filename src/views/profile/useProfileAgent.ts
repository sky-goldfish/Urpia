import { onBeforeUnmount, ref } from 'vue'
import { apiClient } from '../../lib/api'
import type {
  ProfileMemoriesResponse,
  ProfileMemoryItem,
  ProfileSessionStartResponse,
  ProfileTrait,
  ProfileTraitsResponse,
  VoiceTurnResponse
} from '../../types/profileAgent'
import { readStoredProfileUserId } from './profileModel.config'

export const useProfileAgent = () => {
  const userId = readStoredProfileUserId()
  const memories = ref<ProfileMemoryItem[]>([])
  const traits = ref<ProfileTrait[]>([])
  const promptText = ref('')
  const isLoadingMemories = ref(false)
  const isStartingSession = ref(false)
  const isRecording = ref(false)
  const speechSupported = ref(
    typeof window !== 'undefined' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia
  )
  const lastTranscript = ref('')
  const activeSessionId = ref('')

  let idleTimer = 0
  let recorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let recordedChunks: BlobPart[] = []

  const loadMemories = async () => {
    if (!userId) {
      memories.value = []
      traits.value = []
      return
    }

    isLoadingMemories.value = true

    try {
      const [memoryResponse, traitResponse] = await Promise.all([
        apiClient.get<ProfileMemoriesResponse>(`/api/profile-agent/memories?userId=${userId}`),
        apiClient.get<ProfileTraitsResponse>(`/api/profile-agent/traits?userId=${userId}`)
      ])

      memories.value = memoryResponse.items
      traits.value = traitResponse.traits
    } finally {
      isLoadingMemories.value = false
    }
  }

  const startSession = async () => {
    if (!userId || isStartingSession.value) {
      return
    }

    isStartingSession.value = true

    try {
      const response = await apiClient.postJson<ProfileSessionStartResponse>('/api/profile-agent/session/start', {
        userId,
        triggerType: 'profile_idle'
      })

      activeSessionId.value = response.session.id
      promptText.value = response.prompt.text
    } finally {
      isStartingSession.value = false
    }
  }

  const bootstrap = async () => {
    await loadMemories()

    if (idleTimer) {
      window.clearTimeout(idleTimer)
    }

    if (userId) {
      idleTimer = window.setTimeout(() => {
        void startSession()
      }, 5000)
    }
  }

  const playSpeech = (audio: { contentType: string; base64: string }) => {
    const player = new Audio(`data:${audio.contentType};base64,${audio.base64}`)
    void player.play().catch(() => undefined)
  }

  const sendVoiceTurn = async (audioBlob: Blob, inputMode: 'tap' | 'hold_to_talk' = 'hold_to_talk') => {
    if (!userId) {
      return null
    }

    if (!activeSessionId.value) {
      await startSession()
    }

    const form = new FormData()
    form.append('sessionId', activeSessionId.value)
    form.append('userId', userId)
    form.append('inputMode', inputMode)
    form.append('audio', audioBlob, 'profile-agent.webm')

    const data = await apiClient.postForm<VoiceTurnResponse>('/api/profile-agent/turns/voice', form)
    activeSessionId.value = data.session.id
    lastTranscript.value = data.turn.userTranscriptText
    promptText.value = data.turn.assistantReplyText
    playSpeech(data.audio)
    window.setTimeout(() => {
      void loadMemories()
    }, 400)
    return data
  }

  const startRecording = async () => {
    if (!speechSupported.value || isRecording.value || !userId) {
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
        resolve(new Blob(recordedChunks, { type: activeRecorder.mimeType || 'audio/webm' }))
        recordedChunks = []
      }

      activeRecorder.stop()
      activeStream?.getTracks().forEach((track) => track.stop())
    })

    recorder = null
    stream = null

    if (audioBlob.size > 0) {
      await sendVoiceTurn(audioBlob)
    }
  }

  onBeforeUnmount(() => {
    if (idleTimer) {
      window.clearTimeout(idleTimer)
    }
    stream?.getTracks().forEach((track) => track.stop())
  })

  return {
    userId,
    memories,
    traits,
    promptText,
    isLoadingMemories,
    isRecording,
    speechSupported,
    lastTranscript,
    bootstrap,
    startRecording,
    stopRecording
  }
}
