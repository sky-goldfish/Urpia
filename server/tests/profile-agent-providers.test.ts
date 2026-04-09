import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateConversationReply } from '../src/services/profile-agent/llmService.js'
import { synthesizeSpeech, transcribeAudio } from '../src/services/profile-agent/speechService.js'

describe('profile-agent provider wrappers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('parses llm response text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '温柔地回应用户' } }]
        })
      })
    )

    const reply = await generateConversationReply([
      { role: 'system', content: '你是陪伴型分身' },
      { role: 'user', content: '我今天有点累' }
    ])

    expect(reply).toBe('温柔地回应用户')
  })

  it('parses asr and tts responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: '今天有点累' })
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new TextEncoder().encode('fake-audio').buffer,
          headers: new Headers({ 'content-type': 'audio/mpeg' })
        })
    )

    const transcription = await transcribeAudio(Buffer.from('audio'))
    const speech = await synthesizeSpeech('温柔一点说')

    expect(transcription.text).toBe('今天有点累')
    expect(speech.contentType).toBe('audio/mpeg')
    expect(speech.audioBase64.length).toBeGreaterThan(0)
  })
})
