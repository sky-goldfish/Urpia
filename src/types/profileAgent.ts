export interface ProfileMemoryItem {
  id: string
  type: string
  title: string
  summary: string
  confidence: number
  createdAt: string
}

export interface ProfileTrait {
  key: string
  label: string
  value: string
  score: number
}

export interface ProfileSessionStartResponse {
  session: {
    id: string
    status: string
    turnIndex: number
  }
  prompt: {
    text: string
    shouldSpeak: boolean
  }
}

export interface VoiceTurnResponse {
  turn: {
    id: string
    userTranscriptText: string
    assistantReplyText: string
  }
  audio: {
    contentType: string
    base64: string
  }
  session: {
    id: string
    status: string
    nextTurnIndex: number
  }
}

export interface ProfileMemoriesResponse {
  items: ProfileMemoryItem[]
}

export interface ProfileTraitsResponse {
  traits: ProfileTrait[]
}
