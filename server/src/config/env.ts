const get = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export const profileAgentEnv = {
  apiKey: get('SILICONFLOW_API_KEY', 'test-key'),
  llmModel: get('PROFILE_AGENT_LLM_MODEL', 'Qwen/Qwen3.5-9B'),
  asrModel: get('PROFILE_AGENT_ASR_MODEL', 'TeleAI/TeleSpeechASR'),
  ttsModel: get('PROFILE_AGENT_TTS_MODEL', 'fnlp/MOSS-TTSD-v0.5'),
  ttsVoice: get('PROFILE_AGENT_TTS_VOICE', 'fnlp/MOSS-TTSD-v0.5:anna'),
  onboardingStreamChunkMs: Number(get('ONBOARDING_STREAM_CHUNK_MS', '28'))
}
