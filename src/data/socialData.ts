import { matchChat, reportTopics } from '../lib/mockData'

export interface SocialChatMessageViewModel {
  id: number
  role: 'ai' | 'user' | 'match'
  author: string
  text: string
  time: string
}

const mapSocialChatMessage = (message: (typeof matchChat)[number]): SocialChatMessageViewModel => ({
  ...message,
})

export const getSocialMatchChatMessages = (): SocialChatMessageViewModel[] => matchChat.map(mapSocialChatMessage)

export const getMatchReportTopics = (): string[] => [...reportTopics]
