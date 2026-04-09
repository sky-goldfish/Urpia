const PROFILE_MODEL_STORAGE_KEY = 'urpia:selected-model-url'
const PROFILE_NICKNAME_STORAGE_KEY = 'urpia:selected-nickname'
const FALLBACK_MODEL_URL = '/models/profile-avatars/girl-01.glb'
const FALLBACK_NICKNAME = '月汐观测者'
const FALLBACK_AVATAR_IMAGE_URL = '/avatars/girl-01.jpg'

const legacyModelUrlMap: Record<string, string> = {
  '/models/profile-avatars/Bella.glb': '/models/profile-avatars/girl-01.glb',
  '/models/profile-avatars/Stella.glb': '/models/profile-avatars/girl-02.glb',
  '/models/profile-avatars/Zoe.glb': '/models/profile-avatars/girl-03.glb',
  '/models/profile-avatars/Luna.glb': '/models/profile-avatars/girl-04.glb',
  '/models/profile-avatars/Mia.glb': '/models/profile-avatars/girl-05.glb',
  '/models/profile-avatars/Finn.glb': '/models/profile-avatars/boy-01.glb',
  '/models/profile-avatars/Owen.glb': '/models/profile-avatars/boy-02.glb',
  '/models/profile-avatars/Sam.glb': '/models/profile-avatars/boy-03.glb',
  '/models/profile-avatars/Noah.glb': '/models/profile-avatars/boy-04.glb',
  '/models/profile-avatars/Leo.glb': '/models/profile-avatars/boy-05.glb',
}

const modelPreviewImageMap: Record<string, string> = {
  '/models/profile-avatars/girl-01.glb': '/avatars/girl-01.jpg',
  '/models/profile-avatars/girl-02.glb': '/avatars/girl-02.jpg',
  '/models/profile-avatars/girl-03.glb': '/avatars/girl-03.jpg',
  '/models/profile-avatars/girl-04.glb': '/avatars/girl-04.jpg',
  '/models/profile-avatars/girl-05.glb': '/avatars/girl-05.jpg',
  '/models/profile-avatars/boy-01.glb': '/avatars/boy-01.jpg',
  '/models/profile-avatars/boy-02.glb': '/avatars/boy-02.jpg',
  '/models/profile-avatars/boy-03.glb': '/avatars/boy-03.jpg',
  '/models/profile-avatars/boy-04.glb': '/avatars/boy-04.jpg',
  '/models/profile-avatars/boy-05.glb': '/avatars/boy-05.jpg',
}

const normalizeModelUrl = (modelUrl: string | null) => {
  if (!modelUrl) {
    return FALLBACK_MODEL_URL
  }

  return legacyModelUrlMap[modelUrl] || modelUrl
}

export const readStoredProfileModelUrl = () => {
  if (typeof window === 'undefined') {
    return FALLBACK_MODEL_URL
  }

  const normalized = normalizeModelUrl(window.localStorage.getItem(PROFILE_MODEL_STORAGE_KEY))
  window.localStorage.setItem(PROFILE_MODEL_STORAGE_KEY, normalized)
  return normalized
}

export const readStoredProfileAvatarImageUrl = () => {
  const modelUrl = readStoredProfileModelUrl()
  return modelPreviewImageMap[modelUrl] || FALLBACK_AVATAR_IMAGE_URL
}

export const writeStoredProfileModelUrl = (modelUrl: string) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROFILE_MODEL_STORAGE_KEY, normalizeModelUrl(modelUrl))
}

export const readStoredProfileNickname = () => {
  if (typeof window === 'undefined') {
    return FALLBACK_NICKNAME
  }

  return window.localStorage.getItem(PROFILE_NICKNAME_STORAGE_KEY) || FALLBACK_NICKNAME
}

export const writeStoredProfileNickname = (nickname: string) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROFILE_NICKNAME_STORAGE_KEY, nickname)
}

export const defaultProfileModelUrl = readStoredProfileModelUrl()
