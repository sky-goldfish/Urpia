# 高德地图统一迁移设计

日期：2026-04-08

## 1. 背景

当前项目在多个页面和组件中使用 Mapbox，包括：

- `src/views/explore/ExploreMap.vue`
- `src/components/map/MapContainer.vue`
- `src/views/explore/MapEntry.vue`
- `src/views/explore/Map3DView.vue`
- `src/components/map/Map3DEffects.vue`
- `src/config/mapConfig.ts`
- `package.json`（Mapbox 依赖清理）
- `.env*`（地图环境变量切换）

运行中已出现 Mapbox 403 Forbidden，根因是当前 Mapbox token 对样式/瓦片请求不可用。用户已明确要求：参考 `明日旅途/docs/api/高德` 的接入方式，将项目里所有 Mapbox 相关页面和组件统一迁移到高德地图。

## 2. 目标

本次迁移目标：

1. 将项目中所有运行时 Mapbox 依赖替换为高德 JS API。
2. 保留现有页面的大部分 UI 结构和交互行为。
3. 建立统一的高德接入层，避免在各页面重复加载脚本和配置。
4. 优先保证地图页面可用、可交互、可维护。
5. 3D 相关能力本次先做功能等价降级，不承诺完全视觉等价复刻。

非目标：

- 不在本次迁移中实现高德高级 3D 能力（如完整 Object3D/Loca 视觉特效重建）。
- 不引入服务端代理；先采用文档中说明的前端明文安全密钥模式完成本地开发接入。

## 3. 参考方案来源

参考 `明日旅途/docs/api/高德/JS API 安全密钥使用.md`：

- 在加载高德脚本前设置 `window._AMapSecurityConfig`
- 通过 `https://webapi.amap.com/maps?v=2.0&key=...` 加载 JS API
- 使用 `new AMap.Map(container, options)` 初始化地图

本项目将采用同样的接入思路，但封装为统一加载器供 Vue 组件复用。

## 4. 方案对比

### 方案 A：最小侵入替换

仅在现有组件内部把 Mapbox API 替换成高德 API，尽量不调整结构。

优点：改动范围相对收敛。

缺点：容易保留 Mapbox 时代的抽象包袱，后续维护成本较高。

### 方案 B：统一高德基础层迁移（采用）

新增统一高德加载器与配置层，重写公共地图容器，将所有地图页面切到新基础层。

优点：结构清晰、可维护性最好、能彻底移除 Mapbox 依赖。

缺点：初次改动较大，需要更完整的回归验证。

### 方案 C：页面级分批替换

先替换 `ExploreMap.vue`，其余页面和 3D 逻辑延后。

优点：最快止血。

缺点：会长期形成双栈并存，不符合“统一迁移”的目标。

结论：采用方案 B。

## 5. 架构设计

### 5.1 高德加载器

新增统一加载模块，例如 `src/lib/amapLoader.ts`，负责：

1. 读取环境变量：
   - `VITE_AMAP_KEY`
   - `VITE_AMAP_SECURITY_JS_CODE`
2. 在脚本加载前写入：
   - `window._AMapSecurityConfig = { securityJsCode: ... }`
3. 动态插入高德 JS API `<script>`
4. 通过 Promise 复用加载状态，避免多次注入
5. 对外返回 `AMap` 全局对象

如果缺少 key 或安全密钥，加载器直接抛出明确错误，供页面展示用户可读提示。

### 5.2 地图配置层

重写 `src/config/mapConfig.ts`，从 Mapbox 配置改为高德配置，包含：

- 默认中心点
- 默认缩放级别
- 高德 key / security code
- 地图主题配置（先使用默认普通底图）
- 坐标输入约定（统一使用 `[lng, lat]`）

移除：

- `VITE_MAPBOX_TOKEN`
- Mapbox style URL 概念

同时补充一条迁移约束：当前业务代码与组件对外仍继续使用 `[lng, lat]` 元组，不在页面层引入新的坐标对象结构，避免无关改动扩散。

### 5.3 通用地图容器

重写 `src/components/map/MapContainer.vue` 为高德版，对外接口尽量保持不变：

#### Props

- `center?: [number, number]`
- `zoom?: number`
- `markers?: Array<{ id, position, title?, color?, data? }>`

#### Emits

- `markerClick`
- `mapClick`
- `ready`

#### Expose

- `getMap()`
- `setCenter(center)`
- `setZoom(zoom)`
- `flyTo({ center?, zoom? })`

#### 内部实现映射

- `new mapboxgl.Map(...)` → `new AMap.Map(...)`
- `Marker` → `AMap.Marker` + 自定义 HTML 内容
- `Popup` → 优先用标题提示或简化交互，不强依赖独立弹窗体系
- `flyTo` → `setZoomAndCenter` / `setCenter` / `setZoom`

### 5.4 页面迁移

#### `ExploreMap.vue`

