<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { personas } from '../../lib/mockData'

const router = useRouter()
const moodIndex = ref(0)
const moods = ['情绪平稳', '适合轻连接', '建议低噪环境']

const persona = computed(() => personas[0])
const currentMood = computed(() => moods[moodIndex.value] ?? moods[0])

const cycleMood = () => {
  moodIndex.value = (moodIndex.value + 1) % moods.length
}

const openHistory = () => {
  void router.push('/history')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col gap-5">
      <header class="space-y-2">
        <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">角色状态</p>
        <h1 class="text-[30px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.6px">你的分身处于稳定窗口</h1>
      </header>

      <section class="apple-card overflow-hidden">
        <div class="bg-[linear-gradient(135deg,#eaf2ff_0%,#ffffff_100%)] p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">当前身份</p>
              <h2 class="mt-2 text-[21px] font-normal text-[#1d1d1f]" style="letter-spacing: 0.231px">
                {{ persona?.title }}
              </h2>
              <p class="mt-2 text-[14px] text-[#1d1d1f]/72" style="letter-spacing: -0.224px">
                {{ persona?.summary }}
              </p>
            </div>
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
              <span class="material-symbols-outlined text-[30px] text-[#0071e3]">mood</span>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <span v-for="trait in persona?.traits" :key="trait" class="pill-tag text-[12px]" style="letter-spacing: -0.12px">
              {{ trait }}
            </span>
          </div>
        </div>
      </section>

      <section class="grid gap-4 sm:grid-cols-2">
        <article class="apple-card p-5">
          <p class="text-[11px] text-[#86868b]" style="letter-spacing: -0.08px">实时情绪</p>
          <h3 class="mt-3 text-[21px] font-normal text-[#1d1d1f]" style="letter-spacing: 0.231px">{{ currentMood }}</h3>
          <p class="mt-2 text-[14px] text-[#1d1d1f]/72" style="letter-spacing: -0.224px">系统建议今晚优先低拥挤空间，适合一对一聊天。</p>
        </article>

        <article class="apple-card p-5">
          <p class="text-[11px] text-[#86868b]" style="letter-spacing: -0.08px">匹配势能</p>
          <h3 class="mt-3 text-[21px] font-normal text-[#1d1d1f]" style="letter-spacing: 0.231px">82 / 100</h3>
          <p class="mt-2 text-[14px] text-[#1d1d1f]/72" style="letter-spacing: -0.224px">过去 7 天中你在夜间时段的回应质量最稳定。</p>
        </article>
      </section>

      <section class="apple-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-[17px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.374px">分身维护</h2>
            <p class="mt-2 text-[14px] text-[#1d1d1f]/72" style="letter-spacing: -0.224px">在不同情绪窗口之间切换观察系统建议。</p>
          </div>
          <button
            type="button"
            class="secondary-button px-4 py-2 text-[17px]"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="cycleMood"
          >
            切换
          </button>
        </div>
      </section>

      <button
        type="button"
        class="primary-button mt-auto px-5 py-3 text-[17px]"
        style="letter-spacing: -0.374px; line-height: 2.41"
        @click="openHistory"
      >
        查看匹配历史
      </button>
    </div>

    <TabBar />
  </main>
</template>
