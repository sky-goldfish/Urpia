import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

vi.mock('../src/services/profile-agent/llmService.js', () => ({
  generateConversationReply: vi.fn(async () => '那我们就慢一点聊。')
}))

vi.mock('../src/services/profile-agent/speechService.js', () => ({
  transcribeAudio: vi.fn(async () => ({ text: '我今天有一点累', provider: 'telespeech' })),
  synthesizeSpeech: vi.fn(async () => ({
    audioBase64: Buffer.from('fake-audio').toString('base64'),
    contentType: 'audio/mpeg',
    provider: 'moss'
  }))
}))

describe('profile-agent turn routes', () => {
  it('stores a voice turn and enqueues memory extraction', async () => {
    const user = await prisma.user.create({
      data: {
        nickname: '语音用户',
        avatarUrl: '/avatars/voice.png'
      }
    })

    const session = await prisma.profileAgentSession.create({
      data: {
        userId: user.id,
        status: 'active',
        triggerType: 'profile_idle',
        moodSnapshotJson: '[]'
      }
    })

    const response = await request(createApp())
      .post('/api/profile-agent/turns/voice')
      .field('sessionId', session.id)
      .field('userId', user.id)
      .field('inputMode', 'hold_to_talk')
      .attach('audio', Buffer.from('voice-binary'), 'voice.webm')

    expect(response.status).toBe(200)
    expect(response.body.turn.userTranscriptText).toBe('我今天有一点累')
    expect(response.body.audio.contentType).toBe('audio/mpeg')

    const turns = await prisma.profileAgentTurn.findMany({ where: { sessionId: session.id } })
    const jobs = await prisma.profileMemoryJob.findMany({ where: { sessionId: session.id } })

    expect(turns).toHaveLength(1)
    expect(jobs[0]?.jobType).toBe('extract_memory')
  })

  it('stores a text turn without ASR', async () => {
    const user = await prisma.user.create({
      data: {
        nickname: '文字用户',
        avatarUrl: '/avatars/text.png'
      }
    })

    const session = await prisma.profileAgentSession.create({
      data: {
        userId: user.id,
        status: 'active',
        triggerType: 'profile_idle',
        moodSnapshotJson: '[]'
      }
    })

    const response = await request(createApp()).post('/api/profile-agent/turns/text').send({
      sessionId: session.id,
      userId: user.id,
      text: '我今天只想被安静地陪一下'
    })

    expect(response.status).toBe(200)
    expect(response.body.turn.userTranscriptText).toContain('安静地陪')

    const turns = await prisma.profileAgentTurn.findMany({ where: { sessionId: session.id } })
    expect(turns[0]?.inputMode).toBe('text')
  })
})
