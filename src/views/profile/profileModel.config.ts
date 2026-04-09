const PROFILE_MODEL_STORAGE_KEY = 'urpia:selected-model-url'
const PROFILE_NICKNAME_STORAGE_KEY = 'urpia:selected-nickname'
const PROFILE_AVATAR_STORAGE_KEY = 'urpia:selected-avatar-url'
const PROFILE_USER_ID_STORAGE_KEY = 'urpia:user-id'
const FALLBACK_MODEL_URL = '/models/profile-avatars/Bella.glb'
const FALLBACK_NICKNAME = '月汐观测者'
const FALLBACK_AVATAR_URL = '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg'

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

export const readStoredProfileAvatarUrl = () => {
  if (typeof window === 'undefined') {
    return FALLBACK_AVATAR_URL
  }

  return window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY) || FALLBACK_AVATAR_URL
}

export const writeStoredProfileAvatarUrl = (avatarUrl: string) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROFILE_AVATAR_STORAGE_KEY, avatarUrl)
}

export const readStoredProfileUserId = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(PROFILE_USER_ID_STORAGE_KEY) || ''
}

export const writeStoredProfileUserId = (userId: string) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROFILE_USER_ID_STORAGE_KEY, userId)
}

export const defaultProfileModelUrl = readStoredProfileModelUrl()
