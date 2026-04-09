# Profile 陪伴型 Agent 与长期记忆设计文档

日期：2026-04-09

## 1. 背景

当前项目的 `profile` 页面已经具备较强的角色感：用户能看到一个 3D 分身，并围绕足迹、情绪、记忆、社交四个气泡查看状态信息。但这些内容目前仍以模拟数据为主，缺少一个真正“会陪伴、会提问、会记住用户”的后端系统支撑。

本设计文档的目标是：在当前 Vue + Express + Prisma + SQLite 的 MVP 架构下，为 `profile` 页面增加一个陪伴型主动式 Agent，并将 `onboarding/chat` 一并纳入同一套“先记录、后异步提炼画像”的处理链路。两类会话都会在后台无感地将问答内容整理成长期记忆候选，用于提取用户的性格、兴趣爱好和人格画像。

## 2. 目标

本功能的 P0 目标如下：

1. 用户进入 `/profile` 页面后，系统可在页面内延迟触发一次主动提问
2. 用户可以通过按钮语音进行回答
3. 后端通过 ASR、LLM、TTS 完成一轮完整语音问答
4. 系统将用户输入与 Agent 回复持久化到 SQLite
5. `onboarding/chat` 中固定问题改为流式输出，支持语音或文本输入
6. `onboarding/chat` 与 `profile-agent` 一样，先记录内容，再异步整理长期记忆
7. 后台异步整理长期记忆，并从中提取用户的性格、兴趣和人格画像
8. `profile` 页面顶部“记忆”按钮读取的是 AI 整理后的结果，而不是原始聊天记录

## 3. 非目标

以下内容不进入本阶段：

- 持续开麦、后台常驻监听
- 唤醒词识别
- 原生 App 级语音助手能力
- WebSocket 全双工语音流
- 多模态图像或视频理解
- 复杂情绪治疗或心理咨询能力
- 将地图、匹配事件直接写入长期记忆库

本阶段只聚焦于两类问答来源：

- `profile` 页面内的陪伴式短会话
- `onboarding/chat` 页面内的引导式固定问题问答

## 4. 产品定位

该 Agent 的定位不是客服、任务助手或心理咨询师，而是：

- 熟悉用户情绪、记忆与人格的陪伴型分身
- 会在合适的时机主动开口
- 更重视理解和接住用户，而不是高密度追问
- 偶尔提出轻量建议，但不以指令式语气主导对话

## 5. 交互范围与触发策略

### 5.1 交互方式

第一版采用按钮式语音交互，不做常开唤醒。

支持两种输入方式：

1. 点击按钮开始录音，再点击结束
2. 按住说话，松手发送

同时保留文本输入兜底接口，但前端主交互以语音为主。

### 5.2 主动触发规则

第一版仅在 `/profile` 页面内触发主动提问，触发条件如下：

1. 用户进入 `/profile`
2. 页面静止 5 秒内无主动操作
3. 当前不存在活跃中的陪伴会话
4. 距离上一次主动触发已超过 30 分钟

不触发条件：

1. 当前正在播放 Agent 语音
2. 当前有弹窗或 overlay 打开
3. 用户刚结束上一轮会话不足 10 分钟

### 5.3 会话形式

每次会话采用短会话模式，持续 3-6 轮左右。

目标不是无限聊天，而是围绕一个当下主题完成一段温和、有收束的陪伴对话，并在后台沉淀成新的长期记忆。

## 6. 总体流程

## 6. 总体流程

本阶段存在两条问答链路，但它们共享同一条画像提炼原则：

1. 用户输入先转成标准文字
2. 标准文字与当前问题先落库
3. 当前轮次即时响应继续推进
4. 后台异步提炼人格线索、兴趣线索和画像更新

### 6.1 `profile` 陪伴会话流程

一次完整的 `profile` 陪伴会话流程如下：