保留现有界面结构：

- 搜索按钮
- 调色盘筛选按钮
- 左上角定位按钮
- POI marker 交互
- TabBar

替换内容：

- Mapbox 地图实例 → 高德地图实例
- Mapbox Marker → 高德 Marker / 自定义 DOM marker
- 原本依赖 `.mapboxgl-*` 的 DOM 查询方式改为组件内部管理 marker 引用

#### `MapEntry.vue`

继续依赖 `MapContainer.vue`，但运行时底层改为高德，无需保留 Mapbox 文案。

#### `Map3DView.vue`

迁移为高德底图 + 2D marker/覆盖物表现，保留主要业务信息展示。

#### `Map3DEffects.vue`

移除对 Mapbox Marker 容器的依赖，改为高德 marker 上挂载 DOM 内容，或在第一阶段直接降级为普通效果点位。

### 5.5 坐标系约束

需要明确处理坐标系差异：

- Mapbox 常见数据流通常按 WGS84 / Web Mercator 使用
- 高德 JS API 在国内底图体系下实际以 GCJ-02 为主

本次迁移设计采用以下约定：

1. 先检查当前项目内已有 POI、中心点、演示 marker 坐标是否已能与国内地图正确对齐。
2. 若现有数据在高德底图上出现系统性偏移，则在统一数据入口增加坐标转换层，而不是在各页面分别修正。
3. 第一阶段优先保证现有静态点位显示正确；如当前样例数据本身已按国内地图坐标维护，则不额外引入转换逻辑。

## 6. 3D 能力降级策略

由于高德 JS API 与 Mapbox 的 3D/自定义标记承载方式不同，本次不做一比一复刻，而采用“功能等价优先”的降级策略：

1. 保留点位、交互、导航入口、视觉分层。
2. 3D 特效先降级为 2D DOM 覆盖物或轻量动画 marker。
3. 若后续需要增强，再单独规划高德 `Loca` 或 `Object3DLayer` 版本。

这样可以保证本次迁移重点落在“彻底替换供应商并恢复可用性”。

## 7. 错误处理与加载状态

统一处理以下异常：

1. 缺少高德 key / security code
2. 高德脚本加载失败
3. 地图实例初始化失败
4. marker 数据为空

地图容器需要提供：

- loading 态
- error 态
- 成功态

错误态文案需能明确提示开发者检查 `.env` 中的高德配置。

## 8. 环境变量与依赖变更

### 新增环境变量

- `VITE_AMAP_KEY`
- `VITE_AMAP_SECURITY_JS_CODE`

如项目存在示例环境文件，也需要同步补充对应字段说明。

### 移除环境变量

- `VITE_MAPBOX_TOKEN`

### 依赖处理

移除 `mapbox-gl` 相关使用；如项目已不再引用，则从 `package.json` 中删除该依赖。

高德 JS API 先通过外部脚本加载，不额外安装 SDK npm 包。

## 9. 验证方案

迁移后需要验证：

1. `/map` 页面可以正常显示高德地图。
2. `MapEntry.vue` 中 marker 能正常渲染与点击。
3. `ExploreMap.vue` 中情绪筛选可正确刷新 marker。
4. 定位按钮、中心点移动、缩放控制可用。
5. `Map3DView.vue` 与 `Map3DEffects.vue` 不再依赖 Mapbox 运行时。
6. 项目源码中不再存在对 `mapbox-gl` 和 `VITE_MAPBOX_TOKEN` 的运行时依赖。
7. 若存在坐标偏移问题，已在统一层处理并验证点位位置正确。
8. 构建通过。

## 10. 实施顺序

1. 新增 AMap 加载器
2. 重写地图配置层
3. 重写通用 `MapContainer.vue`
4. 迁移 `MapEntry.vue`
5. 迁移 `ExploreMap.vue`
6. 迁移 `Map3DView.vue` 和 `Map3DEffects.vue`
7. 清理 Mapbox 残留代码与依赖
8. 运行构建验证

## 11. 风险与应对

### 风险 1：高德 key / security code 未配置

应对：在加载器和 UI 错误态里给出明确提示。

### 风险 2：高德与 Mapbox API 差异导致行为不一致

应对：保持公共组件接口不变，把差异吸收到 `MapContainer.vue` 内部。

### 风险 3：3D 视觉无法等价迁移

应对：本次明确接受降级，以可用为第一优先级。

### 风险 4：坐标系不一致导致点位偏移

应对：优先在统一配置或数据转换层处理，禁止在单个页面写死偏移补丁。

## 12. 验收标准

当满足以下条件时，视为迁移完成：

1. 所有 Mapbox 相关页面和组件已切换到高德。
2. 运行时不再出现 Mapbox 请求。
3. 现有探索地图主流程可正常使用。
4. 项目构建成功。
5. Mapbox 相关配置和主要依赖已清理。