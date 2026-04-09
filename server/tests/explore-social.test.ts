import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('explore + social api', () => {
  it('lists pois', async () => {
    const response = await request(createApp()).get('/api/pois')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.items)).toBe(true)
  })

  it('creates a discovery and a match', async () => {
    const app = createApp()
    const session = await request(app).post('/api/onboarding/session').send({})
    const userResponse = await request(app).post('/api/personas/confirm').send({
      sessionId: session.body.sessionId,
      nickname: '测试用户',
      avatarUrl: '/avatars/test.jpg'
    })
    const pois = await request(app).get('/api/pois')
    const poiId = pois.body.items[0].id

    const discovery = await request(app).post('/api/discovery/reveal').send({
      userId: userResponse.body.user.id,
      poiId
    })

    const match = await request(app).post('/api/matches').send({
      userId: userResponse.body.user.id,
      discoveryId: discovery.body.discovery.id
    })

    expect(discovery.status).toBe(200)
    expect(match.status).toBe(200)
    expect(match.body.match.chatRounds.length).toBe(3)
  })
})