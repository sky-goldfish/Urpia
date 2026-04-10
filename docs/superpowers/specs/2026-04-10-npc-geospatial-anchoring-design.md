## 背景

当前 `src/components/map/MapContainer.vue` 中，玩家本人已经从 overlay 屏幕投影方案迁移到 Mapbox custom layer + `MercatorCoordinate.fromLngLat()` 的地理锚定方案，因此玩家模型在地图缩放、旋转、倾斜时能够稳定贴合真实经纬度。

但 NPC 仍然沿用 overlay 渲染链路：

- 3D 模型通过 `map.project(character.position)` 转换为屏幕坐标后绘制到独立的 Three overlay scene
- 头顶头像通过绝对定位 DOM 元素配合 `transform: translate(...)` 放置到屏幕位置
- NPC 缩放还依赖 `zoomScale`

这导致 NPC 在地图缩放、旋转、倾斜时出现视觉漂移，无法和真实地理位置稳定对齐。

## 目标

将 NPC 的 3D 模型和头顶头像都迁移为地理锚定方案，使其在地图交互过程中稳定固定在经纬度位置上。

本次改造目标包括：

1. NPC 3D 模型从 overlay 迁移为 Mapbox custom layer 渲染
2. NPC 头顶头像从屏幕绝对定位迁移为真实 `mapboxgl.Marker`
3. 保留现有 NPC 路径巡逻、转向、动作切换能力
4. 在 `style.load`、组件卸载等生命周期中正确重建和清理 NPC 资源

非目标：

- 不重构玩家 avatar 链路
- 不重构商店 3D layer 架构
- 不拆分 `MapContainer.vue` 为多个文件
- 不引入新的 NPC 行为系统

## 方案选型

### 方案 A：每个 NPC 一个 custom layer

优点：结构直观、单体容易理解。

缺点：Mapbox layer 数量随 NPC 数量增长，生命周期和性能管理更碎，不适合当前多 NPC 场景。

### 方案 B：单一 NPC custom layer 管理全部 NPC（推荐）

优点：

- 所有 NPC 共用一个 Three scene / camera / renderer
- 与现有 `storeLayer` 的集中式模式一致
- 更适合后续增加 NPC 数量和状态
- `style.load` 重建、资源销毁和动画更新更集中

缺点：实现复杂度略高于每 NPC 一个 layer。

### 方案 C：继续使用 overlay，仅修正投影/缩放

不推荐。根因是整条 NPC 渲染链路本质上仍基于屏幕投影，而不是地理锚定。即使修正缩放公式，也无法根治在旋转、倾斜和缩放场景中的漂移问题。

## 最终设计

### 1. 新增 NPC custom layer

在 `MapContainer.vue` 中新增 `NpcLayer` 和 `NpcRenderRecord` 结构。

`NpcRenderRecord` 保存单个 NPC 的渲染状态，包括：

- `id`
- `position`
- `modelUrl`
- `root`
- `modelRoot`
- `rootBone`
- `rootBoneInitialPosition`
- `mixer`
- `actions`
- `activeAction`
- `state`
- `targetYaw`
- `currentYaw`
- `mercator x/y/z`
- `mercatorScale`
- `loading`

`NpcLayer` 负责：

- 建立和销毁 Three scene / camera / renderer
- 加载 NPC GLB 模型
- 过滤 `Root.position` 和 `Root.quaternion`，避免 root motion 把模型从经纬度锚点上带走
- 根据 NPC 经纬度刷新 Mercator 坐标和米制缩放
- 在 `render()` 中更新动画、平滑插值 yaw、为每个 NPC 生成变换矩阵并绘制

### 2. NPC 头像改为 Mapbox marker

每个 NPC 头像改为真实 `mapboxgl.Marker`：

- marker 元素仍复用当前圆形头像视觉样式
- `anchor: 'bottom'`
- 使用固定 `offset` 让头像位于 NPC 模型头顶附近
- 通过 `setLngLat(actor.position)` 同步经纬度

这样头像不再依赖 `map.project()` 和绝对定位 DOM 计算。

### 3. 业务状态与渲染状态分离

保留现有 `NpcActor[]` 作为业务层状态，继续负责：

- 路径点
- 当前目标点
- 速度
- 往返/循环逻辑
- 当前经纬度

新增的 `NpcLayer` 和 `npcMarkers` 只负责渲染层状态。

数据流如下：

1. `buildNpcActors()` 生成 NPC 路线和初始位置
2. `syncNpcActors()` 基于 `npcActors` 同步渲染记录和头像 marker
3. `updateNpcActors(dt)` 推进经纬度和朝向
4. 将结果同步到 `npcLayer` 与 `npcMarkers`
5. `npcLayer.render()` 用 Mercator 坐标绘制模型

