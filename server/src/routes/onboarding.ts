import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../lib/prisma.js'
import { ApiError } from '../lib/errors.js'
import { draftPersona, onboardingPrompts } from '../lib/rules.js'
import {
  submitOnboardingTextTurn,
  submitOnboardingVoiceTurn
} from '../services/onboarding/onboardingTurnService.js'

export const onboardingRouter = Router()
const upload = multer()

onboardingRouter.post('/session', async (_req, res) => {
  const session = await prisma.onboardingSession.create({
    data: {
      userTempId: randomUUID(),
      messagesJson: JSON.stringify([]),
      extractedProfileJson: JSON.stringify({}),
      status: 'active'
    }
  })

  res.json({
    sessionId: session.id,
    reply: onboardingPrompts[0],
    questionText: onboardingPrompts[0],
    questionIndex: 1,
    totalQuestions: onboardingPrompts.length,
    streamMode: 'typewriter',
    personaDraft: draftPersona([])
  })
})

onboardingRouter.post('/chat', async (req, res, next) => {
  try {
    const { sessionId, message } = req.body as { sessionId?: string; message?: string }
    if (!sessionId || !message) {
      throw new ApiError(400, 'INVALID_REQUEST', '缺少会话或消息')
    }

    const result = await submitOnboardingTextTurn(sessionId, message)

    res.json({
      reply: result.reply,
      progress: result.turn.turnIndex,
      personaDraft: result.personaDraft,
      done: result.done,
      turnId: result.turn.id
    })
  } catch (error) {
    next(error)
  }
})

onboardingRouter.post('/turns/text', async (req, res, next) => {
  try {
    const result = await submitOnboardingTextTurn(String(req.body.sessionId ?? ''), String(req.body.text ?? ''))
    res.json({
      reply: result.reply,
      done: result.done,
      turnId: result.turn.id,
      personaDraft: result.personaDraft
    })
  } catch (error) {
    next(error)
  }
})

onboardingRouter.post('/turns/voice', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'ONBOARDING_AUDIO_REQUIRED', '请上传语音内容')
    }

    const result = await submitOnboardingVoiceTurn(String(req.body.sessionId ?? ''), req.file.buffer)
    res.json({
      reply: result.reply,
      done: result.done,
      turnId: result.turn.id,
      transcript: result.turn.normalizedUserText,
      personaDraft: result.personaDraft
    })
  } catch (error) {
    next(error)
  }
})

onboardingRouter.post('/confirm', async (req, res, next) => {
  try {
    const { sessionId, nickname, avatarUrl } = req.body as {
      sessionId?: string
      nickname?: string
      avatarUrl?: string
    }

    if (!sessionId || !nickname?.trim() || !avatarUrl) {
      throw new ApiError(400, 'INVALID_REQUEST', '昵称和头像不能为空')
    }

    const session = await prisma.onboardingSession.findUnique({ where: { id: sessionId } })
    if (!session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'onboarding 会话不存在')
    }

    const personaDraft = JSON.parse(session.extractedProfileJson || '{}') as {
      mbti?: string
      summary?: string
      tone?: string
      socialStyle?: string
      interestTags?: string[]
    }

    const user = await prisma.user.create({
      data: {
        nickname: nickname.trim(),
        avatarUrl,
        mbti: personaDraft.mbti,
        bio: personaDraft.summary,
        persona: {
          create: {
            tone: personaDraft.tone ?? '轻松',
            socialStyle: personaDraft.socialStyle ?? '慢热型',
            moodTags: JSON.stringify(['治愈', '松弛']),
            interestTags: JSON.stringify(personaDraft.interestTags ?? ['城市探索']),
            openingScript: '从地点和兴趣切入会更自然。',
            summary: personaDraft.summary ?? '适合在有氛围感的地点进行低压力社交。'
          }
        }
      },
      include: { persona: true }
    })

    res.json({ user })
  } catch (error) {
    next(error)
  }
})
