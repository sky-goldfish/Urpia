import { describe, expect, it, vi } from 'vitest'
import { prisma } from '../src/lib/prisma.js'
import { processProfileMemoryJob } from '../src/services/profile-agent/memoryService.js'

vi.mock('../src/services/profile-agent/llmService.js', () => ({
  extractMemoryInsights: vi.fn(async () => ({
    memories: [
      {
        memoryType: 'personality',
        title: '更偏向低压力关系',
        summary: '用户提到希望被安静地陪伴。',
        confidence: 0.91,
        importance: 3,
        isVisible: true
      }
    ],
    traits: [
      {
        traitKey: 'personality.core_style',
        traitLabel: '慢热但愿意靠近',
        traitValue: '更喜欢被温柔接住',
        score: 0.84
      }
    ],
    profileDraft: {
      socialStyle: '慢热型',
      interestTags: ['咖啡'],
      tone: '轻松',
      summary: '适合在低压力空间里慢慢熟起来。'
    }
  }))
}))

describe('profile memory processing', () => {
  it('consolidates profile-agent jobs into memories and traits', async () => {
    const user = await prisma.user.create({
      data: {
        nickname: '记忆用户',
        avatarUrl: '/avatars/user.png'
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

    const turn = await prisma.profileAgentTurn.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        turnIndex: 1,
        agentPromptText: '今天想聊点什么？',
        userTranscriptText: '我今天只想被安静地陪一下',
        assistantReplyText: '那我们就慢一点聊。',
        inputMode: 'text',
        asrProvider: 'none',
        llmProvider: 'qwen',
        ttsProvider: 'none'
      }
    })

    const job = await prisma.profileMemoryJob.create({
      data: {
        userId: user.id,
        sourceType: 'profile_agent',
        sessionId: session.id,
        turnId: turn.id,
        jobType: 'extract_memory',
        status: 'pending',
        profileAgentSessionId: session.id,
        profileAgentTurnId: turn.id
      }
    })

    await processProfileMemoryJob(job.id)

    const memories = await prisma.profileMemoryItem.findMany({ where: { userId: user.id } })
    const traits = await prisma.profilePersonaTrait.findMany({ where: { userId: user.id } })
    const refreshedJob = await prisma.profileMemoryJob.findUnique({ where: { id: job.id } })

    expect(memories[0]?.title).toBe('更偏向低压力关系')
    expect(traits[0]?.traitLabel).toBe('慢热但愿意靠近')
    expect(refreshedJob?.status).toBe('succeeded')
  })

  it('updates onboarding extracted profile draft', async () => {
    const session = await prisma.onboardingSession.create({
      data: {
        userTempId: 'temp-user',
        messagesJson: '[]',
        extractedProfileJson: '{}',
        status: 'active'
      }
    })

    const turn = await prisma.onboardingTurn.create({
      data: {
        sessionId: session.id,
        turnIndex: 1,
        assistantPromptText: '你更喜欢怎样的社交场景？',
        userInputMode: 'text',
        userText: '我喜欢安静一点的咖啡馆',
        normalizedUserText: '我喜欢安静一点的咖啡馆',
        assistantReplyText: '如果遇到陌生人，你会希望谁先开口？'
      }
    })

    const job = await prisma.profileMemoryJob.create({
      data: {
        sourceType: 'onboarding',
        sessionId: session.id,
        turnId: turn.id,
        jobType: 'extract_memory',
        status: 'pending',
        onboardingSessionId: session.id,
        onboardingTurnId: turn.id
      }
    })

    await processProfileMemoryJob(job.id)

    const refreshedSession = await prisma.onboardingSession.findUnique({ where: { id: session.id } })
    const extractedProfile = JSON.parse(refreshedSession?.extractedProfileJson ?? '{}') as Record<string, unknown>

    expect(extractedProfile.socialStyle).toBe('慢热型')
    expect(extractedProfile.summary).toContain('低压力空间')
  })
})
