import { prisma } from '../../lib/prisma.js'
import { draftPersona, onboardingPrompts } from '../../lib/rules.js'
import { ApiError } from '../../lib/errors.js'
import { enqueueExtractMemoryJob } from '../profile-agent/memoryService.js'
import { transcribeAudio } from '../profile-agent/speechService.js'

const getPrompt = (turnIndex: number) =>
  onboardingPrompts[Math.min(turnIndex, onboardingPrompts.length - 1)] ?? onboardingPrompts[onboardingPrompts.length - 1]

const loadSession = async (sessionId: string) => {
  const session = await prisma.onboardingSession.findUnique({ where: { id: sessionId } })
  if (!session) {
    throw new ApiError(404, 'SESSION_NOT_FOUND', 'onboarding 会话不存在')
  }

  return session
}

const updateSessionDraft = async (sessionId: string, nextMessage: string) => {
  const session = await loadSession(sessionId)
  const messages = JSON.parse(session.messagesJson || '[]') as string[]
  messages.push(nextMessage)
  const personaDraft = draftPersona(messages)
  const done = messages.length >= onboardingPrompts.length

  await prisma.onboardingSession.update({
    where: { id: sessionId },
    data: {
      messagesJson: JSON.stringify(messages),
      extractedProfileJson: JSON.stringify(personaDraft),
      status: done ? 'completed' : 'active'
    }
  })

  return {
    done,
    personaDraft,
    reply: done ? '了解你了，正在生成你的分身...' : getPrompt(messages.length)
  }
}

export const submitOnboardingTextTurn = async (sessionId: string, text: string) => {
  const session = await loadSession(sessionId)
  const normalizedUserText = text.trim()

  if (!normalizedUserText) {
    throw new ApiError(400, 'INVALID_REQUEST', '消息内容不能为空')
  }

  const turnIndex = await prisma.onboardingTurn.count({ where: { sessionId } })
  const next = await updateSessionDraft(sessionId, normalizedUserText)

  const turn = await prisma.onboardingTurn.create({
    data: {
      sessionId,
      turnIndex: turnIndex + 1,
      assistantPromptText: getPrompt(turnIndex),
      userInputMode: 'text',
      userText: normalizedUserText,
      normalizedUserText,
      assistantReplyText: next.reply
    }
  })

  await enqueueExtractMemoryJob({
    userId: null,
    sourceType: 'onboarding',
    sessionId,
    turnId: turn.id,
    onboardingSessionId: session.id,
    onboardingTurnId: turn.id
  })

  return {
    turn,
    reply: next.reply,
    done: next.done,
    personaDraft: next.personaDraft
  }
}

export const submitOnboardingVoiceTurn = async (sessionId: string, audio: Buffer) => {
  const session = await loadSession(sessionId)
  const transcription = await transcribeAudio(audio)
  const turnIndex = await prisma.onboardingTurn.count({ where: { sessionId } })
  const next = await updateSessionDraft(sessionId, transcription.text)

  const turn = await prisma.onboardingTurn.create({
    data: {
      sessionId,
      turnIndex: turnIndex + 1,
      assistantPromptText: getPrompt(turnIndex),
      userInputMode: 'voice',
      asrText: transcription.text,
      normalizedUserText: transcription.text,
      assistantReplyText: next.reply
    }
  })

  await enqueueExtractMemoryJob({
    userId: null,
    sourceType: 'onboarding',
    sessionId,
    turnId: turn.id,
    onboardingSessionId: session.id,
    onboardingTurnId: turn.id
  })

  return {
    turn,
    reply: next.reply,
    done: next.done,
    personaDraft: next.personaDraft
  }
}
