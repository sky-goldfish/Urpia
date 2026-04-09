declare global {
  interface Window {
    AMap?: AMapGlobal
    _AMapSecurityConfig?: {
      securityJsCode?: string
      serviceHost?: string
    }
  }
}

export interface AMapMarkerLike {
  setMap: (map: AMapMapLike | null) => void
  setPosition?: (position: [number, number]) => void
  on?: (event: string, handler: (...args: any[]) => void) => void
  off?: (event: string, handler: (...args: any[]) => void) => void
}

export interface AMapMapLike {
  destroy: () => void
  on: (event: string, handler: (...args: any[]) => void) => void
  off?: (event: string, handler: (...args: any[]) => void) => void
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setZoomAndCenter?: (zoom: number, center: [number, number]) => void
  getCenter?: () => { lng: number; lat: number }
  getZoom?: () => number
  plugin?: (plugins: string | string[], callback: () => void) => void
  addControl?: (control: unknown) => void
}

export interface AMapGlobal {
  Map: new (container: string | HTMLElement, options?: Record<string, any>) => AMapMapLike
  Marker: new (options?: Record<string, any>) => AMapMarkerLike
  Pixel?: new (x: number, y: number) => unknown
  Icon?: new (options?: Record<string, any>) => unknown
  ToolBar?: new (options?: Record<string, any>) => unknown
}

let amapPromise: Promise<AMapGlobal> | null = null

const AMAP_SCRIPT_ID = 'amap-jsapi'

const getRequiredEnv = (name: 'VITE_AMAP_KEY' | 'VITE_AMAP_SECURITY_JS_CODE') => {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required AMap environment variable: ${name}`)
  }
  return value
}

export const loadAMap = async (): Promise<AMapGlobal> => {
  if (typeof window === 'undefined') {
    throw new Error('AMap can only be loaded in the browser.')
  }

  if (window.AMap) {
    return window.AMap
  }

  if (amapPromise) {
    return amapPromise
  }

  amapPromise = new Promise<AMapGlobal>((resolve, reject) => {
    try {
      const key = getRequiredEnv('VITE_AMAP_KEY')
      const securityJsCode = getRequiredEnv('VITE_AMAP_SECURITY_JS_CODE')

      window._AMapSecurityConfig = { securityJsCode }

      const existingScript = document.getElementById(AMAP_SCRIPT_ID) as HTMLScriptElement | null
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (window.AMap) {
            resolve(window.AMap)
            return
          }
          reject(new Error('AMap script loaded but window.AMap is unavailable'))
        })
        existingScript.addEventListener('error', () => {
          reject(new Error('Failed to load AMap script'))
        })
        return
      }

      const script = document.createElement('script')
      script.id = AMAP_SCRIPT_ID
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
      script.async = true
      script.onload = () => {
        if (window.AMap) {
          resolve(window.AMap)
          return
        }

        reject(new Error('AMap script loaded but window.AMap is unavailable'))
      }
      script.onerror = () => {
        reject(new Error('Failed to load AMap script'))
      }

      document.head.appendChild(script)
    } catch (error) {
      reject(error)
    }
  }).catch((error) => {
    amapPromise = null
    throw error
  })

  return amapPromise
}
