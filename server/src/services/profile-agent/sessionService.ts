import { prisma } from '../../lib/prisma.js'
import { ApiError } from '../../lib/errors.js'
import { generateConversationReply } from './llmService.js'
import { enqueueExtractMemoryJob } from './memoryService.js'
import { synthesizeSpeech, transcribeAudio } from './speechService.js'

type StartSessionInput = {
  userId: string
  triggerType?: string
}

export const startProfileAgentSession = async ({ userId, triggerType = 'profile_idle' }: StartSessionInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profilePersonaTraits: {
        orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
        take: 3
      },
      profileMemoryItems: {
        where: { isVisible: true },
        orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
        take: 3
      }
    }
  })

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', '用户不存在')
  }

  const existingSession = await prisma.profileAgentSession.findFirst({
    where: {
      userId,
      status: 'active'
    },
    orderBy: {
      startedAt: 'desc'
    }
  })

  if (existingSession) {
    return {
      session: {
        id: existingSession.id,
        status: existingSession.status,
        turnIndex: await prisma.profileAgentTurn.count({ where: { sessionId: existingSession.id } }) + 1
      },
      prompt: {
        text: '我还在这里，可以继续慢慢说。',
        shouldSpeak: true
      }
    }
  }

  const context = [
    ...user.profilePersonaTraits.map((trait) => `${trait.traitLabel}: ${trait.traitValue}`),
    ...user.profileMemoryItems.map((memory) => `${memory.title}: ${memory.summary}`)
  ].join('\n')

  const promptText = await generateConversationReply([
    {
      role: 'system',
      content: '你是陪伴型分身，请根据已有画像和记忆，用一句温柔的主动提问开启对话。'
    },
    {
      role: 'user',
      content: context || '还没有稳定画像，请用一句轻柔的问题和用户打招呼。'
    }
  ])

  const session = await prisma.profileAgentSession.create({
    data: {
      userId,
      status: 'active',
      triggerType,
      moodSnapshotJson: JSON.stringify([])
    }
  })

  return {
    session: {
      id: session.id,
      status: session.status,
      turnIndex: 1
    },
    prompt: {
      text: promptText,
      shouldSpeak: true
    }
  }
}

const getActiveSession = async (sessionId: string, userId: string) => {
  const session = await prisma.profileAgentSession.findFirst({
    where: {
      id: sessionId,
      userId,
      status: 'active'
    }
  })

  if (!session) {
    throw new ApiError(404, 'SESSION_NOT_FOUND', '陪伴会话不存在')
  }

  return session
}

const buildAssistantReply = async (userTranscriptText: string) =>
  generateConversationReply([
    {
      role: 'system',
      content: '你是陪伴型分身，请用温柔、简短、可继续展开的方式回应用户。'
    },
    {
      role: 'user',
      content: userTranscriptText
    }
  ])

type SubmitTextTurnInput = {
  sessionId: string
  userId: string
  text: string
}

export const submitProfileAgentTextTurn = async ({ sessionId, userId, text }: SubmitTextTurnInput) => {
  const session = await getActiveSession(sessionId, userId)
  const userTranscriptText = text.trim()

  if (!userTranscriptText) {
    throw new ApiError(400, 'INVALID_REQUEST', '消息内容不能为空')
  }

  const assistantReplyText = await buildAssistantReply(userTranscriptText)
  const turnIndex = await prisma.profileAgentTurn.count({ where: { sessionId: session.id } })

  const turn = await prisma.profileAgentTurn.create({
    data: {
      sessionId: session.id,
      userId,
      turnIndex: turnIndex + 1,
      agentPromptText: '请继续说说你的感受。',
      userTranscriptText,
      assistantReplyText,
      inputMode: 'text',
      asrProvider: 'none',
      llmProvider: 'qwen',
      ttsProvider: 'none'
    }
  })

  await prisma.profileAgentSession.update({
    where: { id: session.id },
    data: {
      lastTurnAt: turn.createdAt
    }
  })

  await enqueueExtractMemoryJob({
    userId,
    sourceType: 'profile_agent',
    sessionId: session.id,
    turnId: turn.id,
    profileAgentSessionId: session.id,
    profileAgentTurnId: turn.id
  })

  return {
    turn,
    session: {
      id: session.id,
      status: 'active',
      nextTurnIndex: turn.turnIndex + 1
    }
  }
}

type SubmitVoiceTurnInput = {
  sessionId: string
  userId: string
  inputMode: string
  audio: Buffer
}

export const submitProfileAgentVoiceTurn = async ({
  sessionId,
  userId,
  inputMode,
  audio
}: SubmitVoiceTurnInput) => {
  const session = await getActiveSession(sessionId, userId)
  const transcription = await transcribeAudio(audio)
  const assistantReplyText = await buildAssistantReply(transcription.text)
  const synthesized = await synthesizeSpeech(assistantReplyText)
  const turnIndex = await prisma.profileAgentTurn.count({ where: { sessionId: session.id } })

  const turn = await prisma.profileAgentTurn.create({
    data: {
      sessionId: session.id,
      userId,
      turnIndex: turnIndex + 1,
      agentPromptText: '请继续说说你的感受。',
      userTranscriptText: transcription.text,
      assistantReplyText,
      inputMode,
      asrProvider: transcription.provider,
      llmProvider: 'qwen',
      ttsProvider: synthesized.provider
    }
  })

  await prisma.profileAgentSession.update({
    where: { id: session.id },
    data: {
      lastTurnAt: turn.createdAt
    }
  })

  await enqueueExtractMemoryJob({
    userId,
    sourceType: 'profile_agent',
    sessionId: session.id,
    turnId: turn.id,
    profileAgentSessionId: session.id,
    profileAgentTurnId: turn.id
  })

  return {
    turn,
    audio: {
      contentType: synthesized.contentType,
      base64: synthesized.audioBase64
    },
    session: {
      id: session.id,
      status: 'active',
      nextTurnIndex: turn.turnIndex + 1
    }
  }
}
