import { profileAgentEnv } from '../../config/env.js'
import { siliconflowJson } from '../../lib/siliconflow.js'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type MemoryInsight = {
  memories: Array<{
    memoryType: string
    title: string
    summary: string
    confidence: number
    importance: number
    isVisible: boolean
  }>
  traits: Array<{
    traitKey: string
    traitLabel: string
    traitValue: string
    score: number
  }>
  profileDraft: {
    socialStyle?: string
    interestTags?: string[]
    tone?: string
    summary?: string
  }
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export const generateConversationReply = async (messages: ChatMessage[]) => {
  const data = await siliconflowJson<ChatCompletionResponse>('/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: profileAgentEnv.llmModel,
      messages,
      temperature: 0.7,
      max_tokens: 512,
      enable_thinking: false
    })
  })

  return data.choices?.[0]?.message?.content?.trim() ?? '我在这里，慢慢说也可以。'
}

const heuristicInsight = (userText: string): MemoryInsight => {
  const normalized = userText.trim()
  const interestTags = [
    normalized.includes('咖啡') ? '咖啡' : null,
    normalized.includes('展') ? '展览' : null,
    normalized.includes('散步') ? '散步' : null
  ].filter((value): value is string => Boolean(value))
  const prefersCalm = normalized.includes('安静') || normalized.includes('慢') || normalized.includes('陪')

  return {
    memories: [
      {
        memoryType: 'personality',
        title: prefersCalm ? '更偏向低压力关系' : '愿意尝试主动靠近',
        summary: prefersCalm
          ? '用户更容易在不需要强撑热闹的关系里感到放松。'
          : '用户愿意在轻松的氛围里尝试新的连接。',
        confidence: 0.78,
        importance: 2,
        isVisible: true
      }
    ],
    traits: [
      {
        traitKey: 'personality.core_style',
        traitLabel: prefersCalm ? '慢热但愿意靠近' : '轻快愿意尝试',
        traitValue: prefersCalm ? '更喜欢被温柔接住' : '可以从轻松话题自然开启',
        score: prefersCalm ? 0.82 : 0.7
      }
    ],
    profileDraft: {
      socialStyle: prefersCalm ? '慢热型' : '外向型',
      interestTags: interestTags.length > 0 ? interestTags : ['城市探索'],
      tone: normalized.includes('温柔') ? '温柔' : '轻松',
      summary: prefersCalm ? '适合在低压力空间里慢慢熟起来。' : '适合从轻松话题和地点兴趣自然破冰。'
    }
  }
}

const parseInsight = (content: string, fallback: MemoryInsight): MemoryInsight => {
  try {
    return JSON.parse(content) as MemoryInsight
  } catch {
    return fallback
  }
}

export const extractMemoryInsights = async (userText: string, assistantPromptText: string) => {
  const fallback = heuristicInsight(userText)

  if (profileAgentEnv.apiKey === 'test-key') {
    return fallback
  }

  const data = await siliconflowJson<ChatCompletionResponse>('/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: profileAgentEnv.llmModel,
      messages: [
        {
          role: 'system',
          content:
            '你负责提炼长期记忆。请输出 JSON，对象包含 memories、traits、profileDraft 三个字段。不要输出额外说明。'
        },
        {
          role: 'user',
          content: `问题：${assistantPromptText}\n回答：${userText}`
        }
      ],
      temperature: 0.2,
      max_tokens: 512,
      enable_thinking: false
    })
  })

  const content = data.choices?.[0]?.message?.content?.trim()
  return content ? parseInsight(content, fallback) : fallback
}