1. 用户进入 `/profile`
2. 前端延迟 5 秒，调用 `POST /api/profile-agent/session/start`
3. 后端基于当前人格画像和近期记忆生成一句主动提问
4. 前端播放 Agent 语音
5. 用户点击按钮说话，或按住说话、松手发送
6. 前端将音频发送至 `POST /api/profile-agent/turns/voice`
7. 后端调用 ASR 将音频转文本
8. 后端调用 Qwen 基于当前会话上下文生成陪伴式回复
9. 后端调用 TTS 将回复合成为音频
10. 后端保存本轮原始问答到 SQLite
11. 后端异步创建记忆提炼任务
12. 后台从一问一答中抽取性格、兴趣和人格画像线索
13. 会话达到轮数上限后结束，并生成新的会话总结
14. 用户进入“记忆”按钮页面时，只看到整理后的记忆卡片和画像更新结果

该流程的核心原则是：

- 用户可见的是即时对话和整理后的记忆结果
- 系统内部保留的是原始问答轮次和异步提炼结果

### 6.2 `onboarding/chat` 引导问答流程

`onboarding/chat` 的固定问题流也按同样的“先记录、后提炼”原则处理：

1. 用户进入 `/onboarding/chat`
2. 前端通过打字机或分段流式效果展示当前固定问题
3. 在问题流式输出完成前，输入区保持禁用
4. 用户通过语音或文本输入回答
5. 若是语音输入，后端先调用 ASR 将音频转成文字
6. 若是文本输入，后端直接使用原始文本
7. 后端将“当前问题 + 用户回答 + 输入方式”先写入数据库
8. 后端立即返回下一题或结束信号，不等待长期记忆提炼
9. 后台异步创建记忆提炼 job
10. Qwen 从该轮回答中抽取社交偏好、兴趣、性格和人格画像线索
11. 抽取结果写入统一画像库
12. 当固定问题结束后，系统汇总当前 onboarding 画像，生成 persona 草案

`onboarding/chat` 的首要目标仍是辅助 persona 初始化，因此它产生的长期记忆默认不直接显示在 `profile` 的“记忆”按钮中，但会进入统一画像库供后续会话与 persona 生成使用。

## 7. 数据模型设计

在现有 `users` 与 `personas` 的基础上，新增以下 5 组表，并补充 onboarding 轮次记录表。

### 7.1 `profile_agent_sessions`

表示一次短会话。

核心字段：

- `id`
- `user_id`
- `status`
  - `active | completed | interrupted`
- `trigger_type`
  - `profile_idle`
- `started_at`
- `ended_at`
- `last_turn_at`
- `summary`
- `mood_snapshot_json`

职责：

- 管理 3-6 轮陪伴会话生命周期
- 作为主动提问、继续追问、会话结束的控制单元

### 7.2 `profile_agent_turns`

表示一轮完整问答，保存原始材料。

核心字段：

- `id`
- `session_id`
- `user_id`
- `turn_index`
- `agent_prompt_text`
- `agent_prompt_audio_url`
- `user_audio_url`
- `user_transcript_text`
- `assistant_reply_text`
- `assistant_reply_audio_url`
- `input_mode`
  - `tap | hold_to_talk | text`
- `asr_provider`
- `llm_provider`
- `tts_provider`
- `created_at`

职责：

- 保留一问一答的原始内容
- 为后续记忆提炼提供真实证据
- 默认不直接暴露给“记忆”页

### 7.3 `profile_memory_items`

表示整理后的长期记忆卡片，是用户真正看到的内容。

核心字段：

- `id`
- `user_id`
- `source_session_id`
- `memory_type`
  - `personality | interest | preference | relationship_style`
- `title`
- `summary`
- `evidence_json`
- `confidence`
- `importance`
- `is_visible`
- `created_at`
- `updated_at`

职责：

- 面向用户展示整理后的长期记忆
- 替代原始聊天记录出现在“记忆”按钮页中

### 7.4 `profile_persona_traits`

表示可被持续更新的人格画像槽位。

