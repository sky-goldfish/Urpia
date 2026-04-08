# 小红书地图社交项目 MVP 设计文档

日期：2026-04-09

## 1. 背景

当前项目已经完成一套可交互的前端原型，主链路包括：

1. Onboarding：拍照引导 → AI 问答 → 分身生成 → Persona 确认
2. Explore：地图浏览 → POI 详情 → 发现入口 → 情绪盲盒揭晓
3. Social：进入 A2A 代聊 → 查看匹配报告
4. Profile：查看当前分身状态与相遇历史

现阶段的问题不是前端页面缺失，而是：

- 大量流程仍为前端 mock
- 没有真实后端
- 没有可运行的小型数据库
- 没有明确的 MVP 边界
- 没有把 P0 / P1 和阶段目标拆清楚

本设计文档的目标是：在尽量复用现有前端原型的前提下，收敛出一个“可运行、可演示、可继续迭代”的 MVP 版本方案，为下一步 implementation plan 提供明确边界。

## 2. 产品目标

MVP 的核心目标不是一次性做完整产品，而是验证以下最小闭环：

1. 用户可以完成 onboarding，生成并保存一个基础 persona
2. 用户可以进入地图浏览附近 POI
3. 用户可以在某个 POI 下触发一次“发现/盲盒/匹配”链路
4. 系统可以基于基础资料和简单规则完成一次匹配
5. 用户可以看到一段可解释的匹配对话结果和报告
6. 所有核心数据可以持久化到一个小数据库中

换句话说，MVP 需要验证的是“地图化人格社交”这个闭环，而不是一次性验证所有 AI、推荐、复杂运营和高并发能力。

## 3. 非目标

以下内容不进入 MVP P0：

- 真正的拍照识别/视觉分析模型
- 真实语音识别服务接入
- 复杂的多轮 LLM Agent 编排
- Redis 抢盲盒并发处理
- MongoDB 非结构化内容体系
- pgvector 向量召回
- PostGIS 复杂空间检索
- 实时 WebSocket 聊天
- 完整的店铺/商家后台
- 完整的审核、风控、举报闭环
- 3D 地图沉浸式效果增强

这些能力保留到 Post-MVP 阶段，不阻塞最小可运行版本上线。

## 4. 方案对比

### 方案 A：纯前端 + 本地 JSON / LocalStorage 演示版

特点：不做真正后端，只把 mock 数据整理得更完整。

优点：最快，成本最低。

缺点：无法满足“可正常运行的前后端以及小数据库”的要求，也无法形成后续可扩展基础。

### 方案 B：轻量单体 MVP（推荐）

特点：保留现有 Vue 前端，新增一个轻量 Node.js API 服务，配一个 SQLite 小数据库；匹配逻辑先用规则引擎 + 模板化 AI 文案替代。

优点：

- 开发成本可控
- 本地运行门槛低
- 数据可持久化
- 结构清晰，容易继续升级到 PostgreSQL / Supabase
- 最适合当前“先收尾、先跑起来”的目标

缺点：

- 技术上不是最终形态
- 地理和向量能力会先做降级实现

### 方案 C：直接上 Supabase / PostgreSQL 云端 MVP

特点：直接按长期架构搭建云数据库与服务能力。

优点：离正式产品更近，后续迁移成本低。

缺点：

- 初期配置复杂度更高
- 对本地开发、环境变量、权限策略要求更高
- 现在会把大量时间消耗在基础设施而不是 MVP 验证上

### 结论

采用 **方案 B：轻量单体 MVP**。

原因：它最符合当前阶段目标——尽快把现有原型收敛为一个“真正能跑通”的产品闭环，同时保留未来升级路径。

## 5. MVP 总体架构

MVP 采用三层结构：

### 5.1 前端层

- 继续使用当前 Vue 3 + TypeScript + Vue Router + Vite
- 尽量保留现有页面结构和视觉稿
- 把现有 mock 状态替换成 API 调用

### 5.2 后端层

新增轻量 API 服务，建议技术栈：

- Node.js
- TypeScript
- Express 或 Fastify（二选一，优先 Express 以降低实现复杂度）
- Prisma 或 Drizzle ORM（二选一，优先 Prisma 以提高开发效率）

后端职责：

1. 接收 onboarding 输入并生成 persona
2. 提供用户、POI、盲盒、匹配、报告数据接口
3. 执行基础匹配规则
4. 保存所有关键流程数据

### 5.3 数据层

小数据库采用 **SQLite**。

原因：

