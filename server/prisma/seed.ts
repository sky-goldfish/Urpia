import { prisma } from '../src/lib/prisma.js'

async function main() {
  await prisma.poi.deleteMany()

  await prisma.poi.createMany({
    data: [
      {
        name: '安静森林咖啡',
        category: 'cafe',
        description: '适合慢热聊天和轻声交流的咖啡空间',
        lng: 121.4737,
        lat: 31.2304,
        moodTags: JSON.stringify(['治愈', '安静', '松弛']),
        status: 'active'
      },
      {
        name: '黄昏展览角',
        category: 'gallery',
        description: '适合从兴趣切入聊天的轻展览空间',
        lng: 121.4751,
        lat: 31.2281,
        moodTags: JSON.stringify(['创意', '浪漫', '观察']),
        status: 'active'
      }
    ]
  })
}

main().finally(async () => {
  await prisma.$disconnect()
})