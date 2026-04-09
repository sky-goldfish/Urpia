import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const meRouter = Router()

meRouter.get('/', async (req, res) => {
  const userId = String(req.query.userId ?? '')
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { persona: true } })

  if (!user) {
    return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '当前用户不存在' } })
  }

  res.json({
    user: {
      ...user,
      persona: user.persona
        ? {
            ...user.persona,
            moodTags: JSON.parse(user.persona.moodTags),
            interestTags: JSON.parse(user.persona.interestTags)
          }
        : null
    }
  })
})

meRouter.get('/history', async (req, res) => {
  const userId = String(req.query.userId ?? '')
  const items = await prisma.match.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  res.json({
    items: items.map((item) => ({
      ...item,
      report: JSON.parse(item.reportJson)
    }))
  })
})