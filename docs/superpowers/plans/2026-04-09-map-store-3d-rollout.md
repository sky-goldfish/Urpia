# Map Store 3D Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前 `Urpia` 地图页中落地“门店 3D 外饰落点 + 靠近进入 + 室内固定视角游览”的双档店家方案，并统一接入你已经提供好的经纬度坐标与 3D 素材。

**Architecture:** 以静态配置驱动门店系统：把门店元数据、经纬度、素材路径、店家档位全部固化到一个 `storeCatalog` 中；地图页只负责渲染外饰/招牌、检测玩家与门店距离并触发“进入”；室内页只消费选中门店的 `interiorModelUrl`，用固定视角加载独立 3D 空间。坐标直接使用你提供的表，不再引入高德逆地理编码。

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia, Mapbox GL JS, Three.js, GLTFLoader, DRACOLoader

---

## 1. 现状结论

当前项目里，相关素材和能力已经具备一半：

- 地图页已有可移动小人：
  - [`ExploreMap.vue`](D:/CodeWorkSpace/xiaohongshu/src/views/explore/ExploreMap.vue)
  - [`MapContainer.vue`](D:/CodeWorkSpace/xiaohongshu/src/components/map/MapContainer.vue)
- 室内页路由已经存在：
  - [`router/index.ts`](D:/CodeWorkSpace/xiaohongshu/src/router/index.ts)
  - 路径：`/poi/:id/indoor`
- 室内场景页已有壳子，但还是占位数据：
  - [`POIIndoorView.vue`](D:/CodeWorkSpace/xiaohongshu/src/views/poi/indoor/POIIndoorView.vue)
  - [`IndoorScene.vue`](D:/CodeWorkSpace/xiaohongshu/src/views/poi/indoor/components/IndoorScene.vue)
  - [`poiStore.ts`](D:/CodeWorkSpace/xiaohongshu/src/stores/poiStore.ts)
- 已经整理好的正式素材目录在：
  - [`public/models/store-signboards`](D:/CodeWorkSpace/xiaohongshu/public/models/store-signboards)
  - [`public/models/store-scenes`](D:/CodeWorkSpace/xiaohongshu/public/models/store-scenes)
- 原始补充素材仍躺在：
  - [`src/board`](D:/CodeWorkSpace/xiaohongshu/src/board)
  - [`src/board补充`](D:/CodeWorkSpace/xiaohongshu/src/board补充)

结论：

- 外饰/招牌资源已经基本够做地图落点。
- 室内页已经有路由和壳子，但还没接真实门店模型。
- 你已经提供经纬度，因此这次方案不需要高德 API。

---

## 2. 业务规则定稿

### 2.1 店家分两档

**普通店家**

- 只在地图上展示 `board` / `signboard` 类型 3D 招牌。
- 用户靠近时不弹“进入”按钮。
- 点击后只进入 POI 详情或保持纯展示，不进入室内。

**高等级店家**

- 地图上展示 `exterior` 或高质量 `board` 外饰。
- 当玩家靠近到阈值范围内时，页面显示“进入”按钮。
- 点击“进入”后进入对应门店室内页。
- 室内页加载该门店 `interior` 3D 模型。
- 室内视角固定角度，不给自由旋转相机；允许用户在空间中游览。

### 2.2 本期不再使用高德逆地理编码

本期坐标来源统一为你给的经纬度表，所有门店直接静态录入配置：

- 不新增“根据地址反查经纬度”逻辑
- 不引入额外 geocoding API
- 所有 `POI ID` 先作为备用字段存档，不作为地图渲染依赖

---

## 3. 素材落位规范

### 3.1 目标目录

地图门店 3D 素材统一以 `public/models` 为最终运行目录，避免从 `src` 直接加载二进制 3D 文件：

- 招牌 / 外饰：
  - [`public/models/store-signboards`](D:/CodeWorkSpace/xiaohongshu/public/models/store-signboards)
