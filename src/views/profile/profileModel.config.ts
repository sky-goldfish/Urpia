const PROFILE_MODEL_STORAGE_KEY = 'urpia:selected-model-url'
const PROFILE_NICKNAME_STORAGE_KEY = 'urpia:selected-nickname'
const FALLBACK_MODEL_URL = '/models/profile-avatars/Bella.glb'
const FALLBACK_NICKNAME = '月汐观测者'

export const readStoredProfileModelUrl = () => {
  if (typeof window === 'undefined') {
    return FALLBACK_MODEL_URL
  }

  return window.localStorage.getItem(PROFILE_MODEL_STORAGE_KEY) || FALLBACK_MODEL_URL
}

export const writeStoredProfileModelUrl = (modelUrl: string) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROFILE_MODEL_STORAGE_KEY, modelUrl)
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
