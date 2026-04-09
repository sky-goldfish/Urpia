# Handdrawn Social Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme the main app into a hand-drawn cream-paper style, rebuild the homepage around a stacked photo-card composition, and carry the same design language through navigation, social, and profile surfaces without breaking existing routes or behaviors.

**Architecture:** Keep the current Vue 3 route structure and business data intact, but move the visual center of gravity into a shared paper/sketch design system in the global stylesheet. Rebuild the discover page layout in place inside `ExploreMap.vue`, then restyle shared navigation and downstream social/profile surfaces so the app feels coherent from route to route.

**Tech Stack:** Vue 3, Vue Router 4, Pinia, TypeScript, Vite, Tailwind CSS v4, Vitest, Vue Test Utils

---

## File Structure

- Modify: `D:/CodeWorkSpace/xiaohongshu/package.json`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/assets/styles/main.css`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/components/ui/TabBar.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/explore/ExploreMap.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/social/SocialPage.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/social/SocialMatchChat.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/social/MatchReport.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/profile/PersonaStatus.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/profile/MatchHistory.vue`
- Create: `D:/CodeWorkSpace/xiaohongshu/vitest.config.ts`
- Create: `D:/CodeWorkSpace/xiaohongshu/src/test/setup.ts`
- Create: `D:/CodeWorkSpace/xiaohongshu/src/components/ui/__tests__/TabBar.spec.ts`
- Create: `D:/CodeWorkSpace/xiaohongshu/src/views/explore/__tests__/ExploreMap.spec.ts`

### Task 1: Add UI Smoke-Test Infrastructure

**Files:**
- Modify: `D:/CodeWorkSpace/xiaohongshu/package.json`
- Create: `D:/CodeWorkSpace/xiaohongshu/vitest.config.ts`
- Create: `D:/CodeWorkSpace/xiaohongshu/src/test/setup.ts`
- Create: `D:/CodeWorkSpace/xiaohongshu/src/components/ui/__tests__/TabBar.spec.ts`
- Create: `D:/CodeWorkSpace/xiaohongshu/src/views/explore/__tests__/ExploreMap.spec.ts`

- [ ] **Step 1: Add failing test dependencies and scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-vue": "^5.2.1",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.6.0",
    "vite": "^6.0.1",
    "vitest": "^2.1.8",
    "vue-tsc": "^2.2.0"
  }
}
```

- [ ] **Step 2: Add Vitest config and DOM setup**

```ts
// D:/CodeWorkSpace/xiaohongshu/vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

```ts
// D:/CodeWorkSpace/xiaohongshu/src/test/setup.ts
import { config } from '@vue/test-utils'

config.global.stubs = {
  Transition: false,
}
```

- [ ] **Step 3: Write the failing navigation smoke test**

```ts
// D:/CodeWorkSpace/xiaohongshu/src/components/ui/__tests__/TabBar.spec.ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import TabBar from '../TabBar.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/map', component: { template: '<div />' }, meta: { tab: 'explore' } },
    { path: '/profile', component: { template: '<div />' }, meta: { tab: 'status' } },
    { path: '/match', component: { template: '<div />' }, meta: { tab: 'social' } },
  ],
})

describe('TabBar', () => {
  it('renders all three primary tabs with the new labels', async () => {
    router.push('/map')
    await router.isReady()

    const wrapper = mount(TabBar, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Discover')
    expect(wrapper.text()).toContain('Social')
    expect(wrapper.text()).toContain('Profile')
  })
})
```

- [ ] **Step 4: Write the failing discover hero smoke test**

