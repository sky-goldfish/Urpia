import { Router } from 'express'
import multer from 'multer'
import { ApiError } from '../lib/errors.js'
import { listProfileTraits, listVisibleMemories } from '../services/profile-agent/memoryService.js'
import {
  startProfileAgentSession,
  submitProfileAgentTextTurn,
  submitProfileAgentVoiceTurn
} from '../services/profile-agent/sessionService.js'

export const profileAgentRouter = Router()
const upload = multer()

profileAgentRouter.post('/session/start', async (req, res, next) => {
  try {
    const userId = String(req.body.userId ?? '')
    const triggerType = req.body.triggerType ? String(req.body.triggerType) : 'profile_idle'

    if (!userId) {
      throw new ApiError(400, 'INVALID_REQUEST', '缺少用户 ID')
    }

    const result = await startProfileAgentSession({ userId, triggerType })
    res.json(result)
  } catch (error) {
    next(error)
  }
})

profileAgentRouter.get('/memories', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? '')
    if (!userId) {
      throw new ApiError(400, 'INVALID_REQUEST', '缺少用户 ID')
    }

    res.json({
      items: await listVisibleMemories(userId)
    })
  } catch (error) {
    next(error)
  }
})

profileAgentRouter.get('/traits', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? '')
    if (!userId) {
      throw new ApiError(400, 'INVALID_REQUEST', '缺少用户 ID')
    }

    res.json({
      traits: await listProfileTraits(userId)
    })
  } catch (error) {
    next(error)
  }
})

profileAgentRouter.post('/turns/text', async (req, res, next) => {
  try {
    const sessionId = String(req.body.sessionId ?? '')
    const userId = String(req.body.userId ?? '')
    const text = String(req.body.text ?? '')

    if (!sessionId || !userId) {
      throw new ApiError(400, 'INVALID_REQUEST', '缺少会话或用户 ID')
    }

    const result = await submitProfileAgentTextTurn({ sessionId, userId, text })
    res.json(result)
  } catch (error) {
    next(error)
  }
})

profileAgentRouter.post('/turns/voice', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'PROFILE_AUDIO_REQUIRED', '请上传语音内容')
    }

    const sessionId = String(req.body.sessionId ?? '')
    const userId = String(req.body.userId ?? '')
    const inputMode = String(req.body.inputMode ?? 'tap')

    if (!sessionId || !userId) {
      throw new ApiError(400, 'INVALID_REQUEST', '缺少会话或用户 ID')
    }

    const result = await submitProfileAgentVoiceTurn({
      sessionId,
      userId,
      inputMode,
      audio: req.file.buffer
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
})
