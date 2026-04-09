import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const poisRouter = Router()

poisRouter.get('/', async (_req, res) => {
  const items = await prisma.poi.findMany({ where: { status: 'active' } })
  res.json({ items })
})

poisRouter.get('/:id', async (req, res) => {
  const item = await prisma.poi.findUnique({ where: { id: req.params.id } })

  if (!item) {
    return res.status(404).json({ error: { code: 'POI_NOT_FOUND', message: '当前地点不存在或已下线' } })
  }

  res.json({ item })
})