核心字段：

- `id`
- `user_id`
- `trait_key`
- `trait_label`
- `trait_value`
- `score`
- `source_memory_id`
- `updated_at`

建议的 `trait_key` 示例：

- `personality.core_style`
- `interest.coffee`
- `relationship.slow_warmup`

职责：

- 提供当前系统对用户的画像结论
- 供下一次主动提问和个性化回复时使用

### 7.5 `profile_memory_jobs`

表示后台异步提炼任务。

核心字段：

- `id`
- `user_id`
- `session_id`
- `turn_id`
- `job_type`
  - `extract_memory | refresh_traits | session_summary`
- `status`
  - `pending | running | succeeded | failed`
- `attempt_count`
- `error_message`
- `scheduled_at`
- `finished_at`

职责：

- 将即时对话链路和长期记忆整理链路解耦
- 保证前台响应速度
- 支持失败重试

### 7.6 `onboarding_turns`

表示 onboarding 固定问题中的一轮问答。

核心字段：

- `id`
- `session_id`
- `user_id` 可为空
- `turn_index`
- `assistant_prompt_text`
- `user_input_mode`
  - `voice | text`
- `user_audio_url`
- `asr_text`
- `user_text`
- `normalized_user_text`
- `assistant_reply_text`
- `created_at`

职责：

- 记录 onboarding 每一轮真实输入来源和标准化结果
- 为异步长期记忆提炼提供证据
- 与 `profile_agent_turns` 在画像提炼层共享同一套异步 job 逻辑

## 8. 数据分层原则

本功能采用四层分离：

1. `profile_agent_turns` / `onboarding_turns`
   - 保存两类问答来源的原始材料
2. `profile_memory_jobs`
   - 负责异步提炼调度
3. `profile_memory_items`
   - 保存给用户展示的长期记忆结果
4. `profile_persona_traits`
   - 保存系统当前使用的人格画像结论

这样可以同时满足：

- 原始材料可追踪
- 用户前台界面保持干净
- 后台可持续更新画像而不破坏展示结构
- 不同问答来源可以共享一套画像库，但保持展示层隔离

## 9. API 设计

### 9.1 Onboarding Chat API 扩展

#### `POST /api/onboarding/session`

用途：

- 创建 onboarding 会话
- 返回第一题
- 返回当前问题序号与总题数

返回字段建议补充：

- `questionText`
- `questionIndex`
- `totalQuestions`
- `streamMode`
  - `typewriter`

#### `POST /api/onboarding/turns/text`

用途：

- 接收用户文字回答
- 先落库到 `onboarding_turns`
- 返回下一题或结束信号
- 异步创建长期记忆提炼 job

请求示例：

```json
{
  "sessionId": "onb_001",
  "text": "我更喜欢能慢慢熟起来的空间。"
}
```

#### `POST /api/onboarding/turns/voice`

用途：

- 接收用户语音回答
- 先走 ASR 转文字
- 再落库到 `onboarding_turns`
- 返回下一题或结束信号
- 异步创建长期记忆提炼 job

请求形式：

- `multipart/form-data`

字段：

- `sessionId`
- `audio`

#### `POST /api/onboarding/complete`

用途：

- 固定问题结束后汇总当前 onboarding 画像
- 生成 persona 草案
- 提供给 confirm 页面使用

说明：

- `onboarding/chat` 不再把“写库、推进问题、生成 persona 草案、长期记忆提炼”揉进一个接口中
- 文本输入和语音输入分流后，在“标准化成文字”之后重新合流

### 9.2 `POST /api/profile-agent/session/start`

用途：

- 在 `/profile` 页面内启动一段主动式短会话
- 创建 `profile_agent_sessions`
- 返回第一句主动提问

请求示例：

```json
{
  "userId": "user_001",
  "triggerType": "profile_idle"
}
```

返回示例：