- 室内 / 独立空间：
  - [`public/models/store-scenes`](D:/CodeWorkSpace/xiaohongshu/public/models/store-scenes)

### 3.2 原始素材目录处理原则

这两个目录仅保留为“待整理原始素材区”，不作为运行时读取来源：

- [`src/board`](D:/CodeWorkSpace/xiaohongshu/src/board)
- [`src/board补充`](D:/CodeWorkSpace/xiaohongshu/src/board补充)

执行时应当：

1. 把新增可用 `.glb` 从 `src/board` / `src/board补充` 迁移到 `public/models/store-signboards`
2. 清理 `__MACOSX`、`._*`、重复副本
3. 统一命名成英文 kebab-case
4. 在配置里只引用 `public/models/...` 路径

### 3.3 已有可直接引用的正式外饰/招牌素材

当前已经能直接用于地图外饰落点的文件包括：

- `seven-eleven-board.glb`
- `peets-board.glb`
- `wagas-board.glb`
- `lefit-fitness-board.glb`
- `sushiexpress-board.glb`
- `coucou-hotpot-board.glb`
- `jixiang-wonton-board.glb`
- `heytea-board.glb`
- `naixue-board.glb`
- `xiaomi-board.glb`
- `zuotingyouyuan-board.glb`
- `muji-board.glb`
- `starbucks-board.glb`
- `pop-mart-board.glb`
- `luckin-coffee-board.glb`
- `hema-mr-board.glb`
- `saizeriya-board.glb`
- `blue-frog-exterior.glb`
- `mixue-board.glb`
- `mcdonalds-exterior.glb`
- `gaga-board.glb`
- `coooon-board.glb`
- `golao-guan-board.glb`
- `island-bookstore-board.glb`
- `yer-shari-board.glb`

### 3.4 已有可直接引用的正式室内素材

当前已经能直接作为“高等级店家室内空间”的文件包括：

- `seven-eleven-interior.glb`
- `hema-mr-interior.glb`
- `mcdonalds-interior.glb`
- `naixue-interior.glb`
- `gym-interior.glb`
- `gym-alt-interior.glb`
- `badminton-court-interior.glb`
- `kfc-interior.glb`

补充说明：

- `blue-frog-exterior.glb` 目前只有外饰，没有对应室内，可先归为“外饰已就绪、室内待补”。
- `hema-exterior.glb`、`kfc-exterior.glb` 也可作为高等级店家的专用外饰候选，但需看是否与你这次门店名单一一对应。

---

## 4. 门店配置方案

### 4.1 新增统一门店配置文件

新增：

- `src/config/storeCatalog.ts`

职责：

- 定义所有地图门店
- 记录经纬度
- 记录门店档位
- 记录外饰 / 室内模型路径
- 标记门店是否支持进入

建议类型：

```ts
export type StoreTier = 'standard' | 'premium'

export interface StoreCatalogItem {
  id: string
  name: string
  address: string
  coordinates: [number, number]
  poiId?: string
  tier: StoreTier
  signboardModelUrl: string
  exteriorModelUrl?: string
  interiorModelUrl?: string
  canEnter: boolean
  fixedIndoorCamera?: {
    position: [number, number, number]
    target: [number, number, number]
  }
}
```

### 4.2 本期门店分级建议

**优先落地为高等级店家（有室内可进）**

- `seven-eleven`
- `hema`
- `mcdonalds`
- `naixue`
- `lefit-fitness`

这些店至少已有一套可映射的室内模型，能完整跑通：

- 地图外饰
- 靠近进入
- 室内场景加载

**其余门店先落为普通店家**

- 只展示招牌 / 外饰
- 不进入室内
- 等后续拿到完整 interior 再升级为 premium

### 4.3 坐标来源

全部直接采用你提供的表，包含：

- 主表 20 家
- 补充表 5 家
- 缺失坐标补全表 2 家

即本期门店总量按 **27 家** 配置。

---

## 5. 地图页落地方案

### 5.1 渲染方式

