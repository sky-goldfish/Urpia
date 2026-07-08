<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const entryPoints = [
  { label: '开始体验', path: '/onboarding/login', icon: 'play_arrow' },
  { label: '进入地图', path: '/map', icon: 'explore' },
  { label: '查看状态', path: '/profile', icon: 'person' },
]

const highlights = [
  { value: '3D', label: '分身养成' },
  { value: 'Mood', label: '情绪标签' },
  { value: 'Map', label: '城市探索' },
  { value: 'A2A', label: '同频社交' },
]

const productLoop = [
  '用引导式对话捕捉当下情绪与偏好',
  '在城市地图中点亮店铺故事与盲盒发现',
  '把足迹、记忆和情绪沉淀为可互动分身',
  '基于真实探索轨迹触发社交匹配与对话',
]

const goTo = (path: string) => {
  void router.push(path)
}
</script>

<template>
  <main class="home-page">
    <section class="hero-shell">
      <div class="hero-copy">
        <p class="hero-kicker">XHS Hackathon Project</p>
        <h1>Urpia</h1>
        <p class="hero-title">情绪探店地图</p>
        <p class="hero-lede">
          面向 Z 世代的线下探索原型，把情绪表达、探店内容、3D 分身和同频社交串成一条可体验的移动端产品链路。
        </p>

        <div class="hero-actions" aria-label="入口">
          <button
            v-for="entry in entryPoints"
            :key="entry.path"
            type="button"
            class="hero-action"
            :class="{ primary: entry.path === '/onboarding/login' }"
            @click="goTo(entry.path)"
          >
            <span class="material-symbols-outlined" aria-hidden="true">{{ entry.icon }}</span>
            <span>{{ entry.label }}</span>
          </button>
        </div>

        <dl class="highlight-grid" aria-label="项目亮点">
          <div v-for="item in highlights" :key="item.label" class="highlight-item">
            <dt>{{ item.value }}</dt>
            <dd>{{ item.label }}</dd>
          </div>
        </dl>
      </div>

      <section class="demo-stage" aria-label="Urpia demo video">
        <div class="demo-device">
          <video
            class="demo-video"
            src="/media/urpia-demo.mp4"
            poster="/media/urpia-frame-map.jpg"
            controls
            playsinline
            preload="metadata"
          />
        </div>
        <div class="demo-caption">
          <span class="material-symbols-outlined" aria-hidden="true">smart_display</span>
          <span>109 秒完整 demo</span>
        </div>
      </section>
    </section>

    <section class="loop-section" aria-label="产品链路">
      <div class="loop-copy">
        <p class="section-kicker">Product Loop</p>
        <h2>从“今天想去哪”到“和谁一起去”</h2>
      </div>

      <ol class="loop-list">
        <li v-for="(item, index) in productLoop" :key="item">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <p>{{ item }}</p>
        </li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100dvh;
  color: #1d1d1f;
  background:
    linear-gradient(180deg, rgba(234, 243, 239, 0.95) 0, rgba(247, 247, 248, 0.98) 34%, #f7f7f8 100%),
    #f7f7f8;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(340px, 0.72fr);
  gap: clamp(32px, 6vw, 86px);
  min-height: 100dvh;
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + 62px) 32px 56px;
  align-items: center;
}

.hero-copy {
  min-width: 0;
}

.hero-kicker,
.section-kicker {
  margin: 0;
  color: #6c6c70;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 18px 0 0;
  font-size: clamp(78px, 13vw, 148px);
  font-weight: 500;
  line-height: 0.9;
}

.hero-title {
  margin: 20px 0 0;
  font-size: clamp(34px, 5vw, 58px);
  font-weight: 600;
  line-height: 1.1;
}

.hero-lede {
  max-width: 680px;
  margin: 26px 0 0;
  color: #3a3a3c;
  font-size: clamp(18px, 2.4vw, 25px);
  line-height: 1.68;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.hero-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  border: 1px solid rgba(29, 29, 31, 0.12);
  border-radius: 999px;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.72);
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 650;
  box-shadow: 0 12px 28px rgba(29, 29, 31, 0.06);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.hero-action.primary {
  border-color: #1d1d1f;
  background: #1d1d1f;
  color: #ffffff;
}

.hero-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 38px rgba(29, 29, 31, 0.1);
}

.hero-action:active {
  transform: translateY(0);
}

.hero-action .material-symbols-outlined {
  font-size: 20px;
}

.highlight-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  max-width: 620px;
  margin: 38px 0 0;
}

.highlight-item {
  margin: 0;
  border-top: 1px solid rgba(29, 29, 31, 0.12);
  padding-top: 16px;
}

.highlight-item dt {
  color: #1d1d1f;
  font-size: 24px;
  font-weight: 720;
  line-height: 1;
}

.highlight-item dd {
  margin: 8px 0 0;
  color: #6c6c70;
  font-size: 13px;
}

.demo-stage {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.demo-device {
  width: min(100%, 342px);
  aspect-ratio: 540 / 1172;
  border: 12px solid #ffffff;
  border-radius: 44px;
  background: #f2f2f7;
  box-shadow:
    0 30px 80px rgba(29, 29, 31, 0.22),
    inset 0 0 0 1px rgba(29, 29, 31, 0.08);
  overflow: hidden;
}

.demo-video {
  display: block;
  width: 100%;
  height: 100%;
  background: #f2f2f7;
  object-fit: cover;
}

.demo-caption {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6c6c70;
  font-size: 14px;
  font-weight: 600;
}

.demo-caption .material-symbols-outlined {
  font-size: 19px;
}

.loop-section {
  display: grid;
  grid-template-columns: minmax(260px, 0.48fr) minmax(0, 1fr);
  gap: 36px;
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: 0 32px 80px;
}

.loop-copy h2 {
  margin: 12px 0 0;
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.18;
}

.loop-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.loop-list li {
  display: flex;
  gap: 16px;
  min-height: 116px;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 8px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.72);
}

.loop-list span {
  color: #9b8ec4;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.loop-list p {
  margin: 0;
  color: #2c2c2e;
  font-size: 16px;
  line-height: 1.55;
}

@media (max-width: 880px) {
  .hero-shell,
  .loop-section {
    grid-template-columns: 1fr;
  }

  .hero-shell {
    padding-top: calc(env(safe-area-inset-top) + 34px);
  }

  .demo-stage {
    align-items: flex-start;
  }

  .demo-device {
    width: min(72vw, 310px);
  }
}

@media (max-width: 560px) {
  .hero-shell {
    gap: 38px;
    padding-inline: 20px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-action {
    width: 100%;
  }

  .highlight-grid,
  .loop-list {
    grid-template-columns: 1fr 1fr;
  }

  .loop-section {
    padding-inline: 20px;
  }

  .loop-list li {
    min-height: 132px;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
