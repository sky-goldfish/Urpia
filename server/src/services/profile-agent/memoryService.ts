import { prisma } from '../../lib/prisma.js'
import { extractMemoryInsights } from './llmService.js'

type EnqueueMemoryJobInput = {
  userId?: string | null
  sourceType: 'profile_agent' | 'onboarding'
  sessionId: string
  turnId?: string | null
  profileAgentSessionId?: string | null
  profileAgentTurnId?: string | null
  onboardingSessionId?: string | null
  onboardingTurnId?: string | null
  jobType?: string
}

export const enqueueExtractMemoryJob = async (input: EnqueueMemoryJobInput) =>
  prisma.profileMemoryJob
    .create({
      data: {
        userId: input.userId ?? null,
        sourceType: input.sourceType,
        sessionId: input.sessionId,
        turnId: input.turnId ?? null,
        jobType: input.jobType ?? 'extract_memory',
        status: 'pending',
        profileAgentSessionId: input.profileAgentSessionId ?? null,
        profileAgentTurnId: input.profileAgentTurnId ?? null,
        onboardingSessionId: input.onboardingSessionId ?? null,
        onboardingTurnId: input.onboardingTurnId ?? null
      }
    })
    .then((job) => {
      queueMicrotask(() => {
        void processProfileMemoryJob(job.id).catch(() => undefined)
      })

      return job
    })

const mergeProfileDraft = (existingJson: string, nextDraft: Record<string, unknown>) => {
  const existing = JSON.parse(existingJson || '{}') as Record<string, unknown>
  return {
    ...existing,
    ...nextDraft,
    interestTags:
      Array.isArray(nextDraft.interestTags) && nextDraft.interestTags.length > 0
        ? nextDraft.interestTags
        : (existing.interestTags as string[] | undefined) ?? []
  }
}

export const processProfileMemoryJob = async (jobId: string) => {
  const job = await prisma.profileMemoryJob.findUnique({
    where: { id: jobId },
    include: {
      profileAgentTurn: true,
      onboardingTurn: true,
      onboardingSession: true
    }
  })

  if (!job) {
    return null
  }

  await prisma.profileMemoryJob.update({
    where: { id: job.id },
    data: {
      status: 'running',
      attemptCount: {
        increment: 1
      }
    }
  })

  try {
    if (job.sourceType === 'profile_agent' && job.profileAgentTurn && job.userId) {
      const insight = await extractMemoryInsights(
        job.profileAgentTurn.userTranscriptText,
        job.profileAgentTurn.agentPromptText
      )

      await prisma.$transaction([
        ...insight.memories.map((memory) =>
          prisma.profileMemoryItem.create({
            data: {
              userId: job.userId!,
              sourceType: job.sourceType,
              sourceSessionId: job.sessionId,
              memoryType: memory.memoryType,
              title: memory.title,
              summary: memory.summary,
              evidenceJson: JSON.stringify([job.profileAgentTurn?.id]),
              confidence: memory.confidence,
              importance: memory.importance,
              isVisible: memory.isVisible
            }
          })
        ),
        ...insight.traits.map((trait) =>
          prisma.profilePersonaTrait.upsert({
            where: {
              userId_traitKey: {
                userId: job.userId!,
                traitKey: trait.traitKey
              }
            },
            update: {
              traitLabel: trait.traitLabel,
              traitValue: trait.traitValue,
              score: trait.score
            },
            create: {
              userId: job.userId!,
              traitKey: trait.traitKey,
              traitLabel: trait.traitLabel,
              traitValue: trait.traitValue,
              score: trait.score
            }
          })
        )
      ])
    }

    if (job.sourceType === 'onboarding' && job.onboardingTurn && job.onboardingSession) {
      const insight = await extractMemoryInsights(
        job.onboardingTurn.normalizedUserText,
        job.onboardingTurn.assistantPromptText
      )
      const mergedDraft = mergeProfileDraft(job.onboardingSession.extractedProfileJson, insight.profileDraft)

      await prisma.onboardingSession.update({
        where: { id: job.onboardingSession.id },
        data: {
          extractedProfileJson: JSON.stringify(mergedDraft)
        }
      })
    }

    return prisma.profileMemoryJob.update({
      where: { id: job.id },
      data: {
        status: 'succeeded',
        errorMessage: null,
        finishedAt: new Date()
      }
    })
  } catch (error) {
    return prisma.profileMemoryJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown processing error',
        finishedAt: new Date()
      }
    })
  }
}

export const listVisibleMemories = async (userId: string) => {
  const items = await prisma.profileMemoryItem.findMany({
    where: {
      userId,
      isVisible: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return items.map((item) => ({
    id: item.id,
    type: item.memoryType,
    title: item.title,
    summary: item.summary,
    confidence: item.confidence,
    createdAt: item.createdAt.toISOString()
  }))
}

export const listProfileTraits = async (userId: string) => {
  const traits = await prisma.profilePersonaTrait.findMany({
    where: { userId },
    orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }]
  })

  return traits.map((trait) => ({
    key: trait.traitKey,
    label: trait.traitLabel,
    value: trait.traitValue,
    score: trait.score
  }))
}