```json
{
  "session": {
    "id": "pas_001",
    "status": "active",
    "turnIndex": 1
  },
  "prompt": {
    "text": "我发现你最近好像更想要一种轻松、不费力的陪伴。今天的你，更想被安静地听见，还是被温柔地接住？",
    "shouldSpeak": true
  }
}
```

### 9.3 `POST /api/profile-agent/turns/voice`

用途：

- 接收用户语音
- 调用 ASR、Qwen、TTS 完成一轮完整回复
- 保存原始问答
- 创建异步记忆整理任务

请求形式：

- `multipart/form-data`

字段：

- `sessionId`
- `userId`
- `audio`
- `inputMode`
  - `tap | hold_to_talk`

返回示例：

```json
{
  "turn": {
    "id": "turn_001",
    "turnIndex": 1,
    "userTranscriptText": "我今天其实有点累，但又想有人陪我说说话。",
    "assistantReplyText": "那我今天不催你热闹。我们就先慢一点。你觉得最近让你最想停下来喘口气的事情，是什么？"
  },
  "audio": {
    "contentType": "audio/mpeg",
    "base64": "<base64-audio>"
  },
  "session": {
    "id": "pas_001",
    "status": "active",
    "nextTurnIndex": 2,
    "remainingTurnsHint": 3
  }
}
```

### 9.4 `POST /api/profile-agent/turns/text`

用途：

- 提供文字输入兜底能力
- 与语音链路共享同样的会话与记忆整理逻辑

请求示例：

```json
{
  "sessionId": "pas_001",
  "userId": "user_001",
  "text": "我今天有点累，但是想被人陪一下。"
}
```

返回结构与语音接口保持一致。

### 9.5 `POST /api/profile-agent/session/end`

用途：

- 在达到 3-6 轮上限时主动结束会话
- 写入会话总结
- 触发最终的 `session_summary` 与 `refresh_traits`

请求示例：

```json
{
  "sessionId": "pas_001",
  "userId": "user_001",
  "reason": "turn_limit_reached"
}
```

返回示例：

```json
{
  "session": {
    "id": "pas_001",
    "status": "completed"
  }
}
```

### 9.6 `GET /api/profile-agent/memories`

用途：

- 供 `profile` 顶部“记忆”按钮读取整理后的长期记忆内容
- 默认只返回 `source = profile_agent` 且 `is_visible = true` 的结果

请求参数：

- `userId`

返回示例：

```json
{
  "items": [
    {
      "id": "mem_001",
      "type": "relationship_style",
      "title": "偏爱低压力的靠近方式",
      "summary": "你更容易在不用强撑热闹、可以慢慢靠近的关系里感到安全。",
      "confidence": 0.91,
      "createdAt": "2026-04-09T19:30:00.000Z"
    },
    {
      "id": "mem_002",
      "type": "interest",
      "title": "对咖啡馆式陪伴有偏好",
      "summary": "你提到过几次，喜欢能慢慢坐下来说话的空间，这种环境会让你更愿意表达自己。",
      "confidence": 0.84,
      "createdAt": "2026-04-09T19:31:00.000Z"
    }
  ]
}
```

### 9.7 `GET /api/profile-agent/traits`

用途：

- 提供当前人格画像结论
- 可用于 Agent 下一次提问和 profile 页面画像展示

请求参数：

- `userId`

返回示例：

```json
{
  "traits": [
    {
      "key": "personality.core_style",
      "label": "慢热但愿意靠近",
      "score": 0.82
    },
    {
      "key": "interest.calm_space",
      "label": "偏好低压力空间",
      "score": 0.77
    },
    {
      "key": "relationship.need",
      "label": "需要被温柔接住",
      "score": 0.8
    }
  ]
}
```

### 9.8 内部调试接口

第一版可保留一个内部接口用于后台调试，但不暴露给用户：

- `GET /api/profile-agent/sessions/:id/turns`

该接口用于查看原始问答轮次与调试记忆提炼效果。

## 10. 第三方模型与服务职责

