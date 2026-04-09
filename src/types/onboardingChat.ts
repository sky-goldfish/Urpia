export interface OnboardingSessionStartResponse {
  sessionId: string
  questionText: string
  questionIndex: number
  totalQuestions: number
  streamMode: 'typewriter'
}

export interface OnboardingTurnResponse {
  reply: string
  done: boolean
  turnId: string
  transcript?: string
}

export interface PersonaConfirmResponse {
  user: {
    id: string
    nickname: string
    avatarUrl: string
  }
}

export interface OnboardingMessage {
  id: number
  role: 'ai' | 'user'
  text: string
}
