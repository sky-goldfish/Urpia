%%bash
apply_patch <<"EOF"
*** Begin Patch
*** Add File: docs/superpowers/plans/2026-04-09-xiaohongshu-mvp-implementation.md
+# Xiaohongshu MVP Implementation Plan
+
+> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
+
+**Goal:** Build a runnable MVP by adding a lightweight Express + Prisma + SQLite backend and wiring the existing Vue frontend to real APIs for onboarding, POI, discovery, match, report, and profile flows.
+
+**Architecture:** Keep the current Vue app and page structure, add a new `server/` workspace for the API, and migrate mock-driven views to a shared frontend API client plus a small session store. The backend owns persistence and rule-based persona/match generation; the frontend remains mostly a UI shell that renders returned data and navigates the approved onboarding → map → reveal → match → report loop.
+
+**Tech Stack:** Vue 3, TypeScript, Vite, Vue Router, Pinia, Node.js, Express, Prisma, SQLite, Vitest, Supertest
+
+---
+
+## File Map
+
+- Create: `server/package.json`
+  - Dedicated backend package with dev, build, test, prisma, and seed scripts.
+- Create: `server/tsconfig.json`
+  - TypeScript config for backend compilation.
+- Create: `server/prisma/schema.prisma`
+  - SQLite datasource plus `User`, `Persona`, `OnboardingSession`, `Poi`, `Discovery`, and `Match` models.
+- Create: `server/prisma/seed.ts`
+  - Seed POIs and candidate match templates.
+- Create: `server/src/index.ts`
+  - Express bootstrap, middleware, and route mounting.
+- Create: `server/src/app.ts`
+  - Exportable Express app for tests.
+- Create: `server/src/lib/prisma.ts`
+  - Shared Prisma client.
+- Create: `server/src/lib/errors.ts`
+  - Typed API error helper.
+- Create: `server/src/lib/rules.ts`
+  - Persona drafting and match scoring helpers.
+- Create: `server/src/routes/onboarding.ts`
+  - `POST /api/onboarding/session`, `POST /api/onboarding/chat`, `POST /api/personas/confirm`.
+- Create: `server/src/routes/pois.ts`
+  - `GET /api/pois`, `GET /api/pois/:id`.
+- Create: `server/src/routes/discovery.ts`
+  - `POST /api/discovery/reveal`.
+- Create: `server/src/routes/matches.ts`
+  - `POST /api/matches`, `GET /api/matches/:id`, `GET /api/matches/:id/report`.
+- Create: `server/src/routes/me.ts`
+  - `GET /api/me`, `GET /api/me/history`.
+- Create: `server/tests/*.test.ts`
+  - API route coverage with Supertest.
+- Modify: `package.json`
+  - Add root scripts that delegate to frontend and backend.
+- Create: `src/lib/api.ts`
+  - Shared fetch wrapper and typed API methods.
+- Create: `src/types/api.ts`
+  - Request/response types shared across views.
+- Create: `src/stores/session.ts`
+  - Holds current session/user/match state.
+- Modify: `src/views/onboarding/AiGuideChat.vue`
+  - Replace local mock progression with onboarding API calls.
+- Modify: `src/views/onboarding/ConfirmPersona.vue`
+  - Persist confirmed nickname/avatar/persona and store current user.
+- Modify: `src/views/explore/ExploreMap.vue`
+  - Load POIs from API instead of mock-only local data.
+- Modify: `src/views/explore/PoiInfo.vue`
+  - Load single POI by route param.
+- Modify: `src/views/explore/DiscoveryPoint.vue`
+  - Create discovery via API.
+- Modify: `src/views/explore/ItemReveal.vue`
+  - Render discovery result and launch match creation.
+- Modify: `src/views/social/SocialMatchChat.vue`
+  - Render backend chat rounds.
+- Modify: `src/views/social/MatchReport.vue`
+  - Render backend report details.
+- Modify: `src/views/profile/PersonaStatus.vue`
+  - Load current user/persona.
+- Modify: `src/views/profile/MatchHistory.vue`
+  - Load persisted match history.
+
+## Task 1: Bootstrap backend workspace and test tooling
+
+**Files:**
+- Create: `server/package.json`
+- Create: `server/tsconfig.json`
+- Create: `server/src/app.ts`
+- Create: `server/src/index.ts`
+- Test: `server/tests/health.test.ts`
+- Modify: `package.json`
+
+- [ ] **Step 1: Write the failing health test**
+
+Create `server/tests/health.test.ts`:
+
+```ts
+import request from 'supertest'
+import { describe, expect, it } from 'vitest'
+import { createApp } from '../src/app'
+
+describe('GET /health', () => {
+  it('returns ok status', async () => {
+    const app = createApp()
+    const response = await request(app).get('/health')
+
+    expect(response.status).toBe(200)
+    expect(response.body).toEqual({ status: 'ok' })
+  })
+})
+```
+
+- [ ] **Step 2: Run the test to verify it fails**
+
+Run:
+
+```bash
+npm --prefix server test -- --run server/tests/health.test.ts
+```
+
+Expected: FAIL because `server/package.json` and `server/src/app.ts` do not exist yet.
+
+- [ ] **Step 3: Add minimal backend bootstrap files**
+
+Create `server/package.json`:
+
+```json
+{
+  "name": "Urpia-server",
+  "version": "0.1.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "dev": "tsx watch src/index.ts",
+    "build": "tsc -p tsconfig.json",
+    "test": "vitest run",
+    "prisma:generate": "prisma generate",
+    "prisma:migrate": "prisma migrate dev",
+    "seed": "tsx prisma/seed.ts"
+  },
+  "dependencies": {
+    "@prisma/client": "^6.6.0",
+    "cors": "^2.8.5",
+    "express": "^4.21.2"
+  },
+  "devDependencies": {
+    "@types/cors": "^2.8.17",
+    "@types/express": "^5.0.1",
+    "@types/node": "^22.13.10",
+    "prisma": "^6.6.0",
+    "supertest": "^7.0.0",
+    "tsx": "^4.19.3",
+    "typescript": "^5.8.2",
+    "vitest": "^3.0.9"
+  }
+}
+```
+
+Create `server/tsconfig.json`:
+
+```json
+{
+  "compilerOptions": {
+    "target": "ES2022",
+    "module": "NodeNext",
+    "moduleResolution": "NodeNext",
+    "strict": true,
+    "esModuleInterop": true,
+    "skipLibCheck": true,
+    "outDir": "dist",
+    "types": ["node", "vitest/globals"]
+  },
+  "include": ["src", "tests", "prisma"]
+}
+```
+
+Create `server/src/app.ts`:
+
+```ts
+import cors from 'cors'
+import express from 'express'
+
+export const createApp = () => {
+  const app = express()
+
+  app.use(cors())
+  app.use(express.json())
+
+  app.get('/health', (_req, res) => {
+    res.json({ status: 'ok' })
+  })
+
+  return app
+}
+```
+
+Create `server/src/index.ts`:
+
+```ts
+import { createApp } from './app.js'
+
+const port = Number(process.env.PORT ?? 8787)
+const app = createApp()
+
+app.listen(port, () => {
+  console.log(`API listening on http://localhost:${port}`)
+})
+```
+
+Update root `package.json` scripts:
+
+```json
+{
+  "scripts": {
+    "dev": "vite",
+    "dev:server": "npm --prefix server run dev",
+    "build": "vue-tsc -b && vite build",
+    "build:server": "npm --prefix server run build",
+    "test:server": "npm --prefix server run test",
+    "preview": "vite preview"
+  }
+}
+```
+
+- [ ] **Step 4: Run the health test again**
+
+Run:
+
+```bash
+npm --prefix server install
+npm --prefix server test -- --run server/tests/health.test.ts
+```
+
+Expected: PASS with one successful test.
+
+- [ ] **Step 5: Commit the backend bootstrap**
+
+Run:
+
+```bash
+git add package.json server/package.json server/tsconfig.json server/src/app.ts server/src/index.ts server/tests/health.test.ts
+git commit -m "feat: bootstrap express backend workspace"
+```
+
+## Task 2: Add Prisma schema, migrations, and seed data
+
+**Files:**
+- Create: `server/prisma/schema.prisma`
+- Create: `server/prisma/seed.ts`
+- Create: `server/src/lib/prisma.ts`
+- Test: `server/tests/prisma-schema.test.ts`
+
+- [ ] **Step 1: Write a failing schema test for seeded POIs**
+
+Create `server/tests/prisma-schema.test.ts`:
+
+```ts
+import { beforeAll, describe, expect, it } from 'vitest'
+import { prisma } from '../src/lib/prisma'
+
+describe('seeded database', () => {
+  beforeAll(async () => {
+    await prisma.poi.deleteMany()
+  })
+
+  it('can read seeded POIs', async () => {
+    const count = await prisma.poi.count()
+    expect(count).toBeGreaterThan(0)
+  })
+})
+```
+
+- [ ] **Step 2: Run the schema test to verify it fails**
+
+Run:
+
+```bash
+npm --prefix server test -- --run server/tests/prisma-schema.test.ts
+```
+
+Expected: FAIL because Prisma schema/client are not defined.
+
+- [ ] **Step 3: Add the Prisma schema and client helper**
+
+Create `server/prisma/schema.prisma`:
+
+```prisma
+generator client {
+  provider = "prisma-client-js"
+}
+
+datasource db {
+  provider = "sqlite"
+  url      = "file:./dev.db"
+}
+
+model User {
+  id         String      @id @default(cuid())
+  nickname   String
+  avatarUrl  String
+  mbti       String?
+  bio        String?
+  createdAt  DateTime    @default(now())
+  updatedAt  DateTime    @updatedAt
+  persona    Persona?
+  discoveries Discovery[]
+  matches    Match[]
+}
+
+model Persona {
+  id           String  @id @default(cuid())
+  userId       String  @unique
+  tone         String
+  socialStyle  String
+  moodTags     String
+  interestTags String
+  openingScript String
+  summary      String
+  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
+}
+
+model OnboardingSession {
+  id                   String   @id @default(cuid())
+  userTempId           String
+  messagesJson         String
+  extractedProfileJson String
+  status               String
+  createdAt            DateTime @default(now())
+}
+
+model Poi {
+  id          String      @id @default(cuid())
+  name        String
+  category    String
+  description String
+  lng         Float
+  lat         Float
+  moodTags    String
+  status      String
+  discoveries Discovery[]
+}
+
+model Discovery {
+  id                String   @id @default(cuid())
+  userId            String
+  poiId             String
+  revealType        String
+  revealTitle       String
+  revealPayloadJson String
+  createdAt         DateTime @default(now())
+  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+  poi               Poi      @relation(fields: [poiId], references: [id], onDelete: Cascade)
+}
+
+model Match {
+  id                String   @id @default(cuid())
+  userId            String
+  targetProfileName String
+  targetAvatarUrl   String
+  score             Int
+  status            String
+  reasonSummary     String
+  chatRoundsJson    String
+  reportJson        String
+  createdAt         DateTime @default(now())
+  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+}
+```
+
+Create `server/src/lib/prisma.ts`:
+
+```ts
+import { PrismaClient } from '@prisma/client'
+
+export const prisma = new PrismaClient()
+```
+
+- [ ] **Step 4: Add seed data for POIs and candidate profiles**
+
+Create `server/prisma/seed.ts`:
+
+```ts
+import { prisma } from '../src/lib/prisma'
+
+async function main() {
+  await prisma.poi.deleteMany()
+
+  await prisma.poi.createMany({
+    data: [
+      {
+        name: '安静森林咖啡',
+        category: 'cafe',
+        description: '适合慢热聊天和轻声交流的咖啡空间',
+        lng: 121.4737,
+        lat: 31.2304,
+        moodTags: JSON.stringify(['治愈', '安静', '松弛']),
+        status: 'active'
+      },
+      {
+        name: '黄昏展览角',
+        category: 'gallery',
+        description: '适合从兴趣切入聊天的轻展览空间',
+        lng: 121.4751,
+        lat: 31.2281,
+        moodTags: JSON.stringify(['创意', '浪漫', '观察']),
+        status: 'active'
+      }
+    ]
+  })
+}
+
+main().finally(async () => {
+  await prisma.$disconnect()
+})
+```
+
+- [ ] **Step 5: Generate the client, migrate, seed, and rerun the test**
+
+Run:
+
+```bash
+npm --prefix server run prisma:generate
+npm --prefix server run prisma:migrate -- --name init
+npm --prefix server run seed
+npm --prefix server test -- --run server/tests/prisma-schema.test.ts
+```
+
+Expected: PASS, and the test sees at least 2 POIs.
+
+- [ ] **Step 6: Commit the schema and seed layer**
+
+Run:
+
+```bash
+git add server/prisma/schema.prisma server/prisma/seed.ts server/src/lib/prisma.ts server/tests/prisma-schema.test.ts server/prisma/migrations
+git commit -m "feat: add prisma sqlite schema and seed data"
+```
+
+## Task 3: Implement onboarding API with rule-based persona drafting
+
+**Files:**
+- Create: `server/src/lib/errors.ts`
+- Create: `server/src/lib/rules.ts`
+- Create: `server/src/routes/onboarding.ts`
+- Modify: `server/src/app.ts`
+- Test: `server/tests/onboarding.test.ts`
+
+- [ ] **Step 1: Write failing onboarding API tests**
+
+Create `server/tests/onboarding.test.ts`:
+
+```ts
+import request from 'supertest'
+import { describe, expect, it } from 'vitest'
+import { createApp } from '../src/app'
+
+describe('onboarding api', () => {
+  it('creates a session', async () => {
+    const app = createApp()
+    const response = await request(app).post('/api/onboarding/session').send({})
+
+    expect(response.status).toBe(200)
+    expect(response.body.sessionId).toBeTruthy()
+    expect(response.body.reply).toContain('社交')
+  })
+
+  it('advances a chat session and returns a persona draft', async () => {
+    const app = createApp()
+    const session = await request(app).post('/api/onboarding/session').send({})
+
+    const response = await request(app).post('/api/onboarding/chat').send({
+      sessionId: session.body.sessionId,
+      message: '我更喜欢安静的咖啡馆和展览',
+      inputMode: 'text'
+    })
+
+    expect(response.status).toBe(200)
+    expect(response.body.personaDraft.interestTags.length).toBeGreaterThan(0)
+    expect(typeof response.body.done).toBe('boolean')
+  })
+})
+```
+
+- [ ] **Step 2: Run the onboarding tests to verify they fail**
+
+Run:
+
+```bash
+npm --prefix server test -- --run server/tests/onboarding.test.ts
+```
+
+Expected: FAIL because the onboarding routes do not exist.
+
+- [ ] **Step 3: Add minimal shared error and rules helpers**
+
+Create `server/src/lib/errors.ts`:
+
+```ts
+export class ApiError extends Error {
+  constructor(
+    public status: number,
+    public code: string,
+    message: string
+  ) {
+    super(message)
+  }
+}
+```
+
+Create `server/src/lib/rules.ts`:
+
+```ts
+export const onboardingPrompts = [
+  '你更喜欢怎样的社交场景？',
+  '如果遇到陌生人，你会希望谁先开口？',
+  '你最近最容易被哪类地点吸引？',
+  '最后一个问题：你希望分身更像你，还是更外放一点？'
+]
+
+export const draftPersona = (messages: string[]) => {
+  const text = messages.join(' ')
+  const interestTags = [
+    text.includes('咖啡') ? '咖啡' : null,
+    text.includes('展') ? '展览' : null,
+    text.includes('散步') ? '散步' : null
+  ].filter(Boolean)
+
+  return {
+    mbti: text.includes('安静') ? 'INFP' : 'ENFP',
+    socialStyle: text.includes('慢') || text.includes('安静') ? '慢热型' : '外向型',
+    interestTags: interestTags.length > 0 ? interestTags : ['城市探索'],
+    tone: text.includes('温柔') ? '温柔' : '轻松',
+    summary: '适合在有氛围感的地点进行低压力社交。'
+  }
+}
+```
+
+- [ ] **Step 4: Implement onboarding routes and mount them**
+
+Create `server/src/routes/onboarding.ts`:
+
+```ts
+import { Router } from 'express'
+import { prisma } from '../lib/prisma.js'
+import { ApiError } from '../lib/errors.js'
+import { draftPersona, onboardingPrompts } from '../lib/rules.js'
+
+export const onboardingRouter = Router()
+
+onboardingRouter.post('/session', async (_req, res) => {
+  const session = await prisma.onboardingSession.create({
+    data: {
+      userTempId: crypto.randomUUID(),
+      messagesJson: JSON.stringify([]),
+      extractedProfileJson: JSON.stringify({}),
+      status: 'active'
+    }
+  })
+
+  res.json({
+    sessionId: session.id,
+    reply: onboardingPrompts[0],
+    personaDraft: draftPersona([])
+  })
+})
+
+onboardingRouter.post('/chat', async (req, res, next) => {
+  try {
+    const { sessionId, message } = req.body as { sessionId?: string; message?: string }
+    if (!sessionId || !message) throw new ApiError(400, 'INVALID_REQUEST', '缺少会话或消息')
+
+    const session = await prisma.onboardingSession.findUnique({ where: { id: sessionId } })
+    if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND', 'onboarding 会话不存在')
+
+    const messages = JSON.parse(session.messagesJson) as string[]
+    messages.push(message)
+    const personaDraft = draftPersona(messages)
+    const done = messages.length >= onboardingPrompts.length
+
+    await prisma.onboardingSession.update({
+      where: { id: sessionId },
+      data: {
+        messagesJson: JSON.stringify(messages),
+        extractedProfileJson: JSON.stringify(personaDraft),
+        status: done ? 'completed' : 'active'
+      }
+    })
+
+    res.json({
+      reply: done ? '了解你了，正在生成你的分身...' : onboardingPrompts[messages.length],
+      progress: messages.length,
+      personaDraft,
+      done
+    })
+  } catch (error) {
+    next(error)
+  }
+})
+
+onboardingRouter.post('/confirm', async (req, res, next) => {
+  try {
+    const { sessionId, nickname, avatarUrl } = req.body as {
+      sessionId?: string
+      nickname?: string
+      avatarUrl?: string
+    }
+
+    if (!sessionId || !nickname?.trim() || !avatarUrl) {
+      throw new ApiError(400, 'INVALID_REQUEST', '昵称和头像不能为空')
+    }
+
+    const session = await prisma.onboardingSession.findUnique({ where: { id: sessionId } })
+    if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND', 'onboarding 会话不存在')
+
+    const personaDraft = JSON.parse(session.extractedProfileJson)
+    const user = await prisma.user.create({
+      data: {
+        nickname,
+        avatarUrl,
+        mbti: personaDraft.mbti,
+        bio: personaDraft.summary,
+        persona: {
+          create: {
+            tone: personaDraft.tone,
+            socialStyle: personaDraft.socialStyle,
+            moodTags: JSON.stringify(['治愈', '松弛']),
+            interestTags: JSON.stringify(personaDraft.interestTags),
+            openingScript: '从地点和兴趣切入会更自然。',
+            summary: personaDraft.summary
+          }
+        }
+      },
+      include: { persona: true }
+    })
+
+    res.json({ user })
+  } catch (error) {
+    next(error)
+  }
+})
+```
+
+Update `server/src/app.ts`:
+
+```ts
+import cors from 'cors'
+import express from 'express'
+import { ApiError } from './lib/errors.js'
+import { onboardingRouter } from './routes/onboarding.js'
+
+export const createApp = () => {
+  const app = express()
+  app.use(cors())
+  app.use(express.json())
+
+  app.get('/health', (_req, res) => {
+    res.json({ status: 'ok' })
+  })
+
+  app.use('/api/onboarding', onboardingRouter)
+  app.use('/api/personas', onboardingRouter)
+
+  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
+    if (error instanceof ApiError) {
+      return res.status(error.status).json({ error: { code: error.code, message: error.message } })
+    }
+
+    console.error(error)
+    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } })
+  })
+
+  return app
+}
+```
+
+- [ ] **Step 5: Run the onboarding tests and backend build**
+
+Run:
+
+```bash
+npm --prefix server test -- --run server/tests/onboarding.test.ts
+npm --prefix server run build
+```
+
+Expected: PASS.
+
+- [ ] **Step 6: Commit the onboarding API**
+
+Run:
+
+```bash
+git add server/src/lib/errors.ts server/src/lib/rules.ts server/src/routes/onboarding.ts server/src/app.ts server/tests/onboarding.test.ts
+git commit -m "feat: add onboarding persona api"
+```
+
+## Task 4: Implement POI, discovery, and match APIs
+
+**Files:**
+- Create: `server/src/routes/pois.ts`
+- Create: `server/src/routes/discovery.ts`
+- Create: `server/src/routes/matches.ts`
+- Modify: `server/src/lib/rules.ts`
+- Modify: `server/src/app.ts`
+- Test: `server/tests/explore-social.test.ts`
+
+- [ ] **Step 1: Write failing explore/social API tests**
+
+Create `server/tests/explore-social.test.ts`:
+
+```ts
+import request from 'supertest'
+import { describe, expect, it } from 'vitest'
+import { createApp } from '../src/app'
+
+describe('explore + social api', () => {
+  it('lists pois', async () => {
+    const response = await request(createApp()).get('/api/pois')
+    expect(response.status).toBe(200)
+    expect(Array.isArray(response.body.items)).toBe(true)
+  })
+
+  it('creates a discovery and a match', async () => {
+    const app = createApp()
+    const session = await request(app).post('/api/onboarding/session').send({})
+    const userResponse = await request(app).post('/api/personas/confirm').send({
+      sessionId: session.body.sessionId,
+      nickname: '测试用户',
+      avatarUrl: '/avatars/test.jpg'
+    })
+    const pois = await request(app).get('/api/pois')
+    const poiId = pois.body.items[0].id
+
+    const discovery = await request(app).post('/api/discovery/reveal').send({
+      userId: userResponse.body.user.id,
+      poiId
+    })
+
+    const match = await request(app).post('/api/matches').send({
+      userId: userResponse.body.user.id,
+      discoveryId: discovery.body.discovery.id
+    })
+
+    expect(discovery.status).toBe(200)
+    expect(match.status).toBe(200)
+    expect(match.body.match.chatRounds.length).toBe(3)
+  })
+})
+```
+
+- [ ] **Step 2: Run the tests to verify they fail**
+
+Run:
+
+```bash
+npm --prefix server test -- --run server/tests/explore-social.test.ts
+```
+
+Expected: FAIL because the explore/social routes do not exist.
+
+- [ ] **Step 3: Extend rules and implement the three route files**
+
+Append to `server/src/lib/rules.ts`:
+
+```ts
+export const scoreMatch = (interestTags: string[], poiMoodTags: string[]) => {
+  const overlap = interestTags.filter((tag) => poiMoodTags.includes(tag)).length
+  return Math.min(95, 60 + overlap * 10)
+}
+
+export const buildChatRounds = (nickname: string, poiName: string) => [
+  { speaker: 'match', text: `我看到你也被 ${poiName} 吸引，这个点很特别。` },
+  { speaker: 'user', text: `${nickname} 看起来也会喜欢这种轻松一点的地方。` },
+  { speaker: 'match', text: '也许我们都更适合从地点和兴趣开始慢慢聊起来。' }
+]
+```
+
+Create `server/src/routes/pois.ts`:
+
+```ts
+import { Router } from 'express'
+import { prisma } from '../lib/prisma.js'
+
+export const poisRouter = Router()
+
+poisRouter.get('/', async (_req, res) => {
+  const items = await prisma.poi.findMany({ where: { status: 'active' } })
+  res.json({ items })
+})
+
+poisRouter.get('/:id', async (req, res) => {
+  const item = await prisma.poi.findUnique({ where: { id: req.params.id } })
+  if (!item) return res.status(404).json({ error: { code: 'POI_NOT_FOUND', message: '当前地点不存在或已下线' } })
+  res.json({ item })
+})
+```
+
+Create `server/src/routes/discovery.ts`:
+
+```ts
+import { Router } from 'express'
+import { prisma } from '../lib/prisma.js'
+
+export const discoveryRouter = Router()
+
+discoveryRouter.post('/reveal', async (req, res) => {
+  const { userId, poiId } = req.body as { userId: string; poiId: string }
+  const poi = await prisma.poi.findUnique({ where: { id: poiId } })
+
+  if (!poi) {
+    return res.status(404).json({ error: { code: 'POI_NOT_FOUND', message: '当前地点不存在或已下线' } })
+  }
+
+  const discovery = await prisma.discovery.create({
+    data: {
+      userId,
+      poiId,
+      revealType: 'emotion-box',
+      revealTitle: `在 ${poi.name} 遇见同频灵魂`,
+      revealPayloadJson: JSON.stringify({
+        description: poi.description,
+        moodTags: JSON.parse(poi.moodTags)
+      })
+    }
+  })
+
+  res.json({
+    discovery: {
+      ...discovery,
+      revealPayload: JSON.parse(discovery.revealPayloadJson)
+    }
+  })
+})
+```
+
+Create `server/src/routes/matches.ts`:
+
+```ts
+import { Router } from 'express'
+import { prisma } from '../lib/prisma.js'
+import { buildChatRounds, scoreMatch } from '../lib/rules.js'
+
+export const matchesRouter = Router()
+
+matchesRouter.post('/', async (req, res) => {
+  const { userId, discoveryId } = req.body as { userId: string; discoveryId: string }
+  const user = await prisma.user.findUnique({ where: { id: userId }, include: { persona: true } })
+  const discovery = await prisma.discovery.findUnique({ where: { id: discoveryId }, include: { poi: true } })
+
+  if (!user || !user.persona || !discovery) {
+    return res.status(404).json({ error: { code: 'MATCH_CONTEXT_MISSING', message: '匹配上下文不存在' } })
+  }
+
+  const interestTags = JSON.parse(user.persona.interestTags) as string[]
+  const poiMoodTags = JSON.parse(discovery.poi.moodTags) as string[]
+  const score = scoreMatch(interestTags, poiMoodTags)
+  const chatRounds = buildChatRounds(user.nickname, discovery.poi.name)
+
+  const match = await prisma.match.create({
+    data: {
+      userId,
+      targetProfileName: '暮色观察员',
+      targetAvatarUrl: '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg',
+      score,
+      status: 'completed',
+      reasonSummary: '你们在地点氛围和兴趣切入上高度一致。',
+      chatRoundsJson: JSON.stringify(chatRounds),
+      reportJson: JSON.stringify({
+        label: score >= 80 ? '命中注定的相遇' : '有趣的灵魂',
+        suggestion: '建议从地点感受开始继续聊天。'
+      })
+    }
+  })
+
+  res.json({
+    match: {
+      ...match,
+      chatRounds,
+      report: JSON.parse(match.reportJson)
+    }
+  })
+})
+
+matchesRouter.get('/:id', async (req, res) => {
+  const match = await prisma.match.findUnique({ where: { id: req.params.id } })
+  if (!match) return res.status(404).json({ error: { code: 'MATCH_NOT_FOUND', message: '匹配结果不存在' } })
+  res.json({ match: { ...match, chatRounds: JSON.parse(match.chatRoundsJson) } })
+})
+
+matchesRouter.get('/:id/report', async (req, res) => {
+  const match = await prisma.match.findUnique({ where: { id: req.params.id } })
+  if (!match) return res.status(404).json({ error: { code: 'MATCH_NOT_FOUND', message: '匹配结果不存在' } })
+  res.json({ report: { score: match.score, reasonSummary: match.reasonSummary, ...JSON.parse(match.reportJson) } })
+})
+```
+
+Update `server/src/app.ts` route mounting:
+
+```ts
+import { discoveryRouter } from './routes/discovery.js'
+import { matchesRouter } from './routes/matches.js'
+import { poisRouter } from './routes/pois.js'
+
+app.use('/api/pois', poisRouter)
+app.use('/api/discovery', discoveryRouter)
+app.use('/api/matches', matchesRouter)
+```
+
+- [ ] **Step 4: Run the explore/social tests and backend build**
+
+Run:
+
+```bash
+npm --prefix server test -- --run server/tests/explore-social.test.ts
+npm --prefix server run build
+```
+
+Expected: PASS.
+
+- [ ] **Step 5: Commit the explore/social API layer**
+
+Run:
+
+```bash
+git add server/src/routes/pois.ts server/src/routes/discovery.ts server/src/routes/matches.ts server/src/lib/rules.ts server/src/app.ts server/tests/explore-social.test.ts
+git commit -m "feat: add poi discovery and match apis"
+```
+
+## Task 5: Implement current-user and history APIs
+
+**Files:**
+- Create: `server/src/routes/me.ts`
+- Modify: `server/src/app.ts`
+- Test: `server/tests/me.test.ts`
+
+- [ ] **Step 1: Write failing current-user tests**
+
+Create `server/tests/me.test.ts`:
+
+```ts
+import request from 'supertest'
+import { describe, expect, it } from 'vitest'
+import { createApp } from '../src/app'
+
+describe('me api', () => {
+  it('returns current user and history', async () => {
+    const app = createApp()
+    const session = await request(app).post('/api/onboarding/session').send({})
+    const userResponse = await request(app).post('/api/personas/confirm').send({
+      sessionId: session.body.sessionId,
+      nickname: '旅伴',
+      avatarUrl: '/avatars/test.jpg'
+    })
+
+    const me = await request(app).get(`/api/me?userId=${userResponse.body.user.id}`)
+    const history = await request(app).get(`/api/me/history?userId=${userResponse.body.user.id}`)
+
+    expect(me.status).toBe(200)
+    expect(history.status).toBe(200)
+    expect(me.body.user.nickname).toBe('旅伴')
+    expect(Array.isArray(history.body.items)).toBe(true)
+  })
+})
+```
+
+- [ ] **Step 2: Run the tests to verify they fail**
+
+Run:
+
+```bash
+npm --prefix server test -- --run server/tests/me.test.ts
+```
+
+Expected: FAIL because `/api/me` routes do not exist.
+
+- [ ] **Step 3: Implement the routes and mount them**
+
+Create `server/src/routes/me.ts`:
+
+```ts
+import { Router } from 'express'
+import { prisma } from '../lib/prisma.js'
+
+export const meRouter = Router()
+
+meRouter.get('/', async (req, res) => {
+  const userId = String(req.query.userId ?? '')
+  const user = await prisma.user.findUnique({ where: { id: userId }, include: { persona: true } })
+
+  if (!user) {
+    return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '当前用户不存在' } })
+  }
+
+  res.json({
+    user: {
+      ...user,
+      persona: user.persona
+        ? {
+            ...user.persona,
+            moodTags: JSON.parse(user.persona.moodTags),
+            interestTags: JSON.parse(user.persona.interestTags)
+          }
+        : null
+    }
+  })
+})
+
+meRouter.get('/history', async (req, res) => {
+  const userId = String(req.query.userId ?? '')
+  const items = await prisma.match.findMany({
+    where: { userId },
+    orderBy: { createdAt: 'desc' }
+  })
+
+  res.json({
+    items: items.map((item) => ({
+      ...item,
+      report: JSON.parse(item.reportJson)
+    }))
+  })
+})
+```
+
+Update `server/src/app.ts`:
+
+```ts
+import { meRouter } from './routes/me.js'
+
+app.use('/api/me', meRouter)
+```
+
+- [ ] **Step 4: Run the tests and the full backend suite**
+
+Run:
+
+```bash
+npm --prefix server test -- --run server/tests/me.test.ts
+npm --prefix server run test
+```
+
+Expected: PASS.
+
+- [ ] **Step 5: Commit the profile/history API layer**
+
+Run:
+
+```bash
+git add server/src/routes/me.ts server/src/app.ts server/tests/me.test.ts
+git commit -m "feat: add current user and match history apis"
+```
+
+## Task 6: Add frontend API client and session store
+
+**Files:**
+- Create: `src/types/api.ts`
+- Create: `src/lib/api.ts`
+- Create: `src/stores/session.ts`
+- Test: `src/lib/api.test.ts`
+
+- [ ] **Step 1: Write the failing frontend API/client test**
+
+Create `src/lib/api.test.ts`:
+
+```ts
+import { describe, expect, it, vi } from 'vitest'
+import { apiClient } from './api'
+
+describe('api client', () => {
+  it('parses json responses', async () => {
+    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
+      ok: true,
+      json: async () => ({ status: 'ok' })
+    }))
+
+    const result = await apiClient.get('/health')
+    expect(result).toEqual({ status: 'ok' })
+  })
+})
+```
+
+- [ ] **Step 2: Run the test to verify it fails**
+
+Run:
+
+```bash
+npx vitest run src/lib/api.test.ts
+```
+
+Expected: FAIL because `src/lib/api.ts` does not exist and Vitest is not configured in the frontend package.
+
+- [ ] **Step 3: Add the API types, client, and store**
+
+Create `src/types/api.ts`:
+
+```ts
+export interface PersonaDraft {
+  mbti?: string
+  socialStyle: string
+  interestTags: string[]
+  tone: string
+  summary: string
+}
+
+export interface OnboardingSessionResponse {
+  sessionId: string
+  reply: string
+  personaDraft: PersonaDraft
+}
+
+export interface MatchRound {
+  speaker: 'match' | 'user'
+  text: string
+}
+```
+
+Create `src/lib/api.ts`:
+
+```ts
+const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'
+
+const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
+  const response = await fetch(`${API_BASE_URL}${path}`, {
+    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
+    ...init
+  })
+
+  const data = await response.json()
+  if (!response.ok) {
+    throw new Error(data.error?.message ?? '请求失败')
+  }
+
+  return data as T
+}
+
+export const apiClient = {
+  get: <T>(path: string) => request<T>(path),
+  post: <T>(path: string, body: unknown) =>
+    request<T>(path, { method: 'POST', body: JSON.stringify(body) })
+}
+```
+
+Create `src/stores/session.ts`:
+
+```ts
+import { defineStore } from 'pinia'
+
+export const useSessionStore = defineStore('session', {
+  state: () => ({
+    sessionId: '',
+    userId: '',
+    currentMatchId: '',
+    currentDiscoveryId: ''
+  }),
+  actions: {
+    setSessionId(sessionId: string) {
+      this.sessionId = sessionId
+    },
+    setUserId(userId: string) {
+      this.userId = userId
+    },
+    setCurrentMatchId(matchId: string) {
+      this.currentMatchId = matchId
+    },
+    setCurrentDiscoveryId(discoveryId: string) {
+      this.currentDiscoveryId = discoveryId
+    }
+  }
+})
+```
+
+- [ ] **Step 4: Add frontend test tooling and rerun the test**
+
+Update root `package.json` devDependencies and scripts:
+
+```json
+{
+  "scripts": {
+    "test": "vitest run"
+  },
+  "devDependencies": {
+    "vitest": "^3.0.9"
+  }
+}
+```
+
+Run:
+
+```bash
+npm install
+npx vitest run src/lib/api.test.ts
+```
+
+Expected: PASS.
+
+- [ ] **Step 5: Commit the frontend data-access layer**
+
+Run:
+
+```bash
+git add package.json package-lock.json src/types/api.ts src/lib/api.ts src/lib/api.test.ts src/stores/session.ts
+git commit -m "feat: add frontend api client and session store"
+```
+
+## Task 7: Wire onboarding pages to real APIs
+
+**Files:**
+- Modify: `src/views/onboarding/AiGuideChat.vue`
+- Modify: `src/views/onboarding/ConfirmPersona.vue`
+- Test: `src/views/onboarding/AiGuideChat.vue` via build + manual route check
+
+- [ ] **Step 1: Replace local onboarding bootstrapping with session API calls**
+
+In `src/views/onboarding/AiGuideChat.vue`, replace the initial mock-only message seeding with:
+
+```ts
+import { apiClient } from '../../lib/api'
+import { useSessionStore } from '../../stores/session'
+
+const sessionStore = useSessionStore()
+
+onMounted(async () => {
+  initSpeechRecognition()
+  if (messages.value.length > 0) return
+
+  const data = await apiClient.post<{
+    sessionId: string
+    reply: string
+    personaDraft: Record<string, unknown>
+  }>('/api/onboarding/session', {})
+
+  sessionStore.setSessionId(data.sessionId)
+  addAiMessage(data.reply)
+})
+```
+
+- [ ] **Step 2: Replace `sendMessageToLLM` with onboarding chat API**
+
+Replace the current mock method with:
+
+```ts
+const sendMessageToLLM = async (userText: string): Promise<string> => {
+  const response = await apiClient.post<{
+    reply: string
+    done: boolean
+  }>('/api/onboarding/chat', {
+    sessionId: sessionStore.sessionId,
+    message: userText,
+    inputMode: inputMode.value
+  })
+
+  return response.done ? `[DONE] ${response.reply}` : response.reply
+}
+```
+
+- [ ] **Step 3: Persist user creation from the confirm page**
+
+In `src/views/onboarding/ConfirmPersona.vue`, update confirm handling:
+
+```ts
+import { apiClient } from '../../lib/api'
+import { useSessionStore } from '../../stores/session'
+
+const sessionStore = useSessionStore()
+
+const handleConfirm = async () => {
+  if (!nickname.value.trim()) return
+
+  const response = await apiClient.post<{ user: { id: string } }>('/api/personas/confirm', {
+    sessionId: sessionStore.sessionId,
+    nickname: nickname.value.trim(),
+    avatarUrl: avatarUrl.value
+  })
+
+  sessionStore.setUserId(response.user.id)
+  void router.push('/map')
+}
+```
+
+- [ ] **Step 4: Run build verification and manually validate onboarding flow**
+
+Run:
+
+```bash
+npm run build
+```
+
+Expected: PASS.
+
+Manual path to verify:
+
+```