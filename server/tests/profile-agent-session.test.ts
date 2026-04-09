import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

vi.mock('../src/services/profile-agent/llmService.js', () => ({
  generateConversationReply: vi.fn(async () => 'mocked reply')
}))

describe('profile-agent session routes', () => {
  it('starts a session and returns a proactive prompt', async () => {
    const user = await prisma.user.create({
      data: {
        nickname: '陪伴对象',
        avatarUrl: '/avatars/test.png'
      }
    })

    const response = await request(createApp()).post('/api/profile-agent/session/start').send({
      userId: user.id,
      triggerType: 'profile_idle'
    })

    expect(response.status).toBe(200)
    expect(response.body.session.status).toBe('active')
    expect(response.body.prompt.text).toBe('mocked reply')
  })

  it('reads visible memories and persona traits', async () => {
    const user = await prisma.user.create({
      data: {
        nickname: '记忆对象',
        avatarUrl: '/avatars/memory.png'
      }
    })

    await prisma.profileMemoryItem.create({
      data: {
        userId: user.id,
        sourceType: 'profile_agent',
        sourceSessionId: 'session_1',
        memoryType: 'interest',
        title: '喜欢安静空间',
        summary: '更愿意在低压力的环境里慢慢熟起来。',
        evidenceJson: '[]',
        confidence: 0.92,
        importance: 3,
        isVisible: true
      }
    })

    await prisma.profilePersonaTrait.create({
      data: {
        userId: user.id,
        traitKey: 'personality.core_style',
        traitLabel: '慢热但愿意靠近',
        traitValue: '更适合低压力的关系节奏',
        score: 0.81
      }
    })

    const [memories, traits] = await Promise.all([
      request(createApp()).get(`/api/profile-agent/memories?userId=${user.id}`),
      request(createApp()).get(`/api/profile-agent/traits?userId=${user.id}`)
    ])

    expect(memories.status).toBe(200)
    expect(memories.body.items[0].title).toBe('喜欢安静空间')
    expect(traits.status).toBe(200)
    expect(traits.body.traits[0].label).toBe('慢热但愿意靠近')
  })
})