- 本地零门槛
- 不需要额外部署数据库服务
- 足够承载 MVP 数据规模
- 后续可以较平滑迁移到 PostgreSQL

## 6. MVP 用户流程设计

### 6.1 主闭环

用户最核心的 P0 流程如下：

1. 进入 `/onboarding/camera`
2. 跳转到 `/onboarding/chat` 完成基础问答
3. 后端根据问答结果生成一个基础 persona 草案
4. `/onboarding/generating` 展示生成中间态
5. `/onboarding/confirm` 确认昵称和头像后创建用户档案
6. 进入 `/map` 查看附近 POI
7. 点击某个 POI 进入 `/poi/:id`
8. 进入 `/discovery` / `/reveal` 获得一个情绪盲盒或社交入口
9. 进入 `/match` 发起一次匹配
10. 后端根据规则返回一个匹配对象、三轮代聊内容和结果摘要
11. 进入 `/report` 查看匹配报告
12. `/profile` 和 `/history` 可查看 persona 与历史结果

### 6.2 Onboarding 流程降级策略

MVP 中不做真实 AI 识图与重模型推理，而采用以下降级：

- 拍照页只作为引导，不做真实图像识别
- 聊天页收集结构化信息：昵称倾向、MBTI 倾向、兴趣标签、社交偏好
- persona 生成由后端规则模板完成
- 头像继续使用本地素材轮换或预置头像池

这样既保留当前产品体验，也能快速形成真实可存储的数据闭环。

### 6.3 匹配流程降级策略

MVP 中 A2A 三级漏斗先做简化版：

1. 同城 / 同地图池筛选
2. 标签与 MBTI 的简单相似度打分
3. 模板化代聊文案生成

生成结果包含：

- 匹配对象昵称/分身形象
- 匹配分数
- 三轮代聊片段
- 推荐理由
- 是否建议线下继续交流

## 7. 页面与后端映射

### 7.1 Onboarding 模块

涉及页面：

- `src/views/onboarding/CameraGuide.vue`
- `src/views/onboarding/AiGuideChat.vue`
- `src/views/onboarding/Generating.vue`
- `src/views/onboarding/ConfirmPersona.vue`

后端能力：

- `POST /api/onboarding/session`
- `POST /api/onboarding/chat`
- `POST /api/personas/confirm`

说明：

- 前端聊天不再只依赖本地 mock follow-ups
- 后端返回下一问、提取出的结构化字段、以及当前 persona 草案
- 最终确认时落库 user + persona

### 7.2 Explore 模块

涉及页面：

- `src/views/explore/ExploreMap.vue`
- `src/views/explore/PoiInfo.vue`
- `src/views/explore/DiscoveryPoint.vue`
- `src/views/explore/ItemReveal.vue`

后端能力：

- `GET /api/pois`
- `GET /api/pois/:id`
- `POST /api/discovery/reveal`

说明：

- 地图上的 POI 列表从数据库读取
- reveal 行为不只是前端随机，而是后端根据用户当前状态返回一个结果

### 7.3 Social 模块

涉及页面：

- `src/views/social/SocialPage.vue`
- `src/views/social/SocialMatchChat.vue`
- `src/views/social/MatchReport.vue`

后端能力：

- `POST /api/matches`
- `GET /api/matches/:id`
- `GET /api/matches/:id/report`

说明：

- SocialMatchChat 页面从后端拿到完整三轮代聊数据
- MatchReport 页面从后端拿到匹配分数和推荐理由

### 7.4 Profile 模块

涉及页面：

- `src/views/profile/PersonaStatus.vue`
- `src/views/profile/MatchHistory.vue`

后端能力：

- `GET /api/me`
- `GET /api/me/history`

说明：

- P0 只展示最核心的 persona 信息和历史匹配记录
- 复杂状态泡泡、收藏、深层统计可下放到 P1

## 8. MVP 数据模型

MVP 数据表遵循“够用就好”，不一开始照搬最终 Supabase 大设计。

### 8.1 `users`

用于保存基础用户信息。

核心字段：

- `id`
- `nickname`
- `avatar_url`
- `mbti`
- `bio`
- `created_at`
- `updated_at`

### 8.2 `personas`

用于保存用户分身画像。

核心字段：

- `id`
- `user_id`
- `tone`
- `social_style`
- `mood_tags`（JSON）
- `interest_tags`（JSON）
- `opening_script`
- `summary`

### 8.3 `onboarding_sessions`

用于记录 onboarding 过程。

核心字段：

- `id`
- `user_temp_id`
- `messages_json`
- `extracted_profile_json`
- `status`
- `created_at`

