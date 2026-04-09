import type { PointOfInterest } from '../../lib/mockData'

export type ExploreMoodKey = 'healing' | 'energy' | 'romantic' | 'creative' | 'social' | 'cozy'

export interface ExploreMoodOption {
  key: ExploreMoodKey
  label: string
  color: string
}

export interface ExplorePoiMeta {
  coordinates: [number, number]
  mood: ExploreMoodKey
}

export const exploreMoodOptions: ExploreMoodOption[] = [
  { key: 'healing', label: '治愈', color: '#6BBFA3' },
  { key: 'energy', label: '活力', color: '#E8A44A' },
  { key: 'romantic', label: '浪漫', color: '#D4788C' },
  { key: 'creative', label: '创意', color: '#9B8EC4' },
  { key: 'social', label: '社交', color: '#D49A5A' },
  { key: 'cozy', label: '温馨', color: '#B89A80' },
]

export const explorePoiMetaMap: Record<PointOfInterest['id'], ExplorePoiMeta> = {
  'harbor-light': {
    coordinates: [121.4489, 31.2295],
    mood: 'healing',
  },
  glasshouse: {
    coordinates: [121.4375, 31.1889],
    mood: 'creative',
  },
  'midnight-pool': {
    coordinates: [121.491, 31.2345],
    mood: 'romantic',
  },
}
