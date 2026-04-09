export interface MoodAttribute {
  name: string
  value: number
  color: string
}

export interface PersonaBubbleCard {
  id: 'footprint' | 'mood' | 'memory' | 'social'
  label: string
  icon: string
  iconColor: string
  chip: string
  positionClass: string
}

export const personaMoodAttrs: MoodAttribute[] = [
  { name: '治愈', value: 80, color: '#6BBFA3' },
  { name: '浪漫', value: 60, color: '#D4788C' },
  { name: '创意', value: 40, color: '#9B8EC4' },
  { name: '活力', value: 50, color: '#E8A44A' },
  { name: '社交', value: 30, color: '#D49A5A' },
  { name: '温馨', value: 55, color: '#B89A80' },
]

export const personaBubbleCards: PersonaBubbleCard[] = [
  {
    id: 'footprint',
    label: '足迹',
    icon: 'explore',
    iconColor: '#E8A44A',
    chip: '12处',
    positionClass: 'left-[6%] top-[12%]',
  },
  {
    id: 'mood',
    label: '情绪',
    icon: 'sentiment_calm',
    iconColor: '#6BBFA3',
    chip: '情绪',
    positionClass: 'left-[32%] top-[12%]',
  },
  {
    id: 'memory',
    label: '记忆',
    icon: 'history',
    iconColor: '#9B8EC4',
    chip: '7段',
    positionClass: 'right-[32%] top-[12%]',
  },
  {
    id: 'social',
    label: '社交',
    icon: 'forum',
    iconColor: '#D4788C',
    chip: '3位',
    positionClass: 'right-[6%] top-[12%]',
  },
]
