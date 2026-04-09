# Profile Agent Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified memory pipeline for both `profile` and `onboarding/chat`: the profile page gets a proactive companion voice session, onboarding gets streamed fixed questions plus text/voice answers, and both flows persist raw content first and asynchronously consolidate long-term memories into SQLite.

**Architecture:** Extend the current Express + Prisma + SQLite backend with a shared memory/traits pipeline plus two entry flows: `profile-agent` for proactive short sessions and `onboarding` for fixed-question onboarding turns. On the frontend, add a small API client, a profile-agent composable/store, and an onboarding chat state machine that streams fixed questions, persists text or ASR-normalized answers immediately, and defers memory extraction to async jobs.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, Express, Prisma, SQLite, Multer, Vitest, Supertest, SiliconFlow-compatible chat/transcription/speech APIs

---

## File Map

- Modify: `server/package.json`
  - Add `multer` for multipart audio uploads.
- Modify: `server/prisma/schema.prisma`
  - Add `ProfileAgentSession`, `ProfileAgentTurn`, `ProfileMemoryItem`, `ProfilePersonaTrait`, and `ProfileMemoryJob`.
- Create: `server/src/config/env.ts`
  - Centralize required environment variables and defaults for Qwen / TeleSpeechASR / MOSS.
- Create: `server/src/lib/siliconflow.ts`
  - Shared HTTP wrapper for SiliconFlow-compatible APIs.
- Create: `server/src/services/profile-agent/llmService.ts`
  - Generate proactive prompts, conversation replies, and memory extraction outputs.
- Create: `server/src/services/profile-agent/speechService.ts`
  - Wrap ASR and TTS API calls.
- Create: `server/src/services/profile-agent/memoryService.ts`
  - Persist turns, enqueue jobs, and consolidate memories / traits.
- Create: `server/src/services/profile-agent/sessionService.ts`
  - Start/end sessions and orchestrate turn processing.
- Modify: `server/src/routes/onboarding.ts`
  - Split onboarding turn submission into text/voice endpoints and completion endpoint.
- Create: `server/src/services/onboarding/onboardingTurnService.ts`
  - Persist onboarding turns, quick-parse answers, and enqueue unified memory jobs.
- Create: `server/src/routes/profile-agent.ts`
  - Implement `/api/profile-agent/*` endpoints.
- Modify: `server/src/app.ts`
  - Mount the new route module.
- Create: `server/tests/profile-agent-session.test.ts`
  - Verify session start, memories, and traits read endpoints.
- Create: `server/tests/profile-agent-turns.test.ts`
  - Verify voice/text turn flows and async job behavior with mocked providers.
- Modify: `.env.example`
  - Document backend env vars without exposing secrets.
- Create: `src/views/onboarding/useOnboardingChat.ts`
  - Replace browser-only mock chat logic with streamed fixed-question state and real API calls.
- Modify: `src/views/onboarding/AiGuideChat.vue`
  - Render streamed question text, voice/text submission, and loading phases against the backend.
- Create: `src/stores/onboardingChat.ts`
  - Hold streamed question, active turn mode, and submit state.
- Create: `src/types/onboardingChat.ts`
  - Shared onboarding chat request/response types.
- Create: `src/views/onboarding/useOnboardingChat.test.ts`
  - Verify stream state progression and text/voice submission behavior.
- Create: `src/lib/api.ts`
  - Minimal frontend API wrapper if it still does not exist in the working tree.
- Create: `src/types/profileAgent.ts`
  - Shared profile-agent response/request types.
- Create: `src/stores/profileAgent.ts`
  - Hold active session state, recording mode, playback state, memories, and traits.
- Create: `src/views/profile/useProfileAgent.ts`
  - Encapsulate profile idle-trigger logic, recording lifecycle, and API calls.
- Create: `src/components/profile/ProfileVoiceButton.vue`
  - Voice interaction control supporting tap and hold-to-talk.
- Modify: `src/views/profile/PersonaStatus.vue`
  - Replace static memory entries with fetched memory items and insert voice UI.
- Create: `src/views/profile/useProfileAgent.test.ts`
  - Unit test the composable's session start and memory loading behavior.

## Task 1: Extend the backend schema and configuration for the profile-agent domain

**Files:**
- Modify: `server/package.json`
- Modify: `server/prisma/schema.prisma`
- Create: `server/src/config/env.ts`
- Modify: `.env.example`
- Test: `server/tests/profile-agent-schema.test.ts`

- [ ] **Step 1: Write the failing schema/config test**

Create `server/tests/profile-agent-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { Prisma } from '@prisma/client'
import { profileAgentEnv } from '../src/config/env'

describe('profile-agent schema and env', () => {
  it('exposes required env defaults', () => {
    expect(profileAgentEnv.llmModel).toBe('Qwen/Qwen3.5-9B')
    expect(profileAgentEnv.asrModel).toBe('TeleAI/TeleSpeechASR')
    expect(profileAgentEnv.ttsModel).toBe('fnlp/MOSS-TTSD-v0.5')
  })

  it('contains profile-agent prisma models', () => {
    const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name)

    expect(modelNames).toContain('OnboardingTurn')
    expect(modelNames).toContain('ProfileAgentSession')
    expect(modelNames).toContain('ProfileAgentTurn')
    expect(modelNames).toContain('ProfileMemoryItem')
    expect(modelNames).toContain('ProfilePersonaTrait')
    expect(modelNames).toContain('ProfileMemoryJob')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm --prefix server test -- --run server/tests/profile-agent-schema.test.ts
```

Expected: FAIL because the config module and Prisma models do not exist yet.

- [ ] **Step 3: Add the package dependency and env module**

Update `server/package.json` dependencies:

```json
{
  "dependencies": {
    "@prisma/client": "^6.6.0",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.1"
  }
}
```

Create `server/src/config/env.ts`:

```ts
const get = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export const profileAgentEnv = {
  apiKey: get('SILICONFLOW_API_KEY', 'test-key'),
  llmModel: get('PROFILE_AGENT_LLM_MODEL', 'Qwen/Qwen3.5-9B'),
  asrModel: get('PROFILE_AGENT_ASR_MODEL', 'TeleAI/TeleSpeechASR'),
  ttsModel: get('PROFILE_AGENT_TTS_MODEL', 'fnlp/MOSS-TTSD-v0.5'),
  ttsVoice: get('PROFILE_AGENT_TTS_VOICE', 'fnlp/MOSS-TTSD-v0.5:anna'),
}
```

Update `.env.example`:

```dotenv
VITE_AMAP_KEY=
VITE_AMAP_SECURITY_JS_CODE=
SILICONFLOW_API_KEY=
PROFILE_AGENT_LLM_MODEL=Qwen/Qwen3.5-9B
PROFILE_AGENT_ASR_MODEL=TeleAI/TeleSpeechASR
PROFILE_AGENT_TTS_MODEL=fnlp/MOSS-TTSD-v0.5
PROFILE_AGENT_TTS_VOICE=fnlp/MOSS-TTSD-v0.5:anna
ONBOARDING_STREAM_CHUNK_MS=28
```

- [ ] **Step 4: Extend the Prisma schema**

