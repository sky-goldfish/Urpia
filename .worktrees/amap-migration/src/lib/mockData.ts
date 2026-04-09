export interface PersonaCandidate {
  id: string
  title: string
  subtitle: string
  summary: string
  mood: string
  traits: string[]
  color: string
}

export interface ChatMessage {
  id: number
  role: 'ai' | 'user' | 'match'
  author: string
  text: string
  time: string
}

export interface PointOfInterest {
  id: string
  name: string
  vibe: string
  district: string
  distance: string
  occupancy: string
  note: string
  moods: string[]
  top: string
  left: string
}

export interface MatchRecord {
  id: string
  alias: string
  persona: string
  compatibility: number
  lastSeen: string
  status: string
  highlight: string
}

export const personas: PersonaCandidate[] = [
  {
    id: 'moon',
    title: '月汐观测者',
    subtitle: '细腻、慢热、对情绪频率敏感',
    summary: '你更容易被有温度的细节打动，适合在安静场域里建立连接。',
    mood: '低刺激高共鸣',
    traits: ['夜游者', '慢反馈', '偏爱真诚'],
    color: 'linear-gradient(135deg, #F2F2F7 0%, #ffffff 100%)',
  },
  {
    id: 'citrus',
    title: '柑雾导航员',
    subtitle: '外放、轻快、擅长打破陌生感',
    summary: '你会主动制造松弛氛围，让第一次见面更像自然延续而不是社交任务。',
    mood: '轻盈热络',
    traits: ['高回应', '喜欢试新点位', '节奏明亮'],
    color: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)',
  },
  {
    id: 'pine',
    title: '松屿回声体',
    subtitle: '稳定、可靠、对关系有长期视角',
    summary: '你擅长给人安全感，也更偏好在共同体验里慢慢靠近。',
    mood: '平静踏实',
    traits: ['有边界', '能共情', '重视陪伴'],
    color: 'linear-gradient(135deg, #dcfce7 0%, #ffffff 100%)',
  },
]

export const onboardingChat: ChatMessage[] = [
  {
    id: 1,
    role: 'ai',
    author: 'Zoopia Guide',
    text: '我已经读取到你的情绪频段。接下来我会带你去附近更适合你当下状态的据点。',
    time: '19:08',
  },
  {
    id: 2,
    role: 'user',
    author: '你',
    text: '我今天更想要轻松一点，不想进入太吵的场景。',
    time: '19:09',
  },
  {
    id: 3,
    role: 'ai',
    author: 'Zoopia Guide',
    text: '明白。先从低压氛围切入，再慢慢扩展社交密度。你可以随时暂停匹配。',
    time: '19:10',
  },
]

export const poiList: PointOfInterest[] = [
  {
    id: 'harbor-light',
    name: 'Harbor Light',
    vibe: '夜风电台',
    district: '静安',
    distance: '420m',
    occupancy: '低拥挤',
    note: '适合独处后进入温和对话，音量克制，座位之间保留距离。',
    moods: ['松弛', '安全感', '低刺激'],
    top: '22%',
    left: '65%',
  },
  {
    id: 'glasshouse',
    name: 'Glasshouse',
    vibe: '白噪花房',
    district: '徐汇',
    distance: '700m',
    occupancy: '中等热度',
    note: '植物温室主题，适合第一次见面和短时停留。',
    moods: ['清新', '轻社交', '观察欲'],
    top: '48%',
    left: '32%',
  },
  {
    id: 'midnight-pool',
    name: 'Midnight Pool',
    vibe: '城市水面',
    district: '黄浦',
    distance: '1.1km',
    occupancy: '升温中',
    note: '蓝调灯光与开放吧台，适合愿意主动表达的状态。',
    moods: ['情绪释放', '冒险', '高表达'],
    top: '68%',
    left: '71%',
  },
]

export const matchChat: ChatMessage[] = [
  {
    id: 1,
    role: 'match',
    author: '云野',
    text: '我看到你也被分到 Harbor Light 了，你通常会先观察还是先开口？',
    time: '20:14',
  },
  {
    id: 2,
    role: 'user',
    author: '你',
    text: '先观察一下气氛，如果对方也不排斥安静，我会慢慢接上。',
    time: '20:15',
  },
  {
    id: 3,
    role: 'match',
    author: '云野',
    text: '那很适合我，我也不喜欢强行热场。我们可以先交换今天的情绪天气。',
    time: '20:16',
  },
]

export const reportTopics: string[] = ['夜间散步路线', '城市气味记忆', '最近反复听的歌单', '对亲密边界的理解']

export const matchHistory: MatchRecord[] = [
  {
    id: 'h-01',
    alias: '云野',
    persona: '松屿回声体',
    compatibility: 87,
    lastSeen: '昨天 21:10',
    status: '仍在联系',
    highlight: '共同完成了两次夜行盲盒探索。',
  },
  {
    id: 'h-02',
    alias: '柠昼',
    persona: '柑雾导航员',
    compatibility: 76,
    lastSeen: '4 月 3 日',
    status: '自然归档',
    highlight: '第一次聊天从深夜便利店聊到城市灯牌。',
  },
  {
    id: 'h-03',
    alias: '岚岫',
    persona: '月汐观测者',
    compatibility: 82,
    lastSeen: '3 月 28 日',
    status: '等待再遇',
    highlight: '在水边据点完成了情绪卡片交换。',
  },
]
