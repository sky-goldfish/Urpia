<script setup lang="ts">
import { onMounted } from 'vue'

interface Props {
  poiId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'progress', value: number): void
  (e: 'complete'): void
}>()

// 美术资产路径配置
const ASSET_PATHS = {
  textures: `/assets/poi/${props.poiId}/textures/`,
  models: `/assets/poi/${props.poiId}/models/`,
  audio: `/assets/poi/${props.poiId}/audio/`,
  data: `/assets/poi/${props.poiId}/data/`
}

// 预加载资产列表（将来从JSON配置文件读取）
const getAssetList = async (): Promise<string[]> => {
  // 模拟资产列表
  return [
    `${ASSET_PATHS.textures}floor_diffuse.jpg`,
    `${ASSET_PATHS.textures}wall_normal.jpg`,
    `${ASSET_PATHS.textures}ceiling_roughness.jpg`,
    `${ASSET_PATHS.models}room_main.glb`,
    `${ASSET_PATHS.models}furniture_set.glb`,
    `${ASSET_PATHS.audio}ambient.mp3`,
    `${ASSET_PATHS.data}hotspots.json`,
    `${ASSET_PATHS.data}navigation.json`
  ]
}

// 预加载单个资产
const preloadAsset = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const extension = url.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'jpg':
      case 'png':
      case 'webp':
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = url
        break
        
      case 'glb':
      case 'gltf':
        // 3D模型预加载（使用fetch获取）
        fetch(url, { method: 'HEAD' })
          .then(() => resolve())
          .catch(reject)
        break
        
      case 'mp3':
      case 'ogg':
        const audio = new Audio()
        audio.oncanplaythrough = () => resolve()
        audio.onerror = reject
        audio.src = url
        audio.load()
        break
        
      case 'json':
        fetch(url)
          .then(() => resolve())
          .catch(reject)
        break
        
      default:
        resolve()
    }
  })
}

// 批量预加载资产
const preloadAllAssets = async () => {
  try {
    const assets = await getAssetList()
    const total = assets.length
    let loaded = 0
    
    // 并行加载所有资产
    const loadPromises = assets.map(async (asset) => {
      try {
        await preloadAsset(asset)
        loaded++
        const progress = (loaded / total) * 100
        emit('progress', progress)
      } catch (error) {
        console.warn(`资产加载失败: ${asset}`, error)
        loaded++
        // 即使失败也继续计算进度
        const progress = (loaded / total) * 100
        emit('progress', progress)
      }
    })
    
    await Promise.all(loadPromises)
    emit('complete')
  } catch (error) {
    console.error('资产预加载失败:', error)
    // 即使失败也完成加载
    emit('progress', 100)
    emit('complete')
  }
}

onMounted(() => {
  void preloadAllAssets()
})
</script>

<template>
  <!-- 这是一个逻辑组件，不渲染任何UI -->
  <div style="display: none;"></div>
</template>