```ts
// D:/CodeWorkSpace/xiaohongshu/src/views/explore/__tests__/ExploreMap.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import ExploreMap from '../ExploreMap.vue'

vi.mock('../../../lib/amapLoader', () => ({
  loadAMap: vi.fn(async () => ({
    Map: class {
      destroy() {}
      setCenter() {}
      setZoom() {}
      setZoomAndCenter() {}
    },
    Marker: class {
      setMap() {}
    },
    ToolBar: class {},
  })),
}))

vi.mock('../../../config/mapConfig', () => ({
  MAP_CONFIG: {
    DEFAULT_CENTER: [121.4489, 31.2295],
    DEFAULT_ZOOM: 12,
    DEFAULT_VIEW_MODE: '2D',
  },
  assertMapConfig: () => undefined,
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/map', component: ExploreMap, meta: { tab: 'explore' } }],
})

describe('ExploreMap', () => {
  it('renders the handdrawn hero card and connect action', async () => {
    router.push('/map')
    await router.isReady()

    const wrapper = mount(ExploreMap, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain("Today's Vibe")
    expect(wrapper.text()).toContain('Connect')
  })
})
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because `TabBar.vue` and `ExploreMap.vue` do not yet render the new labels and hero-card content.

- [ ] **Step 6: Commit the scaffolding**

```bash
git add package.json vitest.config.ts src/test/setup.ts src/components/ui/__tests__/TabBar.spec.ts src/views/explore/__tests__/ExploreMap.spec.ts
git commit -m "test: add UI smoke coverage for redesign"
```

### Task 2: Build The Global Handdrawn Design System

**Files:**
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/assets/styles/main.css`

- [ ] **Step 1: Write the failing style expectation into the discover smoke test**

```ts
expect(wrapper.find('.paper-app-shell').exists()).toBe(true)
expect(wrapper.find('.stack-card').exists()).toBe(true)
```

- [ ] **Step 2: Run the targeted test to confirm the new utility classes are absent**

Run: `npm test -- ExploreMap.spec.ts`

Expected: FAIL with missing `.paper-app-shell` or `.stack-card`.

- [ ] **Step 3: Replace the global design tokens and shared utility classes**

```css
@import "tailwindcss";

:root {
  --paper-bg: #f7f1e8;
  --paper-bg-soft: #fbf8f1;
  --paper-card: #fffdf8;
  --ink-900: #3c3836;
  --ink-700: #5c5653;
  --line: #4a4542;
  --blush: #f1b7b4;
  --mint: #d8ead2;
  --powder: #dce8ef;
  --butter: #f6e7b0;
  --shadow-paper: 0 10px 24px rgba(95, 79, 69, 0.12);
  --radius-sketch: 28px 18px 30px 20px / 20px 26px 18px 32px;
  color: var(--ink-900);
  background: radial-gradient(circle at top, #fffaf1 0%, var(--paper-bg) 52%, #efe6d8 100%);
  font-family: "Trebuchet MS", "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
}

body {
  margin: 0;
  min-height: 100dvh;
  color: var(--ink-900);
}

.paper-app-shell {
  position: relative;
  min-height: 100dvh;
  width: min(100%, 430px);
  margin-inline: auto;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 10%, rgba(255,255,255,0.75), transparent 26%),
    radial-gradient(circle at 90% 12%, rgba(241,183,180,0.16), transparent 24%),
    linear-gradient(180deg, #fcf8f0 0%, #f5efe5 100%);
}

.sketch-card {
  position: relative;
  border: 2px solid var(--line);
  border-radius: var(--radius-sketch);
  background: var(--paper-card);
  box-shadow: var(--shadow-paper);
}

.stack-card::before,
.stack-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid var(--line);
  background: rgba(255, 253, 248, 0.92);
  border-radius: var(--radius-sketch);
  z-index: -1;
}

.stack-card::before {
  transform: translate(8px, 7px) rotate(1.2deg);
}

.stack-card::after {
  transform: translate(-6px, 4px) rotate(-1deg);
}

.paper-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--line);
  border-radius: 14px 12px 13px 15px / 12px 16px 11px 14px;
  background: var(--powder);
  padding: 8px 14px;
}

.circle-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border: 2px solid var(--line);
  border-radius: 999px;
  background: var(--paper-card);
  box-shadow: 0 6px 14px rgba(95, 79, 69, 0.08);
}
```

- [ ] **Step 4: Run the targeted test to verify the shared classes exist in render output**

Run: `npm test -- ExploreMap.spec.ts`

