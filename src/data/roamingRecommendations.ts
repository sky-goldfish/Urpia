import { storeCatalog, type StoreCatalogItem } from '../config/storeCatalog'

export interface LongTermMemorySnapshot {
  notes: string[]
  preferredVibes: string[]
  socialIntent: string
}

export interface RoamingSoulRecommendation {
  id: string
  name: string
  matchRate: string
  tagline: string
  reason: string
  habits: string[]
  accent: string
  avatar: string
}

export interface RoamingStoreRecommendation {
  id: string
  storeId: string
  title: string
  matchReason: string
  memoryHook: string
  badge: string
  accent: string
}

export interface RoamingRecommendationBundle {
  memory: LongTermMemorySnapshot
  soul: RoamingSoulRecommendation
  stores: Array<RoamingStoreRecommendation & { store: StoreCatalogItem }>
}

interface RecommendationScenario {
  id: string
  matchKeywords: string[]
  memory: LongTermMemorySnapshot
  soul: RoamingSoulRecommendation
  stores: RoamingStoreRecommendation[]
}

const recommendationScenarios: RecommendationScenario[] = [
  {
    id: 'mild-food',
    matchKeywords: ['不辣', '清淡', '养胃', '怕辣'],
    memory: {
      notes: ['备注了“不辣”', '偏好低刺激餐食', '喜欢边吃边慢慢聊天'],
      preferredVibes: ['温和', '清爽', '适合初次见面'],
      socialIntent: '先从轻压力的饭搭子开始建立熟悉感',
    },
    soul: {
      id: 'linxi',
      name: '林汐',
      matchRate: '91%',
      tagline: '也会先问一句“这家会不会太辣？”',
      reason: '她的长期偏好里也有“清淡、不催促、适合慢聊”的记录，适合先从一起吃饭开始认识。',
      habits: ['会主动记口味', '偏爱温和小店', '聊天节奏慢'],
      accent: '#6BBFA3',
      avatar: '👧',
    },
    stores: [
      {
        id: 'yer-shari-mild',
        storeId: 'yer-shari-dongfang',
        title: '不辣友好餐厅',
        matchReason: '偏新疆风味，选择空间更大，适合避开重辣口味。',
        memoryHook: '根据你的“不辣”备注，优先推荐可选清淡菜式的门店。',
        badge: '口味匹配',
        accent: '#6BBFA3',
      },
      {
        id: 'wagas-light',
        storeId: 'wagas-huizhi',
        title: '轻食慢聊点',
        matchReason: '整体更轻盈，适合第一次见面时把聊天压力降下来。',
        memoryHook: '你的长期记忆里有“慢慢靠近”的偏好，这类店更稳妥。',
        badge: '轻社交',
        accent: '#9B8EC4',
      },
    ],
  },
  {
    id: 'coffee-social',
    matchKeywords: ['咖啡', '安静', '慢聊', '独处'],
    memory: {
      notes: ['常去咖啡馆', '喜欢不吵的地方', '更容易在共同停留中建立连接'],
      preferredVibes: ['安静', '有陪伴感', '适合夜晚'],
      socialIntent: '先在熟悉场景里遇见新的其他人',
    },
    soul: {
      id: 'manyou',
      name: '慢慢',
      matchRate: '87%',
      tagline: '比起热场，更擅长接住安静。',
      reason: '她也偏爱安静咖啡馆和夜间散步，适合从轻声开场的关系进入。',
      habits: ['喜欢窗边位置', '能接受沉默', '会记住你爱点的饮品'],
      accent: '#9B8EC4',
      avatar: '👧',
    },
    stores: [
      {
        id: 'peets-night',
        storeId: 'peets-changtai',
        title: '夜间咖啡据点',
        matchReason: '适合把第一次见面放在熟悉的咖啡馆语境里。',
        memoryHook: '系统识别到你常在咖啡馆停留较久，因此优先推荐此类场景。',
        badge: '熟悉场域',
        accent: '#9B8EC4',
      },
      {
        id: 'guwu-quiet',
        storeId: 'guwu-pending',
        title: '安静晚餐备选',
        matchReason: '如果想把咖啡续成一顿饭，这类小店会更自然。',
        memoryHook: '你偏好“先不太热闹”，这里适合从并肩用餐开始。',
        badge: '安静值高',
        accent: '#B89A80',
      },
    ],
  },
]

const defaultScenario = recommendationScenarios[0]!

const matchScenario = (memoryNotes: string[]) => {
  const normalized = memoryNotes.join(' ').toLowerCase()

  return recommendationScenarios.find((scenario) =>
    scenario.matchKeywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  ) ?? recommendationScenarios[1] ?? defaultScenario
}

export const getMockRoamingRecommendations = (memoryNotes: string[] = ['不辣', '喜欢安静一点', '想慢慢认识新的人']): RoamingRecommendationBundle => {
  const scenario = matchScenario(memoryNotes) ?? defaultScenario

  return {
    memory: {
      ...scenario.memory,
      notes: [...new Set([...memoryNotes, ...scenario.memory.notes])],
    },
    soul: scenario.soul,
    stores: scenario.stores
      .map((item) => {
        const store = storeCatalog.find(candidate => candidate.id === item.storeId)
        if (!store) {
          return null
        }

        return {
          ...item,
          store,
        }
      })
      .filter((item): item is RoamingRecommendationBundle['stores'][number] => Boolean(item)),
  }
}
