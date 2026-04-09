import { MAP_CONFIG, assertMapConfig } from '../config/mapConfig'

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode: string
    }
    AMap?: unknown
  }
}

let amapLoaderPromise: Promise<unknown> | null = null

const AMAP_LOAD_ERROR = 'Failed to load AMap JS API.'
const AMAP_UNAVAILABLE_ERROR = 'AMap JS API loaded but window.AMap is unavailable.'

const resetLoaderState = (script?: HTMLScriptElement | null) => {
  amapLoaderPromise = null
  script?.remove()
}

const resolveExistingScript = (
  script: HTMLScriptElement,
  resolve: (value: unknown) => void,
  reject: (reason?: unknown) => void,
) => {
  if (window.AMap) {
    script.dataset.amapLoaded = 'true'
    resolve(window.AMap)
    return
  }

  resetLoaderState(script)
  reject(new Error(AMAP_UNAVAILABLE_ERROR))
}

export const loadAMap = (): Promise<unknown> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('AMap can only be loaded in the browser environment.'))
  }

  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }

  if (amapLoaderPromise) {
    return amapLoaderPromise
  }

  assertMapConfig()

  window._AMapSecurityConfig = {
    securityJsCode: MAP_CONFIG.AMAP_SECURITY_JS_CODE,
  }

  amapLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-amap-loader=true]')

    if (existingScript) {
      const existingScriptState = (existingScript as HTMLScriptElement & { readyState?: string }).readyState

      if (existingScript.dataset.amapLoaded === 'true' || existingScriptState === 'loaded' || existingScriptState === 'complete') {
        resolveExistingScript(existingScript, resolve, reject)
        return
      }

      existingScript.addEventListener('load', () => {
        existingScript.dataset.amapLoaded = 'true'
        resolveExistingScript(existingScript, resolve, reject)
      }, { once: true })
      existingScript.addEventListener('error', () => {
        resetLoaderState(existingScript)
        reject(new Error(AMAP_LOAD_ERROR))
      }, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(MAP_CONFIG.AMAP_KEY)}`
    script.async = true
    script.defer = true
    script.dataset.amapLoader = 'true'

    script.onload = () => {
      script.dataset.amapLoaded = 'true'

      if (window.AMap) {
        resolve(window.AMap)
        return
      }

      resetLoaderState(script)
      reject(new Error(AMAP_UNAVAILABLE_ERROR))
    }

    script.onerror = () => {
      resetLoaderState(script)
      reject(new Error(AMAP_LOAD_ERROR))
    }

    document.head.appendChild(script)
  })

  return amapLoaderPromise
}

