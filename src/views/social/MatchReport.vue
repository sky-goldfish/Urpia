<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { reportTopics } from '../../lib/mockData'

const router = useRouter()
const compatibility = 87

const goToChat = () => {
  void router.push('/match')
}

const goToProfile = () => {
  void router.push('/profile')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col gap-5">
      <header class="space-y-2">
        <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">匹配报告</p>
        <h1 class="text-[30px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.6px">这次相遇可以继续</h1>
      </header>

      <section class="apple-card p-6">
        <div class="flex items-center gap-5">
          <div
            class="flex h-28 w-28 items-center justify-center rounded-full bg-[conic-gradient(#0071e3_0_87%,rgba(0,113,227,0.12)_87%_100%)]"
          >
            <div class="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-white">
              <span class="text-[30px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.6px">{{ compatibility }}</span>
              <span class="text-[11px] text-[#86868b]" style="letter-spacing: -0.08px">兼容度</span>
            </div>
          </div>
          <div class="flex-1">
            <p class="text-[17px] text-[#1d1d1f]" style="letter-spacing: -0.374px">你们都偏好慢启动、真诚表达和留白感。</p>
            <p class="mt-3 text-[14px] leading-6 text-[#1d1d1f]/72" style="letter-spacing: -0.224px">
              关系推进建议：先交换一件最近反复想到的小事，而不是直接询问“你是做什么的”。
            </p>
          </div>
        </div>
      </section>

      <section class="apple-card p-5">
        <h2 class="text-[17px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.374px">共同话题</h2>
        <div class="mt-4 flex flex-wrap gap-2">
          <span v-for="topic in reportTopics" :key="topic" class="pill-tag text-[12px]" style="letter-spacing: -0.12px">
            {{ topic }}
          </span>
        </div>
      </section>

      <section class="apple-card p-5">
        <h2 class="text-[17px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.374px">互动建议</h2>
        <ul class="mt-4 space-y-3 text-[14px] text-[#1d1d1f]/76" style="letter-spacing: -0.224px">
          <li>适合使用情绪天气卡作为第一次深聊入口。</li>
          <li>建议在 20 分钟内保持双向轮转，不要一方持续输出。</li>
          <li>如果现场噪音升高，优先切换到步行型交流场景。</li>
        </ul>
      </section>

      <div class="mt-auto grid grid-cols-2 gap-3">
        <button
          type="button"
          class="secondary-button px-4 py-3 text-[17px]"
          style="letter-spacing: -0.374px; line-height: 2.41"
          @click="goToProfile"
        >
          查看状态
        </button>
        <button
          type="button"
          class="primary-button px-4 py-3 text-[17px]"
          style="letter-spacing: -0.374px; line-height: 2.41"
          @click="goToChat"
        >
          返回对话
        </button>
      </div>
    </div>

    <TabBar />
  </main>
</template>