Expected: PASS for utility-class presence assertions; other assertions may still fail until the page markup is updated.

- [ ] **Step 5: Commit the design-system foundation**

```bash
git add src/assets/styles/main.css src/views/explore/__tests__/ExploreMap.spec.ts
git commit -m "feat: add handdrawn paper design tokens"
```

### Task 3: Rebuild The Bottom Navigation In The New Style

**Files:**
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/components/ui/TabBar.vue`
- Test: `D:/CodeWorkSpace/xiaohongshu/src/components/ui/__tests__/TabBar.spec.ts`

- [ ] **Step 1: Extend the failing test to assert the new accessible labels and active-state shell**

```ts
expect(wrapper.find('nav.paper-tabbar').exists()).toBe(true)
expect(wrapper.text()).toContain('Discover')
expect(wrapper.text()).toContain('Social')
expect(wrapper.text()).toContain('Profile')
```

- [ ] **Step 2: Run the tab bar test and confirm failure**

Run: `npm test -- TabBar.spec.ts`

Expected: FAIL because the current tab bar uses the old minimalist shell and Chinese labels.

- [ ] **Step 3: Rewrite `TabBar.vue` using the shared paper/sketch classes**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type MainTabKey = 'explore' | 'status' | 'social'

interface TabItem {
  key: MainTabKey
  label: string
  icon: string
  to: string
}

const route = useRoute()
const router = useRouter()

const tabs: TabItem[] = [
  { key: 'explore', label: 'Discover', icon: 'search', to: '/map' },
  { key: 'social', label: 'Social', icon: 'chat_bubble', to: '/match' },
  { key: 'status', label: 'Profile', icon: 'person', to: '/profile' },
]

const activeTab = computed<MainTabKey | null>(() => {
  const matchedWithTab = [...route.matched].reverse().find((record) => {
    const tab = record.meta.tab
    return tab === 'explore' || tab === 'status' || tab === 'social'
  })

  const tab = matchedWithTab?.meta.tab
  return tab === 'explore' || tab === 'status' || tab === 'social' ? tab : null
})

const navigate = (to: string) => {
  if (route.path !== to) {
    void router.push(to)
  }
}
</script>

<template>
  <nav class="paper-tabbar fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px]" aria-label="Main navigation">
    <div class="paper-tabbar__line" aria-hidden="true" />
    <div class="paper-tabbar__inner">
      <button
        v-for="tab in tabs"
        :key="tab.to"
        type="button"
        class="paper-tabbar__item"
        :class="{ 'is-active': activeTab === tab.key }"
        :aria-current="activeTab === tab.key ? 'page' : undefined"
        @click="navigate(tab.to)"
      >
        <span class="material-symbols-outlined">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
```

- [ ] **Step 4: Add the supporting tab-bar utility styles**

```css
.paper-tabbar {
  background: linear-gradient(180deg, rgba(252,248,240,0.96), rgba(247,241,232,0.98));
}

.paper-tabbar__line {
  height: 8px;
  background: no-repeat center/100% 100%;
  mask: linear-gradient(#000, #000);
  border-top: 2px solid var(--line);
  opacity: 0.75;
}

.paper-tabbar__inner {
  display: flex;
  justify-content: space-around;
  padding: 10px 12px calc(env(safe-area-inset-bottom) + 10px);
}

.paper-tabbar__item {
  display: flex;
  min-width: 72px;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--ink-700);
}

.paper-tabbar__item.is-active {
  color: var(--ink-900);
  font-weight: 700;
}
```

- [ ] **Step 5: Run the tab bar test to verify it passes**

Run: `npm test -- TabBar.spec.ts`

Expected: PASS

- [ ] **Step 6: Commit the tab bar rewrite**

```bash
git add src/components/ui/TabBar.vue src/components/ui/__tests__/TabBar.spec.ts src/assets/styles/main.css
git commit -m "feat: redraw tab bar in handdrawn style"
```

### Task 4: Rebuild The Discover Homepage Around The Photo Card