### 8.4 `pois`

用于地图 POI 数据。

核心字段：

- `id`
- `name`
- `category`
- `description`
- `lng`
- `lat`
- `mood_tags`（JSON）
- `status`

### 8.5 `discoveries`

用于记录一次盲盒/发现结果。

核心字段：

- `id`
- `user_id`
- `poi_id`
- `reveal_type`
- `reveal_title`
- `reveal_payload_json`
- `created_at`

### 8.6 `matches`

用于记录一次匹配。

核心字段：

- `id`
- `user_id`
- `target_profile_name`
- `target_avatar_url`
- `score`
- `status`
- `reason_summary`
- `chat_rounds_json`
- `report_json`
- `created_at`

### 8.7 为什么不在 MVP 就拆更多表

像 `emotion_records`、`interest_vectors`、`interaction_logs` 这些更细粒度的表，在长期架构上合理，但当前会明显增加实现成本。

MVP 应优先保证：

- 可创建用户
- 可保存 persona
- 可读取 POI
- 可生成 discovery
- 可创建 match
- 可展示 report

如果提前把表拆得过细，反而会拖慢落地速度。

## 9. API 设计

### 9.1 Onboarding API

#### `POST /api/onboarding/session`

用途：创建 onboarding 会话。

返回：

- `sessionId`
- 初始问题
- 默认 persona 草案

#### `POST /api/onboarding/chat`

用途：提交一轮回答并获取下一轮问题。

请求示例：

```json
{
  "sessionId": "session_001",
  "message": "我更喜欢安静一点的咖啡馆",
  "inputMode": "text"
}
```

返回示例：

```json
{
  "reply": "那如果遇到陌生人，你会希望谁先开口？",
  "progress": 3,
  "personaDraft": {
    "mbti": "INFP",
    "socialStyle": "慢热型",
    "interestTags": ["咖啡", "散步", "展览"]
  },
  "done": false
}
```

#### `POST /api/personas/confirm`

用途：确认昵称、头像与 persona，正式创建用户。

### 9.2 POI API

#### `GET /api/pois`

用途：返回地图所需 POI 列表。

支持参数：

- `lng`
- `lat`
- `mood`
- `limit`

#### `GET /api/pois/:id`

用途：返回 POI 详情。

### 9.3 Discovery API

#### `POST /api/discovery/reveal`

用途：在某个 POI 下生成一次发现结果。

返回内容：

- reveal 类型
- 展示文案
- 下一步 CTA（继续匹配 / 返回地图）

### 9.4 Match API

#### `POST /api/matches`

用途：基于当前用户和 discovery 结果创建一次匹配。

后端最小逻辑：

1. 选出候选模板角色或伪用户池
2. 按标签和 MBTI 算分
3. 生成三轮聊天文本
4. 生成报告摘要

#### `GET /api/matches/:id`

用途：获取匹配聊天详情。

#### `GET /api/matches/:id/report`

用途：获取匹配报告。

### 9.5 Profile API

#### `GET /api/me`

用途：获取当前用户 persona 状态。

#### `GET /api/me/history`

用途：获取历史匹配记录。

## 10. 匹配规则设计

MVP 不使用真正的 LLM 编排和向量召回，而使用一个可解释的打分规则。

建议评分组成：

1. MBTI 兼容度：0-30 分
2. 兴趣标签重合度：0-30 分
3. 社交节奏匹配度：0-20 分
4. POI 情绪标签匹配度：0-20 分

总分 100。

评分区间建议：

- 80-100：命中注定的相遇
- 60-79：有趣的灵魂
- 0-59：也许下次会更好

这与当前 `MatchReport.vue` 的展示逻辑天然兼容，前端改造成本最低。

## 11. 错误处理

MVP 需要覆盖以下基础错误：

1. onboarding 会话不存在
2. persona 确认时昵称为空
3. POI 不存在
4. discovery 创建失败
5. match 创建失败
6. 查询 history 时用户不存在

错误处理原则：

- 前端展示友好提示
- 后端统一返回结构化错误
- 不暴露技术细节到用户界面

建议错误返回格式：

```json
{
  "error": {
    "code": "POI_NOT_FOUND",
    "message": "当前地点不存在或已下线"
  }
}
```

## 12. 阶段划分

### Phase 0：设计与收敛阶段

目标：把范围收住，保证不会在实现阶段继续发散。

#### P0

- 明确 MVP 主闭环
- 明确页面保留与降级策略
- 明确后端边界
- 明确数据库最小模型
- 明确 API 边界

#### P1

