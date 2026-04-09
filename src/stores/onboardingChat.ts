import { defineStore } from 'pinia'
import type { OnboardingMessage } from '../types/onboardingChat'

export const useOnboardingChatStore = defineStore('onboarding-chat', {
  state: () => ({
    sessionId: '',
    currentQuestion: '',
    questionIndex: 0,
    totalQuestions: 0,
    isStreamingQuestion: false,
    isSubmitting: false,
    inputMode: 'voice' as 'voice' | 'text',
    messages: [] as OnboardingMessage[]
  })
})