当前地图页已有小人移动系统，门店不建议全部接入 `Mapbox CustomLayer`，本期采用更稳的双层策略：

**普通店家**

- 使用 `mapboxgl.Marker` 挂载 DOM 容器
- 再通过 `Teleport` 或独立 Vue 挂载把 3D 招牌渲染进去
- 这样便于快速批量落点

**高等级店家**

- 仍用同样的地图落点方式
- 但在配置里优先用 `exteriorModelUrl`
- 若无专门 exterior，则退回 `signboardModelUrl`

### 5.2 新增地图门店层模块

新增：

- `src/components/map/StoreModelMarker.vue`
- `src/components/map/useStoreMarkers.ts`

职责：

- 读取 `storeCatalog`
- 为每个门店生成地图 marker
- 根据配置选择外饰或招牌模型
- 统一控制缩放、朝向、点击区域

### 5.3 玩家靠近逻辑

改造：

- [`MapContainer.vue`](D:/CodeWorkSpace/xiaohongshu/src/components/map/MapContainer.vue)
- [`ExploreMap.vue`](D:/CodeWorkSpace/xiaohongshu/src/views/explore/ExploreMap.vue)

新增逻辑：

- 地图中的玩家位置已存在
- 每帧计算玩家与所有 `premium` 门店的直线距离
- 当距离小于阈值时：
  - 记录 `nearestEnterableStore`
  - 显示“进入”按钮

建议阈值：

- `18m ~ 24m`

建议首版固定为：

```ts
const ENTER_DISTANCE_METERS = 20
```

### 5.4 地图 UI 规则

地图页最终保留：

- 左上角标题
- 右上角定位按钮
- 左下角摇杆
- 靠近高等级门店时显示“进入”按钮
- 地图上的门店外饰 / 招牌模型
- 玩家角色

不恢复此前已删掉的：

- 搜索
- 情绪按钮
- 场景卡片
- 黑色“开始社交”

---

## 6. 室内页落地方案

### 6.1 室内数据来源改造

当前 [`poiStore.ts`](D:/CodeWorkSpace/xiaohongshu/src/stores/poiStore.ts) 还是模拟数据，必须改成读取 `storeCatalog`。

改造后：

- `getPOIInfo(id)` 从 `storeCatalog` 找门店
- `getPOIIndoorData(id)` 返回真实门店室内模型路径和固定视角配置

### 6.2 室内场景实现

改造：

- [`IndoorScene.vue`](D:/CodeWorkSpace/xiaohongshu/src/views/poi/indoor/components/IndoorScene.vue)

替换当前占位实现，改成：

- 使用 `Three.js + GLTFLoader + DRACOLoader`
- 加载 `interiorModelUrl`
- 相机使用固定角度
- 用户使用简单前后/左右移动或点击导航点游览
- 不开放自由旋转镜头

### 6.3 固定视角规则

每个高等级门店都在配置中定义一套固定视角：

```ts
fixedIndoorCamera: {
  position: [x, y, z],
  target: [x, y, z]
}
```

首版允许：

- 同一类空间共用一个默认视角模板
- 只有明显镜头不对时再为单店覆盖

### 6.4 室内页进入条件

只有满足以下条件时才能进入：

1. 当前门店 `tier === 'premium'`
2. `canEnter === true`
3. `interiorModelUrl` 存在

否则：

- 地图页不显示“进入”按钮
- 或按钮禁用并给出“即将开放”文案

---

## 7. 文件落地清单

### 新增文件

- `src/config/storeCatalog.ts`
  - 门店总表，包含 27 家门店坐标和模型路径
- `src/config/storeAssetAliases.ts`
  - 原始中文素材名到规范英文文件名的映射
- `src/components/map/StoreModelMarker.vue`
  - 单个门店地图模型容器
- `src/components/map/useStoreMarkers.ts`
  - 批量挂载门店 marker 的组合逻辑
- `src/views/poi/indoor/config/indoorCameraPresets.ts`
  - 室内固定视角模板