**Files:**
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/explore/ExploreMap.vue`
- Test: `D:/CodeWorkSpace/xiaohongshu/src/views/explore/__tests__/ExploreMap.spec.ts`

- [ ] **Step 1: Expand the failing page test with homepage-specific assertions**

```ts
expect(wrapper.text()).toContain("Today's Vibe")
expect(wrapper.text()).toContain('Feeling Adventurous')
expect(wrapper.text()).toContain('Pass')
expect(wrapper.text()).toContain('Connect')
```

- [ ] **Step 2: Run the discover test and confirm failure**

Run: `npm test -- ExploreMap.spec.ts`

Expected: FAIL because the current page is still map-first and does not render the hero-card layout.

- [ ] **Step 3: Restructure `ExploreMap.vue` so the hero card becomes the main stage**

```vue
<template>
  <main class="paper-app-shell">
    <section class="relative min-h-[100dvh] overflow-hidden px-5 pb-[calc(env(safe-area-inset-bottom)+110px)] pt-[calc(env(safe-area-inset-top)+16px)]">
      <div ref="mapContainer" class="absolute inset-x-5 bottom-[140px] z-0 h-[188px] overflow-hidden rounded-[28px] opacity-60" />

      <header class="relative z-10 flex items-center justify-center gap-3 pt-2">
        <span class="text-[30px]">ʕ·ᴥ·ʔ</span>
        <h1 class="font-['Comic_Sans_MS'] text-[34px] leading-none text-[var(--ink-900)]">Today's Vibe</h1>
        <span class="text-[30px]">ʕ·ᴥ·ʔ</span>
      </header>

      <div class="relative z-10 mx-auto mt-8 w-full max-w-[312px]">
        <article class="stack-card sketch-card px-5 pb-6 pt-5">
          <div class="overflow-hidden rounded-[24px] border-[2px] border-[var(--line)] bg-[#f3d6c9]">
            <img :src="featuredProfile.avatar" :alt="featuredProfile.name" class="h-[320px] w-full object-cover" />
          </div>
          <h2 class="mt-5 text-center font-['Comic_Sans_MS'] text-[36px] leading-none">{{ featuredProfile.name }}, {{ featuredProfile.age }}</h2>
          <div class="mt-4 flex justify-center">
            <span class="paper-tag text-[17px] italic">Feeling Adventurous</span>
          </div>
        </article>
      </div>

      <div class="relative z-10 mt-10 flex items-start justify-center gap-12">
        <button type="button" class="flex flex-col items-center gap-3" @click="dismissProfile">
          <span class="circle-action bg-[#e7e8e2]">
            <span class="material-symbols-outlined text-[40px]">close</span>
          </span>
          <span class="font-['Comic_Sans_MS'] text-[22px]">Pass</span>
        </button>
        <button type="button" class="flex flex-col items-center gap-3" @click="openMatchChat">
          <span class="circle-action bg-[var(--mint)]">
            <span class="material-symbols-outlined text-[40px] text-[#d78391]">favorite</span>
          </span>
          <span class="font-['Comic_Sans_MS'] text-[22px]">Connect</span>
        </button>
      </div>

      <button type="button" class="sketch-card absolute left-5 right-5 bottom-[98px] z-10 flex items-center justify-between px-4 py-3" @click="goToMapDetail">
        <span class="text-[14px] font-semibold">Explore nearby vibe spots</span>
        <span class="material-symbols-outlined">map</span>
      </button>

      <SocialMatchChat :visible="showMatchChat" @close="closeMatchChat" />
      <TabBar />
    </section>
  </main>
</template>
```

- [ ] **Step 4: Keep map behavior as a secondary surface instead of the primary layout**

```ts
const featuredProfile = {
  name: 'Mia',
  age: 25,
  avatar: '/avatars/4c4eae51-6996-40bf-b175-5a2e692a1301.jpg',
}

const dismissProfile = () => {
  activeMood.value = null
}

