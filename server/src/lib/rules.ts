export const onboardingPrompts = [
  '你更喜欢怎样的社交场景？',
  '如果遇到陌生人，你会希望谁先开口？',
  '你最近最容易被哪类地点吸引？',
  '最后一个问题：你希望分身更像你，还是更外放一点？'
]

export const draftPersona = (messages: string[]) => {
  const text = messages.join(' ')
  const interestTags = [
    text.includes('咖啡') ? '咖啡' : null,
    text.includes('展') ? '展览' : null,
    text.includes('散步') ? '散步' : null
  ].filter(Boolean)

  return {
    mbti: text.includes('安静') ? 'INFP' : 'ENFP',
    socialStyle: text.includes('慢') || text.includes('安静') ? '慢热型' : '外向型',
    interestTags: interestTags.length > 0 ? interestTags : ['城市探索'],
    tone: text.includes('温柔') ? '温柔' : '轻松',
    summary: '适合在有氛围感的地点进行低压力社交。'
  }
}

export const scoreMatch = (interestTags: string[], poiMoodTags: string[]) => {
  const overlap = interestTags.filter((tag) => poiMoodTags.includes(tag)).length
  return Math.min(95, 60 + overlap * 10)
}

export const buildChatRounds = (nickname: string, poiName: string) => [
  { speaker: 'match', text: `我看到你也被 ${poiName} 吸引，这个点很特别。` },
  { speaker: 'user', text: `${nickname} 看起来也会喜欢这种轻松一点的地方。` },
  { speaker: 'match', text: '也许我们都更适合从地点和兴趣开始慢慢聊起来。' }
]