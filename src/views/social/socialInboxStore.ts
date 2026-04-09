import { computed, reactive } from 'vue'

export interface SocialChatMessage {
  id: number
  role: 'self' | 'other'
  text: string
  timestamp: string
}

export interface SocialChatSession {
  id: string
  name: string
  subtitle: string
  avatarText: string
  avatarColor: string
  lastActive: string
  unreadCount: number
  messages: SocialChatMessage[]
}

const sessions = reactive<SocialChatSession[]>([
  {
    id: 'yunye',
    name: '云野',
    subtitle: '刚刚在线',
    avatarText: '云',
    avatarColor: '#9B8EC4',
    lastActive: '14:28',
    unreadCount: 2,
    messages: [
      { id: 1, role: 'other', text: '今天路过一家很安静的书店，突然想到你。', timestamp: '14:20' },
      { id: 2, role: 'self', text: '听起来很适合发呆，你进去了吗？', timestamp: '14:22' },
      { id: 3, role: 'other', text: '进去了，还发现一整面诗集墙。下次一起去？', timestamp: '14:28' },
    ],
  },
  {
    id: 'linxi',
    name: '林汐',
    subtitle: '音乐品味很合拍',
    avatarText: '汐',
    avatarColor: '#D4788C',
    lastActive: '13:06',
    unreadCount: 0,
    messages: [
      { id: 1, role: 'self', text: '你上次分享的那张歌单我循环了两天。', timestamp: '12:54' },
      { id: 2, role: 'other', text: '那我今晚再发你一张更适合夜骑的。', timestamp: '13:06' },
    ],
  },
  {
    id: 'chumo',
    name: '初墨',
    subtitle: '想约你去看展',
    avatarText: '初',
    avatarColor: '#6BBFA3',
    lastActive: '昨天',
    unreadCount: 1,
    messages: [
      { id: 1, role: 'other', text: '周末那个影像展你感兴趣吗？我觉得你会喜欢。', timestamp: '昨天 20:16' },
    ],
  },
  {
    id: 'ninghe',
    name: '宁和',
    subtitle: '在等你的回复',
    avatarText: '宁',
    avatarColor: '#D49A5A',
    lastActive: '昨天',
    unreadCount: 0,
    messages: [
      { id: 1, role: 'other', text: '你平时会一个人去咖啡馆坐很久吗？', timestamp: '昨天 09:12' },
      { id: 2, role: 'self', text: '会，而且我很喜欢靠窗的位置。', timestamp: '昨天 09:20' },
      { id: 3, role: 'other', text: '那我们应该会很聊得来。', timestamp: '昨天 09:21' },
    ],
  },
])

const nextMessageId = (messages: SocialChatMessage[]) =>
  messages.reduce((max, message) => Math.max(max, message.id), 0) + 1

export const useSocialInboxStore = () => {
  const sortedSessions = computed(() =>
    [...sessions].sort((a, b) => {
      const aUnread = a.unreadCount > 0 ? 1 : 0
      const bUnread = b.unreadCount > 0 ? 1 : 0
      if (aUnread !== bUnread) return bUnread - aUnread
      return 0
    }),
  )

  const getSessionById = (id: string) => sessions.find((session) => session.id === id)

  const markSessionRead = (id: string) => {
    const session = getSessionById(id)
    if (!session) return
    session.unreadCount = 0
  }

  const sendMessage = (id: string, text: string) => {
    const session = getSessionById(id)
    if (!session) return

    const trimmed = text.trim()
    if (!trimmed) return

    session.messages.push({
      id: nextMessageId(session.messages),
      role: 'self',
      text: trimmed,
      timestamp: '刚刚',
    })
    session.lastActive = '刚刚'
    session.subtitle = trimmed
  }

  return {
    sessions: sortedSessions,
    getSessionById,
    markSessionRead,
    sendMessage,
  }
}
