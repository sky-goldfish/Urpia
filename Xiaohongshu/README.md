# Xiaohongshu

基于 Vue 3 + TypeScript + Vite 构建的小红书风格项目。

## 项目结构

```
Xiaohongshu/
├── data/
│   └── xhs/jsonl/              # 数据文件目录
│       └── *.jsonl             # 各地区店铺、公共空间等数据
├── docs/
│   └── superpowers/            # 项目文档
│       ├── plans/              # 项目计划
│       └── specs/              # 设计规范
├── public/
│   ├── avatars/                # 头像图片资源
│   └── favicon.svg             # 网站图标
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css        # 全局样式
│   ├── components/
│   │   └── ui/
│   │       └── TabBar.vue      # 底部导航栏组件
│   ├── lib/
│   │   └── mockData.ts         # 模拟数据
│   ├── router/
│   │   └── index.ts            # 路由配置
│   ├── views/
│   │   ├── explore/            # 探索页面
│   │   │   ├── DiscoveryPoint.vue
│   │   │   ├── ExploreMap.vue
│   │   │   ├── ItemReveal.vue
│   │   │   └── PoiInfo.vue
│   │   ├── onboarding/         # 引导页面
│   │   │   ├── AiGuideChat.vue
│   │   │   ├── CameraGuide.vue
│   │   │   ├── ConfirmPersona.vue
│   │   │   └── Generating.vue
│   │   ├── profile/            # 个人资料页面
│   │   │   ├── MatchHistory.vue
│   │   │   └── PersonaStatus.vue
│   │   └── social/             # 社交页面
│   │       ├── MatchReport.vue
│   │       ├── SocialMatchChat.vue
│   │       └── SocialPage.vue
│   ├── App.vue                 # 根组件
│   ├── main.ts                 # 入口文件
│   └── vite-env.d.ts           # Vite 类型声明
├── index.html                  # HTML 入口
├── package.json                # 项目依赖和脚本
├── tsconfig.json               # TypeScript 配置
└── vite.config.ts              # Vite 构建配置
```

## 功能模块

- **探索 (Explore)** - 地图探索、兴趣点信息展示
- **引导 (Onboarding)** - AI 引导聊天、相机引导、人设确认
- **社交 (Social)** - 匹配聊天、匹配报告
- **个人资料 (Profile)** - 匹配历史、人设状态

## 技术栈

- Vue 3
- TypeScript
- Vite
- Mapbox GL JS (3D地图)
- Pinia (状态管理)

## POI室内场景系统

### 功能概述
3D地图探索界面支持点击POI地点进入室内场景页面，提供沉浸式的室内浏览体验。

### 路由设计

| 路由路径 | 名称 | 说明 |
|---------|------|------|
| `/homemap` | homemap | 3D地图主页 |
| `/poi/:id/indoor` | poi-indoor | POI室内场景页面 |

### 文件结构

```
src/
├── views/
│   ├── explore/
│   │   └── Map3DView.vue           # 3D地图主页面
│   └── poi/
│       └── indoor/
│           ├── POIIndoorView.vue   # 室内场景主页面
│           └── components/
│               ├── IndoorScene.vue     # 3D场景渲染
│               ├── IndoorNavigation.vue # 室内导航UI
│               └── AssetPreloader.vue   # 资产预加载
├── stores/
│   └── poiStore.ts                 # POI数据管理
└── router/
    └── index.ts                    # 路由配置
```

### 美术资产文件夹结构

```
public/assets/poi/{poi-id}/
├── textures/          # 贴图文件
│   ├── floor_diffuse.jpg
│   ├── wall_normal.jpg
│   └── ceiling_roughness.jpg
├── models/            # 3D模型
│   ├── room_main.glb
│   └── furniture_set.glb
├── audio/             # 音频文件
│   └── ambient.mp3
└── data/              # 配置文件
    ├── hotspots.json
    └── navigation.json
```

### 使用方式

1. **在3D地图中点击POI胶囊** - 自动跳转到对应室内场景
2. **浏览器前进/后退** - 支持原生导航历史记录
3. **室内页面返回** - 点击"返回地图"按钮或浏览器返回键

### 页面特性

- **加载过渡**: 进度条 + 旋转动画
- **场景淡入**: 资源加载完成后平滑显示
- **交互热点**: 支持点击室内交互点
- **响应式设计**: 适配不同屏幕尺寸


# 生产物料

## 颜色：
情绪维度
颜色
HEX
适合场景
🔥 energy (活力)
活力橙
#FF8C42
热门地标、美食街
🌿 healing (治愈)
薄荷绿
#2DD4A8
公园、咖啡馆
🌸 romantic (浪漫)
浪漫粉
#FF6B9D
约会餐厅、酒吧
💡 creative (创意)
电光紫
#8B5CF6
艺术空间
🍻 social (社交)
暖琥珀
#F59E0B
多人聚会场所
☕ cozy (舒适)
奶茶金
#FBBF24
安静小店

