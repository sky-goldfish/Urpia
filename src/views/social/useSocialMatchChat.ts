import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { matchChat } from '../../lib/mockData'
import { socialParticipants } from './social.config'

export const useSocialMatchChat = () => {
  const chatEndRef = ref<HTMLDivElement | null>(null)
  const messages = ref(matchChat)
  const isTyping = ref(true)
  const progress = ref(1)
  const currentSpeaker = ref<'match' | 'user'>('match')
  const totalRounds = 3

  let firstTimer: number | undefined
  let secondTimer: number | undefined
  let thirdTimer: number | undefined

  const scrollToBottom = async () => {
    await nextTick()
    chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  }

  const currentSpeakerName = () =>
    currentSpeaker.value === 'match' ? socialParticipants.match.name : socialParticipants.user.name

  onMounted(() => {
    void scrollToBottom()

    firstTimer = window.setTimeout(() => {
      isTyping.value = false
      currentSpeaker.value = 'user'
      progress.value = 2
      void scrollToBottom()
    }, 3000)

    secondTimer = window.setTimeout(() => {
      progress.value = 3
      currentSpeaker.value = 'match'
      isTyping.value = true
      void scrollToBottom()
    }, 6000)

    thirdTimer = window.setTimeout(() => {
      isTyping.value = false
    }, 9000)
  })

  onBeforeUnmount(() => {
    if (firstTimer) window.clearTimeout(firstTimer)
    if (secondTimer) window.clearTimeout(secondTimer)
    if (thirdTimer) window.clearTimeout(thirdTimer)
  })

  return {
    chatEndRef,
    messages,
    isTyping,
    progress,
    currentSpeaker,
    totalRounds,
    currentSpeakerName,
  }
}