const goToMapDetail = () => {
  void router.push('/discovery')
}
```

- [ ] **Step 5: Run the discover test to verify the new homepage passes**

Run: `npm test -- ExploreMap.spec.ts`

Expected: PASS

- [ ] **Step 6: Commit the homepage rebuild**

```bash
git add src/views/explore/ExploreMap.vue src/views/explore/__tests__/ExploreMap.spec.ts src/assets/styles/main.css
git commit -m "feat: rebuild discover homepage as handdrawn photo card"
```

### Task 5: Restyle Social Surfaces To Match The New Visual Language

**Files:**
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/social/SocialPage.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/social/SocialMatchChat.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/social/MatchReport.vue`

- [ ] **Step 1: Add a failing smoke assertion for the social CTA shell**

```ts
expect(wrapper.find('.sketch-card').exists()).toBe(true)
```

- [ ] **Step 2: Run the full test suite and confirm social surfaces are still unstyled**

Run: `npm test`

Expected: FAIL or incomplete coverage because the social routes still render the old white/glass presentation.

- [ ] **Step 3: Replace the social page shell and chat panel styling**

```vue
<main class="paper-app-shell">
  <div class="relative min-h-[100dvh] bg-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+18px)]">
    <div class="sketch-card mx-auto max-w-[360px] bg-[var(--paper-card)] px-4 py-3 text-center">
      <p class="font-['Comic_Sans_MS'] text-[24px]">A Little Spark Is Starting</p>
    </div>
    <SocialMatchChat :visible="showMatchChat" @close="closeMatchChat" />
    <TabBar />
  </div>
</main>
```

```vue
<div class="absolute inset-x-0 bottom-0 z-40 rounded-t-[30px] border-[2px] border-b-0 border-[var(--line)] bg-[var(--paper-card)]" style="height: 50dvh;">
  <div class="mx-auto mt-3 h-[6px] w-16 rounded-full bg-[rgba(74,69,66,0.18)]" />
  <div class="px-5 py-3">
    <div class="paper-tag text-[13px]">Round {{ progress }}/{{ totalRounds }}</div>
  </div>
</div>
```

- [ ] **Step 4: Restyle match report cards and CTAs with the shared paper classes**

```vue
<section class="paper-app-shell page-padding tabbar-padding">
  <header class="sketch-card px-5 py-4 text-center">
    <h1 class="font-['Comic_Sans_MS'] text-[30px]">Match Notes</h1>
  </header>
</section>
```

- [ ] **Step 5: Run build and tests to verify the social route still compiles and renders**

Run: `npm test && npm run build`

Expected: PASS

- [ ] **Step 6: Commit the social restyle**

```bash
git add src/views/social/SocialPage.vue src/views/social/SocialMatchChat.vue src/views/social/MatchReport.vue src/assets/styles/main.css
git commit -m "feat: restyle social flow with paper panels"
```

### Task 6: Restyle Profile Surfaces As Scrapbook Dossier Pages

**Files:**
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/profile/PersonaStatus.vue`
- Modify: `D:/CodeWorkSpace/xiaohongshu/src/views/profile/MatchHistory.vue`

- [ ] **Step 1: Add a failing profile smoke assertion**

```ts
expect(wrapper.text()).toContain('Mood Archive')
```

- [ ] **Step 2: Run the profile-focused tests or build to confirm the new copy/layout is absent**

Run: `npm run build`

Expected: PASS build, but the profile page still uses the old orbit-bubble layout and needs redesign.

- [ ] **Step 3: Recompose `PersonaStatus.vue` into stacked paper modules**

```vue
<main class="paper-app-shell">
  <div class="px-5 pb-[calc(env(safe-area-inset-bottom)+98px)] pt-[calc(env(safe-area-inset-top)+18px)]">
    <section class="stack-card sketch-card px-5 pb-6 pt-5 text-center">
      <img :src="avatarUrl" :alt="nickname" class="mx-auto h-[220px] w-[220px] rounded-[26px] border-[2px] border-[var(--line)] object-cover" />
      <h1 class="mt-4 font-['Comic_Sans_MS'] text-[34px]">{{ nickname }}</h1>
      <span class="paper-tag mt-3">ENFP</span>
    </section>

    <section class="sketch-card mt-5 px-4 py-4">
      <h2 class="font-['Comic_Sans_MS'] text-[26px]">Mood Archive</h2>
      <div v-for="attr in moodAttrs" :key="attr.name" class="mt-3">
        <div class="flex items-center justify-between text-[14px]">
          <span>{{ attr.name }}</span>
          <span>{{ attr.value }}%</span>
        </div>
        <div class="mt-2 h-3 rounded-full border-[2px] border-[var(--line)] bg-[#f5ecdf]">
          <div class="h-full rounded-full" :style="{ width: `${attr.value}%`, backgroundColor: attr.color }" />
        </div>
      </div>
    </section>
  </div>
