import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getExplorePois, type ExplorePoiViewModel } from '../../data/exploreData'
import { MAP_CONFIG } from '../../config/mapConfig'
import { moodColors, useMoodStore } from '../../stores/moodStore'
import type { ExploreMoodKey } from './exploreMap.config'
import { exploreMoodOptions, explorePoiMetaMap } from './exploreMap.config'

interface ExploreMarker {
  id: string
  position: [number, number]
  title?: string
  color?: string
  data: ExplorePoiViewModel
}

interface MarkerEventPayload {
  id: string
  position: [number, number]
  title?: string
  color?: string
  data?: unknown
}

const fallbackColor = '#8E8E93'
const explorePois = getExplorePois()

export const useExploreMap = () => {
  const router = useRouter()
  const moodStore = useMoodStore()

  const mapRef = ref<{
    flyTo: (options: { center?: [number, number]; zoom?: number }) => void
    centerOnAvatar?: () => void
    setAvatarInput?: (input: { x: number; y: number }) => void
  } | null>(null)
  const searchQuery = ref('')
  const selectedPoiId = ref<string>(explorePois[0]?.id ?? '')
  const showSearch = ref(false)
  const showMatchChat = ref(false)

  const activeMood = computed<ExploreMoodKey | null>(() => {
    const moodId = moodStore.currentMood.id
    return exploreMoodOptions.some((item) => item.key === moodId) ? (moodId as ExploreMoodKey) : null
  })

  const filteredPois = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    return explorePois.filter((poi) => {
      const matchesMood = activeMood.value ? explorePoiMetaMap[poi.id]?.mood === activeMood.value : true
      const matchesQuery = query ? poi.searchIndex.includes(query) : true

      return matchesMood && matchesQuery
    })
  })

  const selectedPoi = computed(() => {
    return filteredPois.value.find((poi) => poi.id === selectedPoiId.value) ?? filteredPois.value[0] ?? null
  })

  const markers = computed<ExploreMarker[]>(() =>
    filteredPois.value.map((poi) => {
      const meta = explorePoiMetaMap[poi.id]
      const moodKey = meta?.mood ?? 'healing'
      const mood = exploreMoodOptions.find((item) => item.key === moodKey)

      return {
        id: poi.id,
        position: meta?.coordinates ?? MAP_CONFIG.DEFAULT_CENTER,
        title: poi.name,
        color: mood?.color ?? fallbackColor,
        data: poi,
      }
    })
  )

  const selectPoi = (poiId: string) => {
    if (!poiId) return
    selectedPoiId.value = poiId
    const marker = markers.value.find((item) => item.id === poiId)
    if (marker) {
      mapRef.value?.flyTo({ center: marker.position, zoom: 15 })
    }
  }

  const handleMarkerClick = (marker: MarkerEventPayload) => {
    selectPoi(marker.id)
  }

  const locateUser = () => {
    if (mapRef.value?.centerOnAvatar) {
      mapRef.value.centerOnAvatar()
      return
    }

    mapRef.value?.flyTo({
      center: MAP_CONFIG.DEFAULT_CENTER,
      zoom: 15,
    })
  }

  const goToPoi = () => {
    if (!selectedPoi.value) return
    void router.push(`/poi/${selectedPoi.value.id}`)
  }

  const openMatchChat = () => {
    showSearch.value = false
    showMatchChat.value = true
  }

  const closeMatchChat = () => {
    showMatchChat.value = false
  }

  const toggleSearch = () => {
    showSearch.value = !showSearch.value
    if (!showSearch.value) {
      searchQuery.value = ''
    }
  }

  const setActiveMood = (moodKey: ExploreMoodKey) => {
    const targetMood = moodColors.find((item) => item.id === moodKey)
    if (targetMood) {
      moodStore.setMood(targetMood)
    }
  }

  watch(
    filteredPois,
    (pois) => {
      if (!pois.length) {
        selectedPoiId.value = ''
        return
      }

      const stillVisible = pois.some((poi) => poi.id === selectedPoiId.value)
      if (!stillVisible) {
        selectedPoiId.value = pois[0]?.id ?? ''
      }
    },
    { immediate: true }
  )

  return {
    mapRef,
    searchQuery,
    selectedPoi,
    filteredPois,
    markers,
    showSearch,
    showMatchChat,
    activeMood,
    moodOptions: exploreMoodOptions,
    setActiveMood,
    toggleSearch,
    handleMarkerClick,
    locateUser,
    selectPoi,
    goToPoi,
    openMatchChat,
    closeMatchChat,
  }
}
