export interface MoodAttribute {
  name: string
  value: number
  color: string
}

export interface PersonaBubbleCard {
  id: 'mood' | 'bio' | 'encounter' | 'collection'
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
    id: 'mood',
    label: '情绪星云',
    icon: 'auto_awesome',
    iconColor: '#6BBFA3',
    chip: '情绪',
    positionClass: 'left-[6%] top-[12%]',
  },
  {
    id: 'bio',
    label: '灵感自白',
    icon: 'edit_note',
    iconColor: '#9B8EC4',
    chip: '自白',
    positionClass: 'right-[6%] top-[12%]',
  },
  {
    id: 'encounter',
    label: '相遇记录',
    icon: 'diversity_3',
    iconColor: '#D4788C',
    chip: '87%',
    positionClass: 'bottom-[16%] left-[6%]',
  },
  {
    id: 'collection',
    label: '盲盒展柜',
    icon: 'redeem',
    iconColor: '#E8A44A',
    chip: '2个',
    positionClass: 'bottom-[16%] right-[6%]',
  },
]
