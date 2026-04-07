<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onboardingChat } from '../../lib/mockData'

const router = useRouter()

const suggestions = ['偏安静的据点', '先只观察不匹配', '直接开始探索']

const goToMap = () => {
  void router.push('/map')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding flex min-h-[100dvh] flex-col gap-6">
      <header class="flex items-center justify-between">
        <div>
          <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">AI 引导对话</p>
          <h1 class="mt-1 text-[21px] font-normal text-[#1d1d1f]" style="letter-spacing: 0.231px">Zoopia Guide</h1>
        </div>
        <button type="button" class="glass-light rounded-full px-4 py-2 text-[14px] text-[#1d1d1f]" style="letter-spacing: -0.224px">
          在线
        </button>
      </header>

      <section class="flex flex-1 flex-col gap-4">
        <article
          v-for="message in onboardingChat"
          :key="message.id"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div class="max-w-[82%]">
            <p class="mb-1 px-1 text-[11px] text-[#86868b]" style="letter-spacing: -0.08px">
              {{ message.author }} · {{ message.time }}
            </p>
            <div
              class="rounded-[18px] px-4 py-3 text-[14px] leading-6"
              :class="
                message.role === 'user'
                  ? 'bg-[#0071e3] text-white shadow-[0_10px_26px_rgba(0,113,227,0.18)]'
                  : 'apple-card text-[#1d1d1f]'
              "
              style="letter-spacing: -0.224px"
            >
              {{ message.text }}
            </div>
          </div>
        </article>
      </section>

      <section class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            type="button"
            class="rounded-full bg-white px-4 py-2 text-[12px] text-[#1d1d1f] shadow-[rgba(0,0,0,0.12)_2px_4px_20px_0px]"
            style="letter-spacing: -0.12px"
          >
            {{ suggestion }}
          </button>
        </div>

        <div class="apple-card flex items-center justify-between gap-3 p-3">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
              <span class="material-symbols-outlined text-[20px]">explore</span>
            </div>
            <div>
              <p class="text-[14px] text-[#1d1d1f]" style="letter-spacing: -0.224px">附近有 3 个与你匹配的轻社交据点</p>
              <p class="text-[11px] text-[#86868b]" style="letter-spacing: -0.08px">建议从低拥挤空间开始探索</p>
            </div>
          </div>
          <button
            type="button"
            class="primary-button px-4 py-2 text-[17px]"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="goToMap"
          >
            进入
          </button>
        </div>
      </section>
    </div>
  </main>
</template>