- 补充长期版 Supabase / PostGIS / pgvector 演进路线
- 补充推荐算法升级路线
- 补充商家/运营后台想象空间

### Phase 1：可运行 MVP 基础版

目标：前后端 + SQLite 首次跑通。

#### P0

- 搭建后端服务
- 接通 SQLite
- 建立 users / personas / pois / discoveries / matches 基础表
- 接通 onboarding API
- 接通 POI 列表与详情 API
- 接通 discovery API
- 接通 match API
- 接通 profile/history API
- 前端改为真实请求
- 本地可完整跑通主链路

#### P1

- 增加简单鉴权
- 增加更多 seed 数据
- 增加更真实的假用户池
- 增加接口日志与调试面板

### Phase 2：MVP 体验增强版

目标：让产品从“能跑”升级到“更像产品”。

#### P0

- 优化 onboarding 结构化问题设计
- 优化匹配评分与报告可解释性
- 增强 reveal 类型多样性
- 优化 profile 页面信息结构

#### P1

- 支持简单登录体系
- 支持用户多次进入地图与重复匹配
- 支持收藏或再次联系入口
- 支持更完整的历史记录筛选

### Phase 3：Post-MVP 长期版

目标：往真实可上线产品演进。

#### P0

- SQLite 迁移到 PostgreSQL / Supabase
- 引入 PostGIS 做真实地理筛选
- 引入 pgvector 做兴趣向量召回
- 接入真实 LLM 生成代聊与报告

#### P1

- Redis 并发处理盲盒活动
- 内容审核与风控
- 商家 POI 发布与后台
- 实时消息与通知
- 多城市扩展与运营配置

## 13. 页面 P0 / P1 归类

### P0 必保留页面

- `/onboarding/camera`
- `/onboarding/chat`
- `/onboarding/generating`
- `/onboarding/confirm`
- `/map`
- `/poi/:id`
- `/reveal`（可合并 discovery）
- `/match`
- `/report`
- `/profile`

### P1 可降级或延后页面

- `/discovery`（可并入 reveal）
- `/history`
- `/map-entry`
- `/map-3d`
- `/poi/:id/indoor`
- `effects/SpiritBubbleDemo.vue`

## 14. 技术落地建议

### 14.1 推荐目录结构

建议新增：

- `server/`
  - `src/index.ts`
  - `src/routes/`
  - `src/services/`
  - `src/lib/`
  - `prisma/` 或 `db/`

前端新增：

- `src/lib/api.ts`
- `src/stores/session.ts`
- `src/types/api.ts`

### 14.2 Seed 数据

MVP 需要提供初始 seed：

- 10-20 个 POI
- 8-12 个伪用户模板
- 3-5 类 reveal 类型

这样才能保证 demo 时每条主链路都能稳定返回结果。

## 15. 验证标准

当满足以下条件时，视为 MVP 设计目标成立：

1. 本地启动前端和后端后，用户可以完成 onboarding 并创建 persona
2. `/map` 页面展示来自数据库的 POI
3. 用户能从 POI 进入 reveal 并发起 match
4. 系统能返回真实持久化的 match 记录
5. `/report` 可以展示后端返回的分数与理由
6. `/profile` 与 `/history` 至少可以读取当前用户和匹配历史
7. 数据全部来自真实 API 与 SQLite，而不是仅前端 mock

## 16. 风险与应对

### 风险 1：需求过大导致实现发散

应对：严格按 P0 范围推进，所有 Supabase / 向量 / Redis / 审核能力全部后移。

### 风险 2：当前前端页面过于依赖 mock 数据

应对：优先抽离统一 API 层和类型层，逐页替换，不做全面重写。

### 风险 3：没有真实候选用户，匹配效果太假

应对：先建立“伪用户模板池 + 规则打分 + 模板文案”机制，保证 demo 稳定性。

### 风险 4：后续迁移到 PostgreSQL 时返工

应对：数据库结构尽量保持关系型思维，JSON 字段只用在少数弹性内容上，避免 SQLite 特有写法扩散。

## 17. 最终结论

本项目的正确收尾方式，不是继续堆前端 mock，也不是一步跳到完整云架构，而是：

1. 以当前页面原型为基础保留用户体验
2. 用轻量 Node.js + SQLite 补上真实后端与数据库
3. 把 onboarding → map → reveal → match → report 跑成真正的主闭环
4. 把复杂 AI / 地理 / 向量 / 并发能力后移到 Post-MVP

这条路径能在最短时间内把项目从“原型”推进到“可运行的 MVP 产品”，同时给后续正式版本保留清晰升级路线。