import { Prisma } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import { profileAgentEnv } from '../src/config/env.js'

describe('profile-agent schema and env', () => {
  it('exposes required env defaults', () => {
    expect(profileAgentEnv.llmModel).toBe('Qwen/Qwen3.5-9B')
    expect(profileAgentEnv.asrModel).toBe('TeleAI/TeleSpeechASR')
    expect(profileAgentEnv.ttsModel).toBe('fnlp/MOSS-TTSD-v0.5')
  })

  it('contains profile-agent prisma models', () => {
    const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name)

    expect(modelNames).toContain('OnboardingTurn')
    expect(modelNames).toContain('ProfileAgentSession')
    expect(modelNames).toContain('ProfileAgentTurn')
    expect(modelNames).toContain('ProfileMemoryItem')
    expect(modelNames).toContain('ProfilePersonaTrait')
    expect(modelNames).toContain('ProfileMemoryJob')
  })
})
