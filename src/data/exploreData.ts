import { poiList } from '../lib/mockData'

export interface ExplorePoiViewModel {
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
  summaryLine: string
  searchIndex: string
}

const mapExplorePoi = (poi: (typeof poiList)[number]): ExplorePoiViewModel => ({
  ...poi,
  moods: [...poi.moods],
  summaryLine: `${poi.district} · ${poi.distance} · ${poi.occupancy}`,
  searchIndex: [poi.name, poi.vibe, poi.district, ...poi.moods].join(' ').toLowerCase(),
})

export const getExplorePois = (): ExplorePoiViewModel[] => poiList.map(mapExplorePoi)

export const getExplorePoiById = (poiId: string): ExplorePoiViewModel | null => {
  const pois = getExplorePois()
  return pois.find((poi) => poi.id === poiId) ?? pois[0] ?? null
}