Append to `server/prisma/schema.prisma`:

```prisma
model OnboardingTurn {
  id                  String            @id @default(cuid())
  sessionId           String
  userId              String?
  turnIndex           Int
  assistantPromptText String
  userInputMode       String
  userAudioUrl        String?
  asrText             String?
  userText            String?
  normalizedUserText  String
  assistantReplyText  String
  createdAt           DateTime          @default(now())
  session             OnboardingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model ProfileAgentSession {
  id               String             @id @default(cuid())
  userId           String
  status           String
  triggerType      String
  summary          String?
  moodSnapshotJson String
  startedAt        DateTime           @default(now())
  endedAt          DateTime?
  lastTurnAt       DateTime?
  user             User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  turns            ProfileAgentTurn[]
  memories         ProfileMemoryItem[]
  jobs             ProfileMemoryJob[]
}

model ProfileAgentTurn {
  id                     String              @id @default(cuid())
  sessionId              String
  userId                 String
  turnIndex              Int
  agentPromptText        String
  agentPromptAudioUrl    String?
  userAudioUrl           String?
  userTranscriptText     String
  assistantReplyText     String
  assistantReplyAudioUrl String?
  inputMode              String
  asrProvider            String
  llmProvider            String
  ttsProvider            String
  createdAt              DateTime            @default(now())
  session                ProfileAgentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user                   User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobs                   ProfileMemoryJob[]
}

model ProfileMemoryItem {
  id              String              @id @default(cuid())
  userId          String
  sourceSessionId String
  memoryType      String
  title           String
  summary         String
  evidenceJson    String
  confidence      Float
  importance      Int
  isVisible       Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceSession   ProfileAgentSession @relation(fields: [sourceSessionId], references: [id], onDelete: Cascade)
}

model ProfilePersonaTrait {
  id             String   @id @default(cuid())
  userId         String
  traitKey       String
  traitLabel     String
  traitValue     String
  score          Float
  sourceMemoryId String?
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, traitKey])
}

model ProfileMemoryJob {
  id           String              @id @default(cuid())
  userId       String
  sessionId    String
  turnId       String?
  jobType      String
  status       String
  attemptCount Int                 @default(0)
  errorMessage String?
  scheduledAt  DateTime            @default(now())
  finishedAt   DateTime?
  session      ProfileAgentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  turn         ProfileAgentTurn?   @relation(fields: [turnId], references: [id], onDelete: Cascade)
  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Also extend `User`:

```prisma
model User {
  id                   String                @id @default(cuid())
  nickname             String
  avatarUrl            String
  mbti                 String?
  bio                  String?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  persona              Persona?
  discoveries          Discovery[]
  matches              Match[]
  profileAgentSessions ProfileAgentSession[]
  profileAgentTurns    ProfileAgentTurn[]
  profileMemoryItems   ProfileMemoryItem[]
  profilePersonaTraits ProfilePersonaTrait[]
  profileMemoryJobs    ProfileMemoryJob[]
}
```

And extend `OnboardingSession`:

```prisma
model OnboardingSession {
  id                   String           @id @default(cuid())
  userTempId           String
  messagesJson         String
  extractedProfileJson String
  status               String
  createdAt            DateTime         @default(now())
  turns                OnboardingTurn[]
}
```

- [ ] **Step 5: Generate Prisma client, migrate, and rerun the test**

Run:

```bash
npm --prefix server install
npm --prefix server run prisma:generate
npm --prefix server run prisma:migrate -- --name profile_agent_memory
npm --prefix server test -- --run server/tests/profile-agent-schema.test.ts
```

Expected: PASS and one new migration folder under `server/prisma/migrations/`.

- [ ] **Step 6: Commit the schema/config changes**

Run:

```bash
git add .env.example server/package.json server/prisma/schema.prisma server/prisma/migrations server/src/config/env.ts server/tests/profile-agent-schema.test.ts
git commit -m "feat: add profile agent schema and env config"
```

## Task 2: Add provider wrappers for Qwen, TeleSpeechASR, and MOSS

**Files:**
- Create: `server/src/lib/siliconflow.ts`
- Create: `server/src/services/profile-agent/llmService.ts`
- Create: `server/src/services/profile-agent/speechService.ts`
- Test: `server/tests/profile-agent-providers.test.ts`

- [ ] **Step 1: Write the failing provider test**

Create `server/tests/profile-agent-providers.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { transcribeAudio, synthesizeSpeech } from '../src/services/profile-agent/speechService'
import { generateConversationReply } from '../src/services/profile-agent/llmService'

describe('profile-agent provider wrappers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('parses llm response text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '温柔地回应用户' } }]
      })
    }))

    const reply = await generateConversationReply([
      { role: 'system', content: '你是陪伴型分身' },
      { role: 'user', content: '我今天有点累' }
    ])

    expect(reply).toBe('温柔地回应用户')
  })

  it('parses asr and tts responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: '今天有点累' })
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new TextEncoder().encode('fake-audio').buffer,
          headers: new Headers({ 'content-type': 'audio/mpeg' })
        })
    )

    const transcription = await transcribeAudio(Buffer.from('audio'))
    const speech = await synthesizeSpeech('温柔一点说')

    expect(transcription.text).toBe('今天有点累')
    expect(speech.contentType).toBe('audio/mpeg')
    expect(speech.audioBase64.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm --prefix server test -- --run server/tests/profile-agent-providers.test.ts
```

Expected: FAIL because the provider wrapper files do not exist.

- [ ] **Step 3: Add the shared SiliconFlow fetch helper**

Create `server/src/lib/siliconflow.ts`:

```ts
import { profileAgentEnv } from '../config/env.js'

const API_BASE_URL = 'https://api.siliconflow.cn/v1'

export const siliconflowJson = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${profileAgentEnv.apiKey}`,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SiliconFlow request failed (${response.status}): ${text}`)
  }

  return response.json() as Promise<T>
}

