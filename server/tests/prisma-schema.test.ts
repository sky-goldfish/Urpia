import { describe, expect, it } from 'vitest'
import { prisma } from '../src/lib/prisma.js'

describe('seeded database', () => {
  it('can read seeded POIs', async () => {
    const count = await prisma.poi.count()
    expect(count).toBeGreaterThan(0)
  })
})