本阶段采用以下能力：

- `Qwen`：负责对话生成与记忆提炼
- `TeleSpeechASR`：负责语音转文本
- `MOSS TTS`：负责文本转语音

为保持后端可维护性，建议在 `server/src/services` 层封装：

### 10.1 `profileAgentService`

职责：

- 控制会话生命周期
- 生成主动提问
- 判断下一轮追问或结束策略

### 10.2 `speechService`

职责：

- 调用 ASR 完成音频转文本
- 调用 TTS 完成回复语音合成
- 统一音频输入输出结构

### 10.3 `llmService`

职责：

- 调用 Qwen
- 提供两类能力：
  - 对话回复生成
  - 长期记忆提炼与画像更新

### 10.4 `memoryService`

职责：

- 保存 turn 数据
- 创建异步 job
- 处理 job 并更新 `profile_memory_items`、`profile_persona_traits`
- 统一接收来自 `profile_agent` 与 `onboarding` 的候选问答材料

## 11. Qwen 的职责拆分

建议保留 4 类 prompt 模式。

### 11.1 `proactive_prompt_generation`

用途：

- 生成进入 `/profile` 后的第一句主动提问

输入：

- 当前 persona traits
- 最近 3 条 memory items
- 最近一次 session summary

输出要求：

- 语气温柔
- 不打扰
- 有明确展开空间

### 11.2 `conversation_reply`

用途：

- 基于当前 session 上下文生成陪伴式回复

输入：

- 最近几轮问答
- 当前人格画像
- 当前短会话主题

输出要求：

- 优先理解和接住用户
- 避免说教、避免客服腔
- 最好自然带出下一问

### 11.3 `memory_extraction`

用途：

- 从一问一答中提炼：
  - 性格线索
  - 兴趣爱好
  - 人格画像

输出要求：

- 结构化
- 含置信度
- 可区分“内部候选信号”与“最终对用户展示的记忆”

### 11.4 `onboarding_quick_parse`

用途：

- 在 onboarding 每轮提交后快速抽取当前轮可用的偏好信息
- 不阻塞问题推进

输入：

- 当前固定问题
- 用户标准化后的回答文字

输出要求：

- 轻量结构化
- 能快速更新 persona 草案
- 与异步长期记忆提炼共享字段语义，但不要求最终成文记忆卡片

## 12. 记忆提炼策略

长期记忆不直接由单轮原话直接曝光，而采用两段式整理：

### 12.1 `turn-level extraction`

从单轮问答中提取候选信号，例如：

- 偏好低压力关系
- 喜欢咖啡馆式空间
- 容易在温和氛围下表达自己

该阶段输出主要写入内部结构或 job 处理结果。

### 12.2 `memory consolidation`

当一个 session 结束后，再将多轮候选信号合并为：

- 用户可见的长期记忆卡片
- 系统内部可使用的人格画像槽位
- 会话级总结

对于 `onboarding` 来源，合并后的结果默认策略为：

- 进入统一画像库
- 默认不进入 `profile` “记忆”按钮展示层
- 主要用于 persona 初始化与后续主动提问 personalization

这样可以避免用户随口一句话就被过度定性，同时让“记忆”页呈现得更稳定、更像被理解后的整理结果。

## 13. Prompt 风格原则

Agent 的系统风格建议固定为：

- 不是心理咨询师
- 不是万能工具助手
- 是陪伴型分身
- 说话短句、温柔、有停顿感
- 不连续追问成审讯
- 不轻易下结论
- 在理解后再给建议

## 14. 安全与配置

所有第三方 API 密钥必须通过环境变量注入，不写入前端代码、不写入仓库文档正文。

建议后端环境变量：

- `SILICONFLOW_API_KEY`
- `PROFILE_AGENT_LLM_MODEL`
- `PROFILE_AGENT_ASR_MODEL`
- `PROFILE_AGENT_TTS_MODEL`
- `PROFILE_AGENT_TTS_VOICE`
- `ONBOARDING_STREAM_CHUNK_MS`

