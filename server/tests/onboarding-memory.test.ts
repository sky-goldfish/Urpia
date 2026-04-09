import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

vi.mock('../src/services/profile-agent/speechService.js', () => ({
  transcribeAudio: vi.fn(async () => ({
    text: '我更喜欢慢慢熟起来的空间',
    provider: 'telespeech'
  }))
}))

describe('onboarding memory flow', () => {
  it('stores a text onboarding turn and enqueues a memory job', async () => {
    const session = await prisma.onboardingSession.create({
      data: {
        userTempId: 'temp-user',
        messagesJson: '[]',
        extractedProfileJson: '{}',
        status: 'active'
      }
    })

    const response = await request(createApp()).post('/api/onboarding/turns/text').send({
      sessionId: session.id,
      text: '我喜欢安静一点的咖啡馆'
    })

    expect(response.status).toBe(200)
    expect(response.body.reply.length).toBeGreaterThan(0)

    const turns = await prisma.onboardingTurn.findMany({ where: { sessionId: session.id } })
    const jobs = await prisma.profileMemoryJob.findMany({ where: { sessionId: session.id } })

    expect(turns[0]?.normalizedUserText).toContain('咖啡馆')
    expect(jobs[0]?.jobType).toBe('extract_memory')
  })

  it('stores a voice onboarding turn after ASR', async () => {
    const session = await prisma.onboardingSession.create({
      data: {
        userTempId: 'temp-user-2',
        messagesJson: '[]',
        extractedProfileJson: '{}',
        status: 'active'
      }
    })

    const response = await request(createApp())
      .post('/api/onboarding/turns/voice')
      .field('sessionId', session.id)
      .attach('audio', Buffer.from('voice-binary'), 'voice.webm')

    expect(response.status).toBe(200)

    const turns = await prisma.onboardingTurn.findMany({ where: { sessionId: session.id } })
    expect(turns[0]?.asrText).toContain('慢慢熟起来')
  })
})