</main>
```

- [ ] **Step 4: Restyle history cards into paper-note modules**

```vue
<article class="sketch-card p-4">
  <p class="font-['Comic_Sans_MS'] text-[24px]">Recent Encounters</p>
</article>
```

- [ ] **Step 5: Run build to verify profile pages still compile**

Run: `npm run build`

Expected: PASS

- [ ] **Step 6: Commit the profile restyle**

```bash
git add src/views/profile/PersonaStatus.vue src/views/profile/MatchHistory.vue src/assets/styles/main.css
git commit -m "feat: restyle profile pages as scrapbook dossier"
```

### Task 7: Final Verification And Cleanup

**Files:**
- Review only: `D:/CodeWorkSpace/xiaohongshu/src/assets/styles/main.css`
- Review only: `D:/CodeWorkSpace/xiaohongshu/src/components/ui/TabBar.vue`
- Review only: `D:/CodeWorkSpace/xiaohongshu/src/views/explore/ExploreMap.vue`
- Review only: `D:/CodeWorkSpace/xiaohongshu/src/views/social/SocialMatchChat.vue`
- Review only: `D:/CodeWorkSpace/xiaohongshu/src/views/profile/PersonaStatus.vue`

- [ ] **Step 1: Run the automated checks**

Run: `npm test && npm run build`

Expected: PASS

- [ ] **Step 2: Run the app for manual mobile verification**

Run: `npm run dev`

Expected: Vite dev server starts successfully and the following routes can be checked in a mobile viewport: `/map`, `/match`, `/report`, `/profile`, `/history`.

- [ ] **Step 3: Manually verify the critical product behaviors**

```text
1. `/map` shows the stacked photo-card homepage with real avatar image.
2. The positive homepage action still opens the social chat overlay.
3. The "Explore nearby vibe spots" entry still leads into the discovery/map flow.
4. The bottom navigation remains fixed and routes correctly between discover, social, and profile.
5. Social chat and report pages use the same cream-paper/sketch visual language.
6. Profile and history pages no longer use the old orbit-bubble layout.
```

- [ ] **Step 4: Commit any final polish from verification**

```bash
git add src/assets/styles/main.css src/components/ui/TabBar.vue src/views/explore/ExploreMap.vue src/views/social/SocialPage.vue src/views/social/SocialMatchChat.vue src/views/social/MatchReport.vue src/views/profile/PersonaStatus.vue src/views/profile/MatchHistory.vue
git commit -m "chore: polish handdrawn redesign after verification"
```

## Self-Review

- Spec coverage:
  - Global hand-drawn visual language is covered in Task 2.
  - Homepage rebuild around the photo card is covered in Task 4.
  - Three-tab navigation preservation is covered in Task 3.
  - Social surfaces are covered in Task 5.
  - Profile scrapbook treatment is covered in Task 6.
  - Build and manual regression checks are covered in Task 7.

- Placeholder scan:
  - No `TODO`, `TBD`, or "handle appropriately" placeholders remain.
  - All tasks include explicit files, commands, and expected outputs.

- Type consistency:
  - Shared class names use the same naming family across tasks: `.paper-app-shell`, `.sketch-card`, `.stack-card`, `.paper-tag`, `.circle-action`.
  - Route destinations stay aligned with the current router: `/map`, `/match`, `/profile`, `/report`, `/history`, `/discovery`.