### 4. 同步接口设计

`NpcLayer` 对外暴露以下能力：

- `syncActors(actors)`：创建、更新、删除 NPC 渲染记录
- `updateActorPosition(id, lngLat)`：更新单个 NPC 位置并刷新 Mercator 坐标
- `setActorTargetYaw(id, yaw)`：设置目标朝向
- `setActorState(id, state)`：设置动作状态
- `disposeActors()`：销毁所有 NPC 资源

组件层同时维护 `Map<string, MapboxMarkerLike>` 形式的 `npcMarkers`，用于：

- 新 NPC 创建头像 marker
- NPC 位置更新时同步 marker
- NPC 删除时 remove marker

### 5. 生命周期设计

#### `style.load`

样式重载时：

1. 移除旧的 `storeLayer`、`playerAvatarLayer`、`npcLayer`
2. 重新创建并添加 `storeLayer`
3. 重新创建并添加 `playerAvatarLayer`
4. 重新创建并添加 `npcLayer`
5. 重新同步 `npcActors` 和 `npcMarkers`
6. 启动主循环

原因是 Mapbox style reload 后 custom layer 必须重新 add。

#### `onUnmounted`

组件销毁时：

- 停止动画循环
- remove 玩家 marker
- remove NPC markers
- remove 玩家 layer
- remove NPC layer
- 释放 NPC Three 资源、loader、mixer、geometry、material
- 清空业务层和渲染层记录

### 6. 旧 overlay NPC 逻辑收敛

以下逻辑将不再为 NPC 服务：

- `OverlayCharacter`
- `ensureOverlayCharacter()`
- `updateOverlayCharacterPosition()`
- `setOverlayCharacterTargetYaw()`
- `setOverlayCharacterState()`
- `renderOverlayScene()` 中的 NPC 分支

本次改造会删除或停用 NPC 对这些接口的依赖，但不会回退玩家到 overlay。

如果 overlay 场景在改造完成后不再承担任何实际职责，可继续做最小化收敛；若仍有残余用途，则保留最小必要代码，避免引入无关风险。

## 关键实现细节

### 朝向

沿用当前角度计算方式：

- 移动方向先换算为米制方向向量
- yaw 使用 `Math.atan2(dx, -dz) - Math.PI / 2`
- 在渲染阶段对 `currentYaw` 向 `targetYaw` 做平滑插值

### 动画

保留当前 NPC 以 `walk` 为主的状态机，并兼容 `idle` / `run`。

动画处理规则：

- 优先从 `Walk` / `Run` / `Idle` 名称匹配
- 若命名不标准，则回退到现有索引顺序策略
- 切换动作时使用 fade in / fade out

### 缩放

NPC 与玩家一样使用：

- `MercatorCoordinate.fromLngLat(position, altitude)`
- `meterInMercatorCoordinateUnits()`

保证模型在不同 zoom 下保持与真实地理空间一致的尺寸关系，而不是依赖 overlay 的经验缩放公式。

## 错误处理

- 单个 NPC 模型加载失败：记录错误日志，其他 NPC 正常渲染
- 构建 NPC 路线所需门店坐标缺失：沿用当前降级策略，跳过 NPC 构建并输出 warning
- style.load 期间 layer 缺失：做存在性检查后再 remove/add
- marker 或 layer 不存在时更新：安全跳过，不抛异常

## 验证计划

实现完成后执行以下验证：

1. 缩放地图时，NPC 模型与头像都稳定固定在同一经纬度点
2. 旋转地图时，NPC 模型与头像仍然对齐
3. 倾斜地图时，NPC 模型不再相对地表漂移
4. NPC 继续沿既有巡逻路径平滑移动
5. `style.load` 重建后 NPC 仍可正常显示和移动
6. 运行最小构建或 type check，确认无 TypeScript 错误

## 风险与缓解

### 风险 1：多 NPC 共用单层后，单个模型加载失败影响整体

缓解：按 record 独立加载和容错，失败仅影响当前 NPC。

### 风险 2：style reload 后 marker 与 layer 状态不一致

缓解：统一通过 `syncNpcActors()` 在 layer 创建后重建 marker 与记录。

### 风险 3：旧 overlay 清理不彻底导致重复渲染

缓解：改造时明确移除 NPC 对 overlay API 的所有调用，并检查循环中不再执行 NPC overlay 定位逻辑。

## 实施范围

主要修改文件：

- `src/components/map/MapContainer.vue`

设计文档文件：

- `docs/superpowers/specs/2026-04-10-npc-geospatial-anchoring-design.md`