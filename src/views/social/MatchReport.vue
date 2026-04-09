<script setup lang="ts">
import { useRouter } from 'vue-router'
import { reportTopics } from '../../lib/mockData'
import PageHeaderBar from '../../components/ui/PageHeaderBar.vue'
import InfoSectionCard from '../../components/ui/InfoSectionCard.vue'
import { socialParticipants, socialReportContent } from './social.config'
import { matchReportContent } from './matchReport.config'

const router = useRouter()
const compatibility = socialReportContent.compatibility

const goToMap = () => {
  void router.push('/map')
}

const compatibilityLabel = () => {
  if (compatibility >= 80) return { text: '命中注定的相遇', color: '#34C759' }
  if (compatibility >= 60) return { text: '有趣的灵魂', color: '#E8A44A' }
  return { text: '也许下次会更好', color: '#8E8E93' }
}

const vibeResult = socialReportContent.vibeResult
</script>

<template>
  <main class="device-shell">
    <div class="flex min-h-[100dvh] flex-col bg-[#F7F7F8]">
      <PageHeaderBar :title="matchReportContent.title" :subtitle="matchReportContent.subtitle" back-to="/map" />

      <section class="flex-1 overflow-y-auto px-5 py-5">
        <!-- 双角色展示 -->
        <div class="apple-card mx-auto w-[90%] p-6">
          <div class="flex items-center justify-center gap-8">
            <div class="flex flex-col items-center gap-2">
              <div class="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7]">
              <span class="material-symbols-outlined text-[28px]" :style="{ color: socialParticipants.user.iconColor }">person</span>
            </div>
              <span class="text-[14px] font-medium text-[#1D1D1F]">{{ socialParticipants.user.name }}</span>
            </div>
            <span class="text-[16px] text-[#8E8E93]">✦</span>
            <div class="flex flex-col items-center gap-2">
              <div class="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-[#F2F2F7]">
                <span class="material-symbols-outlined text-[28px]" :style="{ color: socialParticipants.match.iconColor }">person</span>
              </div>
              <span class="text-[14px] font-medium text-[#1D1D1F]">{{ socialParticipants.match.name }}</span>
            </div>
          </div>
        </div>

        <!-- 匹配度展示 -->
        <div class="mt-6 rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#F2F2F7_100%)] px-6 py-7 text-center shadow-[rgba(0,0,0,0.08)_0px_16px_34px_0px]">
          <p class="text-[11px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">
            {{ matchReportContent.scoreEyebrow }}
          </p>
          <p
            class="mt-3 text-[48px] font-light text-[#1D1D1F]"
            style="letter-spacing: -2px"
          >
            {{ compatibility }}%
          </p>
          <p
            class="mt-2 text-[14px] font-medium"
            :style="{ color: compatibilityLabel().color }"
          >
            {{ compatibilityLabel().text }}
          </p>
          <div class="mx-auto mt-3 h-1 w-[60%] overflow-hidden rounded-full bg-[#F2F2F7]">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${compatibility}%`, backgroundColor: compatibilityLabel().color }"
            />
          </div>
        </div>

        <!-- 匹配详情卡片 -->
        <InfoSectionCard
          class="mt-6"
          :title="matchReportContent.summaryTitle"
          :eyebrow="matchReportContent.summaryEyebrow"
        >
          <!-- Vibe -->
          <div class="flex items-center justify-between">
            <span class="text-[13px] text-[#8E8E93]">{{ matchReportContent.vibeLabel }}</span>
            <span class="text-[13px] font-medium" :style="{ color: vibeResult.color }">{{ vibeResult.text }}</span>
          </div>

          <div class="subtle-divider my-4" />

          <!-- 共同话题 -->
          <p class="text-[13px] text-[#8E8E93]">{{ matchReportContent.topicLabel }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span v-for="topic in reportTopics" :key="topic" class="pill-tag">{{ topic }}</span>
          </div>

          <div class="subtle-divider my-4" />

          <!-- 推荐理由 -->
          <p class="text-[13px] text-[#8E8E93]">{{ matchReportContent.reasonLabel }}</p>
          <p class="mt-2 text-[14px] leading-6 text-[#6C6C6C]" style="letter-spacing: -0.224px">
            {{ socialReportContent.recommendation }}
          </p>
        </InfoSectionCard>

        <!-- 对话回顾入口 -->
        <p class="mt-5 cursor-pointer text-center text-[14px] font-medium text-[#1D1D1F]" style="letter-spacing: -0.224px">
          {{ matchReportContent.reviewAction }}
        </p>
      </section>

      <!-- v4 底部操作按钮 -->
      <div
        class="flex gap-3 bg-white px-5 py-4"
        style="border-top: 1px solid #E5E5EA"
      >
        <button
          type="button"
          class="secondary-button flex-1 py-3 text-[15px]"
          style="letter-spacing: -0.224px"
          @click="goToMap"
        >
          {{ matchReportContent.secondaryAction }}
        </button>
        <button
          type="button"
          class="primary-button flex-1 py-3 text-[15px]"
          style="letter-spacing: -0.224px"
        >
          {{ matchReportContent.primaryAction }}
        </button>
      </div>
    </div>
  </main>
</template>
