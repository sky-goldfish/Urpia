// 高德地图类型声明

declare global {
  interface Window {
    AMap?: typeof AMap
  }

  namespace AMap {
    class Map {
      constructor(container: string | HTMLElement, opts?: MapOptions)
      setCenter(center: [number, number] | LngLat): void
      getCenter(): LngLat
      setZoom(zoom: number): void
      getZoom(): number
      setFitView(overlays?: any[]): void
      addControl(control: any): void
      removeControl(control: any): void
      add(overlays: any | any[]): void
      remove(overlays: any | any[]): void
      clearMap(): void
      destroy(): void
      on(event: string, callback: (e: any) => void): void
      off(event: string, callback: (e: any) => void): void
      getContainer(): HTMLElement
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setMap(map: Map | null): void
      setPosition(position: [number, number] | LngLat): void
      getPosition(): LngLat
      setTitle(title: string): void
      setIcon(icon: string | Icon): void
      setAnimation(animation: string): void
      on(event: string, callback: (e: any) => void): void
      off(event: string, callback: (e: any) => void): void
      getExtData(): any
      setExtData(data: any): void
    }

    class LngLat {
      constructor(lng: number, lat: number)
      lng: number
      lat: number
      distance(lnglat: LngLat | [number, number]): number
    }

    class Scale {
      constructor(opts?: any)
    }

    class ToolBar {
      constructor(opts?: any)
    }

    class Geolocation {
      constructor(opts?: any)
    }

    class Icon {
      constructor(opts: {
        size?: Size
        image?: string
        imageSize?: Size
        imageOffset?: Pixel
      })
    }

    class Size {
      constructor(width: number, height: number)
      width: number
      height: number
    }

    class Pixel {
      constructor(x: number, y: number)
      x: number
      y: number
    }

    interface MapOptions {
      center?: [number, number] | LngLat
      zoom?: number
      viewMode?: '2D' | '3D'
      resizeEnable?: boolean
      dragEnable?: boolean
      keyboardEnable?: boolean
      scrollWheel?: boolean
      doubleClickZoom?: boolean
      mapStyle?: string
      showBuildingBlock?: boolean
      showIndoorMap?: boolean
    }

    interface MarkerOptions {
      position?: [number, number] | LngLat
      title?: string
      map?: Map
      icon?: string | Icon
      label?: any
      animation?: string
      extData?: any
    }
  }
}

export {}