### 重点修改文件

- [`ExploreMap.vue`](D:/CodeWorkSpace/xiaohongshu/src/views/explore/ExploreMap.vue)
  - 加入门店模型层和“进入”按钮
- [`MapContainer.vue`](D:/CodeWorkSpace/xiaohongshu/src/components/map/MapContainer.vue)
  - 暴露玩家坐标 / 最近门店检测所需接口
- [`poiStore.ts`](D:/CodeWorkSpace/xiaohongshu/src/stores/poiStore.ts)
  - 改成真实门店配置驱动
- [`POIIndoorView.vue`](D:/CodeWorkSpace/xiaohongshu/src/views/poi/indoor/POIIndoorView.vue)
  - 读取真实门店室内数据
- [`IndoorScene.vue`](D:/CodeWorkSpace/xiaohongshu/src/views/poi/indoor/components/IndoorScene.vue)
  - 从占位画布切成真实室内 3D 场景

---

## 8. 分阶段实施顺序

### Phase A：资产整理

目标：

- 让所有运行时需要的 `.glb` 都只从 `public/models/...` 读取

产出：

- 清理 `src/board` / `src/board补充`
- 新增缺失英文命名映射
- 完成 `storeCatalog` 里所有模型路径

### Phase B：地图外饰落点

目标：

- 27 家门店全部在地图上有对应落点

产出：

- 普通门店显示 `signboard`
- 高等级门店显示 `exterior` 或高质量 `signboard`
- 点击门店可选中

### Phase C：靠近进入

目标：

- 玩家靠近高等级门店时弹“进入”

产出：

- 距离检测
- 进入按钮
- 路由跳转 `poi/:id/indoor`

### Phase D：室内空间

目标：

- 至少 4~5 家高等级门店可进入真实室内

产出：

- 固定视角室内页
- 真实 interior 模型加载
- 室内简单游览

---

## 9. 首批高等级店家建议名单

首批建议只做这 5 家完整链路，优先保证可用性：

1. 7-ELEVEn(中兴通讯大厦店)
2. 盒马鲜生(长泰广场店)
3. 麦当劳(浦东张江中兴智慧园)
4. 奈雪的茶(浦东软件园店)
5. 乐刻运动健身(万科翡翠公园店)

原因：

- 已有可映射 exterior / board
- 已有可用 interior 或可用通用室内模板
- 能覆盖便利店、零售、餐饮、健身四类空间

其余先作为普通店家铺满地图，形成密度。

---

## 10. 风险与规避

### 风险 1：并不是每家高等级店都有完整 exterior + interior

规避：

- `premium` 只先启用首批 5 家
- 其余先以 `standard` 落地图

### 风险 2：不同模型尺寸与朝向不统一

规避：

- 在 `storeCatalog` 中允许为每个门店单独配置：
  - `scale`
  - `rotationY`
  - `offset`

### 风险 3：地图同时加载过多 3D 门店模型导致卡顿

规避：

- 首屏只加载视口附近门店
- 远距离门店退化成简化 marker 或不渲染模型
- 高等级店优先保真，普通店家允许低配

### 风险 4：室内自由视角太复杂

规避：

- 首版只做固定镜头 + 简单位移
- 不做完整第一人称/第三人称自由相机

---

## 11. 执行结论

这项需求的最短落地路径不是“一次性把 27 家门店全部做成可进入 3D 商店”，而是：

1. 先把 **27 家全部落到地图**
2. 再把 **5 家高等级门店打通完整的进入室内**
3. 最后把剩余普通门店逐步升级为高等级门店

这样可以最快得到一个可展示、可行走、可进入的版本，同时不被素材完整度卡住。

---

## 12. 本次计划的明确假设

- 经纬度全部以你本条消息中的表为准
- 本期不接高德 API
- 门店分类以“是否已有可用 interior”为第一优先条件
- `src/board`、`src/board补充` 不作为运行时目录，只作为原始素材来源

