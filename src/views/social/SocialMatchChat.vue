<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { matchChat } from '../../lib/mockData'

const router = useRouter()

const goToReport = () => {
  void router.push('/report')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col gap-5">
      <header class="apple-card flex items-center gap-3 p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#dbeafe_0%,#ffffff_100%)]">
          <span class="material-symbols-outlined text-[24px] text-[#0071e3]">face_6</span>
        </div>
        <div class="flex-1">
          <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">已完成匿名连接</p>
          <h1 class="mt-1 text-[17px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.374px">你 · 月汐观测者 / 对方 · 云野</h1>
        </div>
        <button
          type="button"
          class="glass-light rounded-full px-4 py-2 text-[14px] text-[#1d1d1f]"
          style="letter-spacing: -0.224px"
          @click="goToReport"
        >
          报告
        </button>
      </header>

      <section class="flex flex-1 flex-col gap-4">
        <article
          v-for="message in matchChat"
          :key="message.id"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div class="max-w-[84%]">
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

      <section class="apple-card flex items-center gap-3 p-3">
        <button type="button" class="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f]">
          <span class="material-symbols-outlined text-[20px]">add</span>
        </button>
        <input
          type="text"
          class="input-shell px-4 py-3 text-[17px]"
          style="letter-spacing: -0.374px"
          placeholder="发送一句温和开场"
        />
        <button type="button" class="primary-button h-11 px-4 text-[17px]" style="letter-spacing: -0.374px; line-height: 2.41">
          发送
        </button>
      </section>
    </div>

    <TabBar />
  </main>
</template>