建议默认值：

- LLM：`Qwen`
- ASR：`TeleAI/TeleSpeechASR`
- TTS：`fnlp/MOSS-TTSD-v0.5`

## 15. 错误处理

需要覆盖的基础错误：

1. 用户不存在
2. 会话不存在或已结束
3. 音频上传为空
4. ASR 调用失败
5. Qwen 对话生成失败
6. TTS 生成失败
7. 记忆整理 job 执行失败

统一错误返回格式建议：

```json
{
  "error": {
    "code": "PROFILE_AGENT_ASR_FAILED",
    "message": "语音识别暂时失败，请稍后再试"
  }
}
```

## 16. 阶段划分

### Phase 1：可运行问答与画像基础版

P0：

- 建立 `onboarding_turns`
- 建立 `profile_agent_sessions`
- 建立 `profile_agent_turns`
- 建立 `profile_memory_items`
- 建立 `profile_persona_traits`
- 建立 `profile_memory_jobs`
- 接通 `/api/onboarding/turns/text`
- 接通 `/api/onboarding/turns/voice`
- 接通 `/api/onboarding/complete`
- 支持 onboarding 固定问题流式输出
- 支持 onboarding 先落库再异步提炼长期记忆
- 接通 `/session/start`
- 接通 `/turns/voice`
- 接通 `/turns/text`
- 接通 `/session/end`
- 接通 `/memories`
- 接通 `/traits`
- 支持 profile 页面按钮式语音输入
- 支持主动提问与语音回复

P1：

- 增加调试日志
- 增加 job 重试
- 增加会话节奏策略调优

### Phase 2：记忆与画像增强版

P0：

- 优化记忆卡片质量
- 优化人格画像槽位设计
- 优化主动提问质量

P1：

- 增加更细粒度的兴趣与性格标签
- 增加低置信度记忆过滤策略

### Phase 3：长期语音能力增强版

P0：

- 增加页内更顺滑的语音状态机
- 增加更自然的中断处理

P1：

- 评估是否引入更重的实时语音框架
- 评估是否支持唤醒词或原生 App 化

## 17. 风险与应对

### 风险 1：主链路响应过慢

应对：

- 将记忆提炼异步化
- 把主链路聚焦在 `ASR -> 回复 -> TTS`

### 风险 2：记忆质量过于机械

应对：

- 使用 `turn-level extraction + memory consolidation` 两段式策略
- 不直接把原始 transcript 暴露给用户

### 风险 3：用户感觉被频繁打扰

应对：

- 仅在 `/profile` 页面内触发
- 增加 30 分钟冷却时间
- 会话控制在 3-6 轮内

### 风险 4：前端展示与后台数据结构耦合过深

应对：

- 将原始 turn、长期记忆、画像 traits 分层建模
- 让“记忆”页只依赖 `profile_memory_items`

### 风险 5：onboarding 与 profile-agent 两条链路再次分叉

应对：

- 统一采用“输入标准化后先落库，再异步提炼画像”的原则
- 共享同一套 traits 与 memory jobs
- 只在展示层按来源过滤

## 18. 最终结论

本功能的正确落地方式不是从“持续监听”和“系统级语音助手”切入，而是：

1. 让 `onboarding/chat` 和 `profile` 都遵循“输入标准化后先落库”的统一原则
2. 由后端统一编排 `ASR -> Qwen -> TTS` 与异步画像提炼
3. 将两类问答都持久化到 SQLite
4. 通过异步 job 在后台无感整理长期记忆与人格画像
5. 将用户可见内容收敛到“记忆卡片 + 人格画像”，并在展示层按来源过滤

这条路径最适合当前项目阶段：既能快速让 3D 分身真正“活起来”，也能让 onboarding 不再停留在 mock 问答，同时为后续更复杂的语音陪伴和持续用户理解能力保留清晰的升级路线。
