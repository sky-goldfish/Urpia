import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 情绪颜色配置接口
export interface MoodColor {
  id: string
  name: string
  emoji: string
  color: string
  hex: string
  scene: string
}

// 情绪颜色数据
export const moodColors: MoodColor[] = [
  {
    id: 'energy',
    name: '活力',
    emoji: '🔥',
    color: '活力橙',
    hex: '#FF8C42',
    scene: '热门地标、美食街'
  },
  {
    id: 'healing',
    name: '治愈',
    emoji: '🌿',
    color: '薄荷绿',
    hex: '#2DD4A8',
    scene: '公园、咖啡馆'
  },
  {
    id: 'romantic',
    name: '浪漫',
    emoji: '🌸',
    color: '浪漫粉',
    hex: '#FF6B9D',
    scene: '约会餐厅、酒吧'
  },
  {
    id: 'creative',
    name: '创意',
    emoji: '💡',
    color: '电光紫',
    hex: '#8B5CF6',
    scene: '艺术空间'
  },
  {
    id: 'social',
    name: '社交',
    emoji: '🍻',
    color: '暖琥珀',
    hex: '#F59E0B',
    scene: '多人聚会场所'
  },
  {
    id: 'cozy',
    name: '舒适',
    emoji: '☕',
    color: '奶茶金',
    hex: '#FBBF24',
    scene: '安静小店'
  }
]

export const useMoodStore = defineStore('mood', () => {
  // 当前选中的情绪
  const fallbackMood: MoodColor = {
    id: 'default',
    name: '默认',
    emoji: '✨',
    color: '默认蓝',
    hex: '#3B82F6',
    scene: '默认场景',
  }
  const currentMood = ref<MoodColor>(moodColors[0] ?? fallbackMood)
  
  // 选择器是否展开
  const isSelectorOpen = ref(false)
  
  // 获取所有情绪颜色
  const allMoods = computed(() => moodColors)
  
  // 设置当前情绪
  const setMood = (mood: MoodColor) => {
    currentMood.value = mood
    // 可以在这里添加其他副作用，如更新地图主题、胶囊颜色等
    console.log('切换到情绪:', mood.name, mood.hex)
  }
  
  // 根据ID设置情绪
  const setMoodById = (id: string) => {
    const mood = moodColors.find(m => m.id === id)
    if (mood) {
      setMood(mood)
    }
  }
  
  // 切换选择器展开状态
  const toggleSelector = () => {
    isSelectorOpen.value = !isSelectorOpen.value
  }
  
  // 打开选择器
  const openSelector = () => {
    isSelectorOpen.value = true
  }
  
  // 关闭选择器
  const closeSelector = () => {
    isSelectorOpen.value = false
  }
  
  return {
    currentMood,
    isSelectorOpen,
    allMoods,
    setMood,
    setMoodById,
    toggleSelector,
    openSelector,
    closeSelector
  }
})