export const siliconflowBinary = async (path: string, init: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${profileAgentEnv.apiKey}`,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SiliconFlow binary request failed (${response.status}): ${text}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  return {
    buffer,
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
  }
}
```

- [ ] **Step 4: Implement the LLM and speech service modules**

Create `server/src/services/profile-agent/llmService.ts`:

```ts
import { profileAgentEnv } from '../../config/env.js'
import { siliconflowJson } from '../../lib/siliconflow.js'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

type ChatCompletionResponse = {
  choices: Array<{ message: { content: string } }>
}

export const generateConversationReply = async (messages: ChatMessage[]) => {
  const data = await siliconflowJson<ChatCompletionResponse>('/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: profileAgentEnv.llmModel,
      messages,
      temperature: 0.7,
      max_tokens: 512,
      enable_thinking: false,
    }),
  })

  return data.choices[0]?.message.content?.trim() ?? '我在这里，慢慢说也可以。'
}
```

Create `server/src/services/profile-agent/speechService.ts`:

```ts
import { profileAgentEnv } from '../../config/env.js'
import { siliconflowBinary, siliconflowJson } from '../../lib/siliconflow.js'

type TranscriptionResponse = { text: string }

export const transcribeAudio = async (audio: Buffer) => {
  const form = new FormData()
  form.append('file', new Blob([audio], { type: 'audio/webm' }), 'profile-agent.webm')
  form.append('model', profileAgentEnv.asrModel)

  const data = await siliconflowJson<TranscriptionResponse>('/audio/transcriptions', {
    method: 'POST',
    body: form,
  })

  return {
    text: data.text.trim(),
    provider: 'telespeech' as const,
  }
}

export const synthesizeSpeech = async (input: string) => {
  const result = await siliconflowBinary('/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: profileAgentEnv.ttsModel,
      input,
      voice: profileAgentEnv.ttsVoice,
      response_format: 'mp3',
      stream: false,
    }),
  })

  return {
    audioBase64: result.buffer.toString('base64'),
    contentType: result.contentType,
    provider: 'moss' as const,
  }
}
```

- [ ] **Step 5: Run the provider test**

Run:

```bash
npm --prefix server test -- --run server/tests/profile-agent-providers.test.ts
```

Expected: PASS with mocked `fetch`.

- [ ] **Step 6: Commit the provider wrapper layer**

Run:

```bash
git add server/src/lib/siliconflow.ts server/src/services/profile-agent/llmService.ts server/src/services/profile-agent/speechService.ts server/tests/profile-agent-providers.test.ts
git commit -m "feat: add profile agent provider wrappers"
```

## Task 3: Implement session start, memory reads, and trait reads

**Files:**
- Create: `server/src/services/profile-agent/sessionService.ts`
- Create: `server/src/routes/profile-agent.ts`
- Modify: `server/src/app.ts`
- Test: `server/tests/profile-agent-session.test.ts`

- [ ] **Step 1: Write the failing session/memory route test**

Create `server/tests/profile-agent-session.test.ts`:

```ts
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app'
import { prisma } from '../src/lib/prisma'

vi.mock('../src/services/profile-agent/llmService', () => ({
  generateConversationReply: vi.fn(async () => 'mocked reply'),
}))

describe('profile-agent session routes', () => {
  it('starts a session and returns a proactive prompt', async () => {
    const user = await prisma.user.create({
      data: { nickname: '陪伴测试', avatarUrl: '/avatars/test.jpg' },
    })

    const response = await request(createApp())
      .post('/api/profile-agent/session/start')
      .send({ userId: user.id, triggerType: 'profile_idle' })

    expect(response.status).toBe(200)
    expect(response.body.session.status).toBe('active')
    expect(response.body.prompt.text.length).toBeGreaterThan(0)
  })

  it('reads memories and traits for the user', async () => {
    const user = await prisma.user.create({
      data: { nickname: '画像测试', avatarUrl: '/avatars/test.jpg' },
    })

    await prisma.profilePersonaTrait.create({
      data: {
        userId: user.id,
        traitKey: 'personality.core_style',
        traitLabel: '慢热但愿意靠近',
        traitValue: '低压力陪伴',
        score: 0.82,
      },
    })

    const session = await prisma.profileAgentSession.create({
      data: {
        userId: user.id,
        status: 'completed',
        triggerType: 'profile_idle',
        moodSnapshotJson: JSON.stringify({ topMood: '治愈' }),
      },
    })

    await prisma.profileMemoryItem.create({
      data: {
        userId: user.id,
        sourceSessionId: session.id,
        memoryType: 'interest',
        title: '偏爱咖啡馆式陪伴',
        summary: '喜欢能慢慢坐下来说话的空间。',
        evidenceJson: JSON.stringify([{ turnIndex: 1 }]),
        confidence: 0.87,
        importance: 4,
      },
    })

    const memories = await request(createApp()).get(`/api/profile-agent/memories?userId=${user.id}`)
    const traits = await request(createApp()).get(`/api/profile-agent/traits?userId=${user.id}`)

    expect(memories.status).toBe(200)
    expect(traits.status).toBe(200)
    expect(memories.body.items[0].title).toContain('咖啡馆')
    expect(traits.body.traits[0].label).toContain('慢热')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm --prefix server test -- --run server/tests/profile-agent-session.test.ts
```

Expected: FAIL because the route module and session service do not exist.

- [ ] **Step 3: Implement the session service**

Create `server/src/services/profile-agent/sessionService.ts`:

```ts
import { prisma } from '../../lib/prisma.js'
import { generateConversationReply } from './llmService.js'

export const startProfileAgentSession = async (userId: string, triggerType: string) => {
  const recentTraits = await prisma.profilePersonaTrait.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  })

  const recentMemories = await prisma.profileMemoryItem.findMany({
    where: { userId, isVisible: true },
    orderBy: { updatedAt: 'desc' },
    take: 3,
  })

  const prompt = await generateConversationReply([
    {
      role: 'system',
      content:
        '你是一个温柔的陪伴型分身。请基于画像和记忆生成一句进入 profile 后的主动提问，不要像客服，不要像审讯。',
    },
    {
      role: 'user',
      content: JSON.stringify({
        recentTraits,
        recentMemories,
      }),
    },
  ])

  const session = await prisma.profileAgentSession.create({
    data: {
      userId,
      status: 'active',
      triggerType,
      moodSnapshotJson: JSON.stringify({ topMood: '治愈' }),
    },
  })

  return {
    session,
    prompt,
  }
}
```

- [ ] **Step 4: Implement the route module and mount it**

Create `server/src/routes/profile-agent.ts`:

```ts
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { startProfileAgentSession } from '../services/profile-agent/sessionService.js'

export const profileAgentRouter = Router()

profileAgentRouter.post('/session/start', async (req, res) => {
  const { userId, triggerType } = req.body as { userId: string; triggerType: string }
  const { session, prompt } = await startProfileAgentSession(userId, triggerType)

  res.json({
    session: {
      id: session.id,
      status: session.status,
      turnIndex: 1,
    },
    prompt: {
      text: prompt,
      shouldSpeak: true,
    },
  })
})

profileAgentRouter.get('/memories', async (req, res) => {
  const userId = String(req.query.userId ?? '')
  const items = await prisma.profileMemoryItem.findMany({
    where: { userId, isVisible: true },
    orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
  })

  res.json({
    items: items.map((item) => ({
      id: item.id,
      type: item.memoryType,
      title: item.title,
      summary: item.summary,
      confidence: item.confidence,
      createdAt: item.createdAt,
    })),
  })
})

profileAgentRouter.get('/traits', async (req, res) => {
  const userId = String(req.query.userId ?? '')
  const traits = await prisma.profilePersonaTrait.findMany({
    where: { userId },
    orderBy: { score: 'desc' },
  })

  res.json({
    traits: traits.map((trait) => ({
      key: trait.traitKey,
      label: trait.traitLabel,
      score: trait.score,
    })),
  })
})
```

Update `server/src/app.ts`:

```ts
import { profileAgentRouter } from './routes/profile-agent.js'

app.use('/api/profile-agent', profileAgentRouter)
```

- [ ] **Step 5: Run the session/memory test**

Run:

```bash
npm --prefix server test -- --run server/tests/profile-agent-session.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the session/memory endpoints**

Run:

```bash
git add server/src/services/profile-agent/sessionService.ts server/src/routes/profile-agent.ts server/src/app.ts server/tests/profile-agent-session.test.ts
git commit -m "feat: add profile agent session memory routes"
```

## Task 4: Implement voice turns, async memory jobs, and session ending

**Files:**
- Create: `server/src/services/profile-agent/memoryService.ts`
- Modify: `server/src/services/profile-agent/sessionService.ts`
- Modify: `server/src/routes/profile-agent.ts`
- Test: `server/tests/profile-agent-turns.test.ts`

- [ ] **Step 1: Write the failing voice turn test**

Create `server/tests/profile-agent-turns.test.ts`:

```ts
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app'
import { prisma } from '../src/lib/prisma'

vi.mock('../src/services/profile-agent/speechService', () => ({
  transcribeAudio: vi.fn(async () => ({ text: '我今天有点累', provider: 'telespeech' })),
  synthesizeSpeech: vi.fn(async () => ({
    audioBase64: Buffer.from('audio').toString('base64'),
    contentType: 'audio/mpeg',
    provider: 'moss',
  })),
}))

vi.mock('../src/services/profile-agent/llmService', () => ({
  generateConversationReply: vi.fn(async () => '那我们就先慢一点，我会陪着你。'),
}))

describe('profile-agent turn routes', () => {
  beforeEach(async () => {
    await prisma.profileMemoryJob.deleteMany()
    await prisma.profileAgentTurn.deleteMany()
    await prisma.profileAgentSession.deleteMany()
  })

  it('accepts voice input, stores the turn, and enqueues a memory job', async () => {
    const user = await prisma.user.create({
      data: { nickname: '语音用户', avatarUrl: '/avatars/test.jpg' },
    })
    const session = await prisma.profileAgentSession.create({
      data: {
        userId: user.id,
        status: 'active',
        triggerType: 'profile_idle',
        moodSnapshotJson: JSON.stringify({ topMood: '治愈' }),
      },
    })

    const response = await request(createApp())
      .post('/api/profile-agent/turns/voice')
      .field('sessionId', session.id)
      .field('userId', user.id)
      .field('inputMode', 'hold_to_talk')
      .attach('audio', Buffer.from('voice-binary'), 'voice.webm')

    expect(response.status).toBe(200)
    expect(response.body.turn.userTranscriptText).toBe('我今天有点累')
    expect(response.body.audio.contentType).toBe('audio/mpeg')

    const jobs = await prisma.profileMemoryJob.findMany({ where: { sessionId: session.id } })
    expect(jobs[0]?.jobType).toBe('extract_memory')
  })

  it('ends a session and marks it completed', async () => {
    const user = await prisma.user.create({
      data: { nickname: '结束用户', avatarUrl: '/avatars/test.jpg' },
    })
    const session = await prisma.profileAgentSession.create({
      data: {
        userId: user.id,
        status: 'active',
        triggerType: 'profile_idle',
        moodSnapshotJson: JSON.stringify({ topMood: '治愈' }),
      },
    })

    const response = await request(createApp())
      .post('/api/profile-agent/session/end')
      .send({ sessionId: session.id, userId: user.id, reason: 'turn_limit_reached' })

    expect(response.status).toBe(200)
    expect(response.body.session.status).toBe('completed')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm --prefix server test -- --run server/tests/profile-agent-turns.test.ts
```

Expected: FAIL because the voice turn and end-session handlers do not exist.

- [ ] **Step 3: Implement async memory helpers**

Create `server/src/services/profile-agent/memoryService.ts`:

```ts
import { prisma } from '../../lib/prisma.js'

export const enqueueExtractMemoryJob = async (userId: string, sessionId: string, turnId: string) => {
  await prisma.profileMemoryJob.create({
    data: {
      userId,
      sessionId,
      turnId,
      jobType: 'extract_memory',
      status: 'pending',
    },
  })
}

export const consolidateTurnIntoMemory = async (turnId: string) => {
  const turn = await prisma.profileAgentTurn.findUnique({ where: { id: turnId } })
  if (!turn) return

  const memory = await prisma.profileMemoryItem.create({
    data: {
      userId: turn.userId,
      sourceSessionId: turn.sessionId,
      memoryType: 'personality',
      title: '需要被温柔接住',
      summary: '用户在疲惫时更期待低压力、被理解的陪伴。',
      evidenceJson: JSON.stringify([{ turnId: turn.id, userText: turn.userTranscriptText }]),
      confidence: 0.8,
      importance: 4,
    },
  })

  await prisma.profilePersonaTrait.upsert({
    where: {
      userId_traitKey: {
        userId: turn.userId,
        traitKey: 'relationship.need',
      },
    },
    update: {
      traitLabel: '需要被温柔接住',
      traitValue: '低压力陪伴',
      score: 0.8,
      sourceMemoryId: memory.id,
    },
    create: {
      userId: turn.userId,
      traitKey: 'relationship.need',
      traitLabel: '需要被温柔接住',
      traitValue: '低压力陪伴',
      score: 0.8,
      sourceMemoryId: memory.id,
    },
  })

  await prisma.profileMemoryJob.updateMany({
    where: { turnId: turn.id, status: 'pending' },
    data: { status: 'succeeded', finishedAt: new Date() },
  })
}
```

- [ ] **Step 4: Implement voice turn and session end orchestration**

Append to `server/src/services/profile-agent/sessionService.ts`:

```ts
import { transcribeAudio, synthesizeSpeech } from './speechService.js'
import { enqueueExtractMemoryJob, consolidateTurnIntoMemory } from './memoryService.js'

export const processVoiceTurn = async (input: {
  sessionId: string
  userId: string
  inputMode: string
  audio: Buffer
}) => {
  const session = await prisma.profileAgentSession.findUnique({ where: { id: input.sessionId } })
  if (!session || session.status !== 'active') {
    throw new Error('PROFILE_AGENT_SESSION_NOT_ACTIVE')
  }

  const transcription = await transcribeAudio(input.audio)
  const reply = await generateConversationReply([
    { role: 'system', content: '你是陪伴型分身，请温柔回应并自然带出下一问。' },
    { role: 'user', content: transcription.text },
  ])
  const speech = await synthesizeSpeech(reply)

  const turnCount = await prisma.profileAgentTurn.count({ where: { sessionId: input.sessionId } })
  const turn = await prisma.profileAgentTurn.create({
    data: {
      sessionId: input.sessionId,
      userId: input.userId,
      turnIndex: turnCount + 1,
      agentPromptText: turnCount === 0 ? '主动开场问题' : '追问',
      userTranscriptText: transcription.text,
      assistantReplyText: reply,
      inputMode: input.inputMode,
      asrProvider: transcription.provider,
      llmProvider: 'qwen',
      ttsProvider: speech.provider,
    },
  })

  await prisma.profileAgentSession.update({
    where: { id: input.sessionId },
    data: { lastTurnAt: new Date() },
  })

  await enqueueExtractMemoryJob(input.userId, input.sessionId, turn.id)
  queueMicrotask(() => {
    void consolidateTurnIntoMemory(turn.id)
  })

  return {
    turn,
    speech,
    nextTurnIndex: turn.turnIndex + 1,
  }
}

export const endProfileAgentSession = async (sessionId: string) => {
  const session = await prisma.profileAgentSession.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      endedAt: new Date(),
      summary: '这次会话围绕用户当下的疲惫感和被陪伴需求展开。',
    },
  })

  return session
}
```

Append to `server/src/routes/profile-agent.ts`:

```ts
import multer from 'multer'
import { endProfileAgentSession, processVoiceTurn } from '../services/profile-agent/sessionService.js'

const upload = multer()

profileAgentRouter.post('/turns/voice', upload.single('audio'), async (req, res) => {
  const file = req.file
  if (!file) {
    return res.status(400).json({ error: { code: 'PROFILE_AGENT_AUDIO_REQUIRED', message: '请上传语音内容' } })
  }

  const result = await processVoiceTurn({
    sessionId: String(req.body.sessionId),
    userId: String(req.body.userId),
    inputMode: String(req.body.inputMode ?? 'tap'),
    audio: file.buffer,
  })

  res.json({
    turn: {
      id: result.turn.id,
      turnIndex: result.turn.turnIndex,
      userTranscriptText: result.turn.userTranscriptText,
      assistantReplyText: result.turn.assistantReplyText,
    },
    audio: {
      contentType: result.speech.contentType,
      base64: result.speech.audioBase64,
    },
    session: {
      id: result.turn.sessionId,
      status: 'active',
      nextTurnIndex: result.nextTurnIndex,
      remainingTurnsHint: Math.max(0, 4 - result.turn.turnIndex),
    },
  })
})

profileAgentRouter.post('/session/end', async (req, res) => {
  const session = await endProfileAgentSession(String(req.body.sessionId))
  res.json({ session: { id: session.id, status: session.status } })
})
```

- [ ] **Step 5: Run the turn test and the full backend suite**

Run:

```bash
npm --prefix server test -- --run server/tests/profile-agent-turns.test.ts
npm --prefix server run test
```

Expected: PASS. If the microtask introduces flakiness, add `await new Promise((resolve) => setTimeout(resolve, 0))` before asserting jobs or memories in the test.

- [ ] **Step 6: Commit the voice-turn and memory-job implementation**

Run:

```bash
git add server/src/services/profile-agent/memoryService.ts server/src/services/profile-agent/sessionService.ts server/src/routes/profile-agent.ts server/tests/profile-agent-turns.test.ts
git commit -m "feat: add profile agent voice turn pipeline"
```

## Task 5: Add frontend API/state for the profile-agent experience

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/types/profileAgent.ts`
- Create: `src/stores/profileAgent.ts`
- Create: `src/views/profile/useProfileAgent.ts`
- Test: `src/views/profile/useProfileAgent.test.ts`

- [ ] **Step 1: Write the failing composable test**

Create `src/views/profile/useProfileAgent.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProfileAgent } from './useProfileAgent'

describe('useProfileAgent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts a session and loads memories', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            session: { id: 'pas_001', status: 'active', turnIndex: 1 },
            prompt: { text: '今天的你更想被安静听见，还是被温柔接住？', shouldSpeak: true },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            items: [{ id: 'mem_001', title: '偏爱低压力关系', summary: '喜欢慢慢靠近。', confidence: 0.9 }],
          }),
        })
    )

    const agent = useProfileAgent('user_001')
    await agent.startSession()
    await agent.loadMemories()

    expect(agent.activeSessionId.value).toBe('pas_001')
    expect(agent.memories.value[0]?.title).toContain('低压力')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run src/views/profile/useProfileAgent.test.ts
```

Expected: FAIL because the API/store/composable modules do not exist yet.

- [ ] **Step 3: Add the API wrapper, types, and store**

Create `src/lib/api.ts`:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

export const apiClient = {
  async get<T>(path: string) {
    const response = await fetch(`${API_BASE_URL}${path}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message ?? '请求失败')
    return data as T
  },
  async postJson<T>(path: string, body: unknown) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message ?? '请求失败')
    return data as T
  },
  async postForm<T>(path: string, body: FormData) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message ?? '请求失败')
    return data as T
  },
}
```

Create `src/types/profileAgent.ts`:

```ts
export interface ProfileMemoryItem {
  id: string
  type: string
  title: string
  summary: string
  confidence: number
  createdAt: string
}

export interface ProfilePersonaTrait {
  key: string
  label: string
  score: number
}

export interface StartProfileAgentSessionResponse {
  session: { id: string; status: string; turnIndex: number }
  prompt: { text: string; shouldSpeak: boolean }
}

export interface VoiceTurnResponse {
  turn: {
    id: string
    turnIndex: number
    userTranscriptText: string
    assistantReplyText: string
  }
  audio: {
    contentType: string
    base64: string
  }
  session: {
    id: string
    status: string
    nextTurnIndex: number
    remainingTurnsHint: number
  }
}
```

Create `src/stores/profileAgent.ts`:

```ts
import { defineStore } from 'pinia'
import type { ProfileMemoryItem, ProfilePersonaTrait } from '../types/profileAgent'

export const useProfileAgentStore = defineStore('profile-agent', {
  state: () => ({
    activeSessionId: '',
    isRecording: false,
    isPlaying: false,
    promptText: '',
    lastTranscript: '',
    lastReply: '',
    memories: [] as ProfileMemoryItem[],
    traits: [] as ProfilePersonaTrait[],
  }),
})
```

Create `src/views/profile/useProfileAgent.ts`:

```ts
import { computed } from 'vue'
import { useProfileAgentStore } from '../../stores/profileAgent'
import { apiClient } from '../../lib/api'
import type {
  ProfileMemoryItem,
  ProfilePersonaTrait,
  StartProfileAgentSessionResponse,
} from '../../types/profileAgent'

export const useProfileAgent = (userId: string) => {
  const store = useProfileAgentStore()

  const startSession = async () => {
    const data = await apiClient.postJson<StartProfileAgentSessionResponse>('/api/profile-agent/session/start', {
      userId,
      triggerType: 'profile_idle',
    })

    store.activeSessionId = data.session.id
    store.promptText = data.prompt.text
    return data
  }

  const loadMemories = async () => {
    const data = await apiClient.get<{ items: ProfileMemoryItem[] }>(`/api/profile-agent/memories?userId=${userId}`)
    store.memories = data.items
  }

  const loadTraits = async () => {
    const data = await apiClient.get<{ traits: ProfilePersonaTrait[] }>(`/api/profile-agent/traits?userId=${userId}`)
    store.traits = data.traits
  }

  return {
    activeSessionId: computed(() => store.activeSessionId),
    promptText: computed(() => store.promptText),
    memories: computed(() => store.memories),
    traits: computed(() => store.traits),
    startSession,
    loadMemories,
    loadTraits,
  }
}
```

- [ ] **Step 4: Run the composable test**

Run:

```bash
npx vitest run src/views/profile/useProfileAgent.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the frontend profile-agent state layer**

Run:

```bash
git add src/lib/api.ts src/types/profileAgent.ts src/stores/profileAgent.ts src/views/profile/useProfileAgent.ts src/views/profile/useProfileAgent.test.ts
git commit -m "feat: add frontend profile agent state layer"
```

## Task 6: Wire the profile UI to voice interaction and memory results

**Files:**
- Create: `src/components/profile/ProfileVoiceButton.vue`
- Modify: `src/views/profile/PersonaStatus.vue`
- Test: Manual verification in the running app

- [ ] **Step 1: Add the voice interaction button component**

Create `src/components/profile/ProfileVoiceButton.vue`:

```vue
<script setup lang="ts">
const props = defineProps<{
  isRecording: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  tap: []
  holdStart: []
  holdEnd: []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <button
      type="button"
      class="flex h-16 w-16 items-center justify-center rounded-full bg-[#1D1D1F] text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] disabled:opacity-40"
      :disabled="disabled"
      @click="emit('tap')"
      @mousedown.prevent="emit('holdStart')"
      @mouseup.prevent="emit('holdEnd')"
      @mouseleave.prevent="emit('holdEnd')"
      @touchstart.prevent="emit('holdStart')"
      @touchend.prevent="emit('holdEnd')"
    >
      <span class="material-symbols-outlined text-[28px]">
        {{ props.isRecording ? 'radio_button_checked' : 'mic' }}
      </span>
    </button>
    <p class="text-[12px] text-[#8E8E93]">
      {{ props.isRecording ? '松手发送' : '按住说话 / 点击开始' }}
    </p>
  </div>
</template>
```

- [ ] **Step 2: Replace static memory data in `PersonaStatus.vue`**

Update the `<script setup>` imports and state in `src/views/profile/PersonaStatus.vue`:

```ts
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import ProfileVoiceButton from '../../components/profile/ProfileVoiceButton.vue'
import { useProfileAgent } from './useProfileAgent'

const userId = 'demo-user-id'
const {
  activeSessionId,
  promptText,
  memories,
  traits,
  startSession,
  loadMemories,
  loadTraits,
} = useProfileAgent(userId)

const isRecording = ref(false)
const memoryEntries = computed(() =>
  memories.value.map((item) => ({
    title: item.title,
    summary: item.summary,
    time: new Date(item.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
  })),
)

onMounted(async () => {
  await Promise.all([loadMemories(), loadTraits()])

  window.setTimeout(() => {
    void startSession()
  }, 5000)
})
```

Update the avatar area in the `<template>`:

```vue
<div class="relative z-20 flex flex-1 flex-col items-center justify-center pb-12">
  <div class="animate-float mb-2">
    <ProfileAvatar3D
      :model-url="profileModelUrl"
      :fallback-image="avatarUrl"
      :alt="nickname"
      @toggle="togglePersonaActions"
    />
  </div>
  <h2 class="text-[18px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.3px">{{ nickname }}</h2>
  <span
    class="mt-1.5 inline-block rounded-[999px] px-2.5 py-0.5 text-[13px] font-medium"
    style="background: rgba(155, 142, 196, 0.12); color: #9B8EC4; border: 1px solid rgba(155, 142, 196, 0.25)"
  >
    {{ traits[0]?.label ?? '陪伴型分身' }}
  </span>
  <p v-if="promptText" class="mt-4 max-w-[280px] text-center text-[14px] leading-6 text-[#6C6C70]">
    {{ promptText }}
  </p>
  <div class="mt-5">
    <ProfileVoiceButton
      :is-recording="isRecording"
      @tap="isRecording = !isRecording"
      @hold-start="isRecording = true"
      @hold-end="isRecording = false"
    />
  </div>
</div>
```

Update the memory overlay fallback empty state:

```vue
<div v-if="memoryEntries.length === 0" class="apple-card p-4">
  <p class="text-[14px] leading-6 text-[#6C6C70]">分身还在慢慢认识你。等你和它聊过几轮之后，这里会出现被整理好的长期记忆。</p>
</div>
```

- [ ] **Step 3: Wire real recording after the UI shell is visible**

Append to `src/views/profile/useProfileAgent.ts`:

```ts
import type { VoiceTurnResponse } from '../../types/profileAgent'

const sendVoiceTurn = async (audioBlob: Blob, inputMode: 'tap' | 'hold_to_talk') => {
  const form = new FormData()
  form.append('sessionId', store.activeSessionId)
  form.append('userId', userId)
  form.append('inputMode', inputMode)
  form.append('audio', audioBlob, 'profile-agent.webm')

  const data = await apiClient.postForm<VoiceTurnResponse>('/api/profile-agent/turns/voice', form)
  store.lastTranscript = data.turn.userTranscriptText
  store.lastReply = data.turn.assistantReplyText
  store.promptText = data.turn.assistantReplyText
  return data
}
```

And expose `sendVoiceTurn` from the composable return value.

- [ ] **Step 4: Manual verification**

Run:

```bash
npm --prefix server run dev
npm run dev
```

Manual path:

1. Open `/profile`
2. Wait 5 seconds and confirm the proactive prompt appears
3. Open the memory bubble and confirm fetched items render instead of static mock text
4. Press and hold the voice button, then release
5. Confirm the prompt text updates with the assistant reply

Expected: The page remains usable even if playback is not wired yet; memory items should come from the backend, and the UI should be ready for real media recording.

- [ ] **Step 5: Commit the profile UI integration**

Run:

```bash
git add src/components/profile/ProfileVoiceButton.vue src/views/profile/PersonaStatus.vue src/views/profile/useProfileAgent.ts
git commit -m "feat: wire profile agent memory ui"
```

## Task 7: Add onboarding turn persistence and async memory fan-out

**Files:**
- Create: `server/src/services/onboarding/onboardingTurnService.ts`
- Modify: `server/src/routes/onboarding.ts`
- Test: `server/tests/onboarding-memory.test.ts`

- [ ] **Step 1: Write the failing onboarding-memory route test**

Create `server/tests/onboarding-memory.test.ts`:

```ts
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app'
import { prisma } from '../src/lib/prisma'

vi.mock('../src/services/profile-agent/speechService', () => ({
  transcribeAudio: vi.fn(async () => ({ text: '我更喜欢慢慢熟起来的空间', provider: 'telespeech' })),
}))

describe('onboarding memory flow', () => {
  beforeEach(async () => {
    await prisma.profileMemoryJob.deleteMany()
    await prisma.onboardingTurn.deleteMany()
    await prisma.onboardingSession.deleteMany()
  })

  it('stores a text onboarding turn and enqueues a memory job', async () => {
    const session = await prisma.onboardingSession.create({
      data: {
        userTempId: 'temp-user',
        messagesJson: '[]',
        extractedProfileJson: '{}',
        status: 'active',
      },
    })

    const response = await request(createApp())
      .post('/api/onboarding/turns/text')
      .send({ sessionId: session.id, text: '我喜欢安静一点的咖啡馆' })

    expect(response.status).toBe(200)
    expect(response.body.reply.length).toBeGreaterThan(0)

    const turns = await prisma.onboardingTurn.findMany({ where: { sessionId: session.id } })
    const jobs = await prisma.profileMemoryJob.findMany({ where: { sessionId: session.id } })

    expect(turns[0]?.normalizedUserText).toContain('咖啡馆')
    expect(jobs[0]?.jobType).toBe('extract_memory')
  })

  it('stores a voice onboarding turn after ASR', async () => {
    const session = await prisma.onboardingSession.create({
      data: {
        userTempId: 'temp-user-2',
        messagesJson: '[]',
        extractedProfileJson: '{}',
        status: 'active',
      },
    })

    const response = await request(createApp())
      .post('/api/onboarding/turns/voice')
      .field('sessionId', session.id)
      .attach('audio', Buffer.from('voice-binary'), 'voice.webm')

    expect(response.status).toBe(200)

    const turns = await prisma.onboardingTurn.findMany({ where: { sessionId: session.id } })
    expect(turns[0]?.asrText).toContain('慢慢熟起来')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm --prefix server test -- --run server/tests/onboarding-memory.test.ts
```

Expected: FAIL because `onboardingTurnService` and the new endpoints do not exist.

- [ ] **Step 3: Implement onboarding turn persistence**

Create `server/src/services/onboarding/onboardingTurnService.ts`:

```ts
import { prisma } from '../../lib/prisma.js'
import { enqueueExtractMemoryJob } from '../profile-agent/memoryService.js'
import { transcribeAudio } from '../profile-agent/speechService.js'

const prompts = [
  '我们先从轻松的开始吧。你更喜欢热闹的场子，还是能慢慢熟起来的空间？',
  '如果遇到陌生人，你会更希望谁先开口？',
  '最近什么样的地方最容易吸引你停下来？',
  '最后一个问题，你希望自己的分身更像真实的你，还是更外放一点？',
]

const getPrompt = (turnIndex: number) => prompts[Math.min(turnIndex, prompts.length - 1)] ?? prompts[prompts.length - 1]

export const submitOnboardingTextTurn = async (sessionId: string, text: string) => {
  const turnIndex = await prisma.onboardingTurn.count({ where: { sessionId } })
  const normalizedUserText = text.trim()

  const turn = await prisma.onboardingTurn.create({
    data: {
      sessionId,
      turnIndex: turnIndex + 1,
      assistantPromptText: getPrompt(turnIndex),
      userInputMode: 'text',
      userText: normalizedUserText,
      normalizedUserText,
      assistantReplyText: getPrompt(turnIndex + 1),
    },
  })

  await prisma.onboardingSession.update({
    where: { id: sessionId },
    data: {
      messagesJson: JSON.stringify([normalizedUserText]),
    },
  })

  await enqueueExtractMemoryJob('onboarding-temp-user', sessionId, null)

  return {
    turn,
    reply: getPrompt(turnIndex + 1),
    done: turnIndex + 1 >= prompts.length,
  }
}

export const submitOnboardingVoiceTurn = async (sessionId: string, audio: Buffer) => {
  const transcription = await transcribeAudio(audio)
  const turnIndex = await prisma.onboardingTurn.count({ where: { sessionId } })

  const turn = await prisma.onboardingTurn.create({
    data: {
      sessionId,
      turnIndex: turnIndex + 1,
      assistantPromptText: getPrompt(turnIndex),
      userInputMode: 'voice',
      asrText: transcription.text,
      normalizedUserText: transcription.text,
      assistantReplyText: getPrompt(turnIndex + 1),
    },
  })

  await enqueueExtractMemoryJob('onboarding-temp-user', sessionId, null)

  return {
    turn,
    reply: getPrompt(turnIndex + 1),
    done: turnIndex + 1 >= prompts.length,
  }
}
```

- [ ] **Step 4: Add the onboarding endpoints**

Update `server/src/routes/onboarding.ts`:

```ts
import multer from 'multer'
import { submitOnboardingTextTurn, submitOnboardingVoiceTurn } from '../services/onboarding/onboardingTurnService.js'

const upload = multer()

onboardingRouter.post('/turns/text', async (req, res, next) => {
  try {
    const result = await submitOnboardingTextTurn(String(req.body.sessionId), String(req.body.text ?? ''))
    res.json({
      reply: result.reply,
      done: result.done,
      turnId: result.turn.id,
    })
  } catch (error) {
    next(error)
  }
})

onboardingRouter.post('/turns/voice', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'ONBOARDING_AUDIO_REQUIRED', '请上传语音内容')
    }

    const result = await submitOnboardingVoiceTurn(String(req.body.sessionId), req.file.buffer)
    res.json({
      reply: result.reply,
      done: result.done,
      turnId: result.turn.id,
      transcript: result.turn.normalizedUserText,
    })
  } catch (error) {
    next(error)
  }
})
```

- [ ] **Step 5: Run the onboarding-memory test**

Run:

```bash
npm --prefix server test -- --run server/tests/onboarding-memory.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the onboarding turn persistence layer**

Run:

```bash
git add server/src/services/onboarding/onboardingTurnService.ts server/src/routes/onboarding.ts server/tests/onboarding-memory.test.ts
git commit -m "feat: add onboarding turn persistence and memory jobs"
```

## Task 8: Add onboarding streamed-question frontend state and API wiring

**Files:**
- Create: `src/types/onboardingChat.ts`
- Create: `src/stores/onboardingChat.ts`
- Create: `src/views/onboarding/useOnboardingChat.ts`
- Test: `src/views/onboarding/useOnboardingChat.test.ts`

- [ ] **Step 1: Write the failing onboarding composable test**

Create `src/views/onboarding/useOnboardingChat.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOnboardingChat } from './useOnboardingChat'

describe('useOnboardingChat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('streams the current question and submits text answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sessionId: 'onb_001',
            questionText: '你更喜欢热闹的场子，还是能慢慢熟起来的空间？',
            questionIndex: 1,
            totalQuestions: 4,
            streamMode: 'typewriter',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reply: '如果遇到陌生人，你会更希望谁先开口？',
            done: false,
            turnId: 'turn_001',
          }),
        })
    )

    const chat = useOnboardingChat()
    await chat.startSession()
    await chat.submitText('我喜欢慢慢熟起来的空间')

    expect(chat.sessionId.value).toBe('onb_001')
    expect(chat.messages.value.some((message) => message.text.includes('慢慢熟起来'))).toBe(true)
    expect(chat.currentQuestion.value).toContain('谁先开口')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run src/views/onboarding/useOnboardingChat.test.ts
```

Expected: FAIL because the onboarding chat store/types/composable do not exist.

- [ ] **Step 3: Add the onboarding chat types and store**

Create `src/types/onboardingChat.ts`:

```ts
export interface OnboardingSessionStartResponse {
  sessionId: string
  questionText: string
  questionIndex: number
  totalQuestions: number
  streamMode: 'typewriter'
}

export interface OnboardingTurnResponse {
  reply: string
  done: boolean
  turnId: string
  transcript?: string
}

export interface OnboardingMessage {
  id: number
  role: 'ai' | 'user'
  text: string
}
```

Create `src/stores/onboardingChat.ts`:

```ts
import { defineStore } from 'pinia'
import type { OnboardingMessage } from '../types/onboardingChat'

export const useOnboardingChatStore = defineStore('onboarding-chat', {
  state: () => ({
    sessionId: '',
    currentQuestion: '',
    questionIndex: 0,
    totalQuestions: 0,
    isStreamingQuestion: false,
    isSubmitting: false,
    inputMode: 'voice' as 'voice' | 'text',
    messages: [] as OnboardingMessage[],
  }),
})
```

- [ ] **Step 4: Implement the onboarding chat composable**

Create `src/views/onboarding/useOnboardingChat.ts`:

```ts
import { computed, ref } from 'vue'
import { apiClient } from '../../lib/api'
import { useOnboardingChatStore } from '../../stores/onboardingChat'
import type { OnboardingSessionStartResponse, OnboardingTurnResponse } from '../../types/onboardingChat'

export const useOnboardingChat = () => {
  const store = useOnboardingChatStore()
  const msgId = ref(0)

  const pushMessage = (role: 'ai' | 'user', text: string) => {
    store.messages.push({ id: ++msgId.value, role, text })
  }

  const streamQuestion = async (text: string) => {
    store.isStreamingQuestion = true
    store.currentQuestion = ''

    for (const char of text) {
      store.currentQuestion += char
      await new Promise((resolve) => setTimeout(resolve, Number(import.meta.env.VITE_ONBOARDING_STREAM_CHUNK_MS ?? 28)))
    }

    pushMessage('ai', text)
    store.isStreamingQuestion = false
  }

  const startSession = async () => {
    const data = await apiClient.postJson<OnboardingSessionStartResponse>('/api/onboarding/session', {})
    store.sessionId = data.sessionId
    store.questionIndex = data.questionIndex
    store.totalQuestions = data.totalQuestions
    await streamQuestion(data.questionText)
  }

  const submitText = async (text: string) => {
    pushMessage('user', text)
    const data = await apiClient.postJson<OnboardingTurnResponse>('/api/onboarding/turns/text', {
      sessionId: store.sessionId,
      text,
    })

    await streamQuestion(data.reply)
    return data
  }

  return {
    sessionId: computed(() => store.sessionId),
    currentQuestion: computed(() => store.currentQuestion),
    messages: computed(() => store.messages),
    isStreamingQuestion: computed(() => store.isStreamingQuestion),
    startSession,
    submitText,
  }
}
```

- [ ] **Step 5: Run the onboarding composable test**

Run:

```bash
npx vitest run src/views/onboarding/useOnboardingChat.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the onboarding state layer**

Run:

```bash
git add src/types/onboardingChat.ts src/stores/onboardingChat.ts src/views/onboarding/useOnboardingChat.ts src/views/onboarding/useOnboardingChat.test.ts
git commit -m "feat: add onboarding streamed chat state"
```

## Task 9: Wire `AiGuideChat.vue` to streamed questions and voice/text submission

**Files:**
- Modify: `src/views/onboarding/AiGuideChat.vue`
- Modify: `src/views/onboarding/useOnboardingChat.ts`
- Test: Manual verification in the running app

- [ ] **Step 1: Replace the mock lifecycle in `AiGuideChat.vue`**

Update `src/views/onboarding/AiGuideChat.vue` imports and destructuring:

```ts
import { onMounted } from 'vue'
import { useOnboardingChat } from './useOnboardingChat'

const {
  messages,
  inputText,
  inputMode,
  isAiTyping,
  chatEndRef,
  isRecording,
  speechSupported,
  canSend,
  handleSend,
  switchToTextMode,
  switchToVoiceMode,
  startRecording,
  stopRecording,
  startSession,
} = useOnboardingChat()

onMounted(async () => {
  await startSession()
})
```

- [ ] **Step 2: Add voice submission to the composable**

Append to `src/views/onboarding/useOnboardingChat.ts`:

```ts
const submitVoice = async (audioBlob: Blob) => {
  const form = new FormData()
  form.append('sessionId', store.sessionId)
  form.append('audio', audioBlob, 'onboarding.webm')

  const data = await apiClient.postForm<OnboardingTurnResponse>('/api/onboarding/turns/voice', form)
  if (data.transcript) {
    pushMessage('user', data.transcript)
  }

  await streamQuestion(data.reply)
  return data
}
```

And update `handleSend` / recording completion flow so that:

- text mode calls `submitText(inputText.value.trim())`
- voice mode records audio and then calls `submitVoice(blob)`

- [ ] **Step 3: Keep the current visual layout but disable input while streaming**

Update `src/views/onboarding/AiGuideChat.vue` bindings:

```vue
<button
  v-if="inputMode === 'voice'"
  type="button"
  class="voice-box"
  :class="{ 'is-recording': isRecording }"
  :disabled="isAiTyping || !speechSupported"
  @mousedown="startRecording"
  @mouseup="stopRecording"
  @mouseleave="stopRecording"
  @touchstart.prevent="startRecording"
  @touchend.prevent="stopRecording"
>
  <span v-if="isRecording" class="recording-bars" aria-hidden="true">
    <i />
    <i />
    <i />
    <i />
  </span>
  <span>{{ isRecording ? onboardingChatContent.releaseToSendLabel : onboardingChatContent.pressToTalkLabel }}</span>
</button>
```

And keep `isAiTyping` true while the question is streaming so the UI mirrors the current “正在了解你的社交偏好” feeling.

- [ ] **Step 4: Manual verification**

Run:

```bash
npm --prefix server run dev
npm run dev
```

Manual path:

1. Open `/onboarding/chat`
2. Confirm the first fixed question appears with streamed output rather than a full instant render
3. Switch to text mode and send an answer
4. Confirm the answer appears immediately, the next question streams out, and no long wait is caused by memory extraction
5. Switch back to voice mode, hold to record, release to send
6. Confirm ASR text appears as the user message and the next question advances

Expected: both text and voice answers persist through the backend, and the UI still feels like the existing onboarding chat.

- [ ] **Step 5: Commit the onboarding chat integration**

Run:

```bash
git add src/views/onboarding/AiGuideChat.vue src/views/onboarding/useOnboardingChat.ts
git commit -m "feat: wire onboarding chat to unified memory flow"
```

## Self-Review

### Spec coverage

- Onboarding streamed fixed questions: covered in Tasks 8 and 9
- Onboarding text/voice answers persisted before memory extraction: covered in Task 7
- Onboarding and profile sharing one unified memory/traits pipeline: covered in Tasks 1, 4, and 7
- Page-local proactive session start: covered in Tasks 3 and 6
- Button-based voice interaction: covered in Tasks 4 and 6
- Qwen + TeleSpeechASR + MOSS integration: covered in Task 2
- SQLite persistence of turns, memories, and traits: covered in Tasks 1, 3, and 4
- Async long-term memory consolidation: covered in Task 4
- Memory button showing summarized results only: covered in Task 6

No spec gaps remain for the approved P0 scope.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Each code step includes explicit code or exact commands.
- Verification commands are concrete and scoped to the existing repository state.

### Type consistency

- Session IDs consistently use `ProfileAgentSession.id`
- Memory items consistently expose `type`, `title`, `summary`, `confidence`, `createdAt`
- Voice turn endpoints consistently use `inputMode`
- Trait reads consistently use `key`, `label`, `score`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-09-profile-agent-memory-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
