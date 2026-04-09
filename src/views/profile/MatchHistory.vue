<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import { getMatchHistoryRecords } from '../../data/profileData'
import PageHeaderBar from '../../components/ui/PageHeaderBar.vue'
import InfoSectionCard from '../../components/ui/InfoSectionCard.vue'
import { matchHistoryContent } from './matchHistory.config'

const router = useRouter()
const matchHistory = getMatchHistoryRecords()

const goToReport = () => {
  void router.push('/report')
}
</script>

<template>
  <main class="device-shell">
    <div class="flex min-h-[100dvh] flex-col bg-[#F7F7F8]">
      <PageHeaderBar :title="matchHistoryContent.title" :subtitle="matchHistoryContent.subtitle" back-to="/profile" />

      <section class="flex flex-1 overflow-y-auto px-5 py-4">
        <InfoSectionCard class="w-full" :title="matchHistoryContent.listTitle" :eyebrow="matchHistoryContent.listEyebrow">
          <div class="space-y-3">
            <article
              v-for="record in matchHistory"
              :key="record.id"
              class="rounded-[18px] bg-[#F2F2F7]/80 p-4"
            >
              <div class="flex items-start gap-3">
                <div class="relative flex-shrink-0">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                    <span class="material-symbols-outlined text-[20px] text-[#6C6C6C]">person</span>
                  </div>
                  <div
                    class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full"
                    :class="record.statusTone === 'active' ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-[14px] font-medium text-[#1D1D1F]" style="letter-spacing: -0.224px">
                      {{ record.alias }}
                    </p>
                    <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.08px">
                      {{ record.lastSeen }}
                    </p>
                  </div>
                  <p class="mt-1 truncate text-[13px] text-[#8E8E93]" style="letter-spacing: -0.08px">
                    {{ record.highlight }}
                  </p>
                  <div class="mt-2 flex gap-1.5">
                    <span class="pill-tag text-[11px] !px-2 !py-1">{{ record.persona }}</span>
                  </div>
                </div>

                <div class="flex flex-col items-center gap-1 flex-shrink-0">
                  <span class="text-[16px] font-semibold text-[#1D1D1F]">{{ record.compatibility }}%</span>
                  <span class="material-symbols-outlined text-[16px] text-[#E5E5EA]">chevron_right</span>
                </div>
              </div>
            </article>
          </div>
        </InfoSectionCard>
      </section>

      <!-- 底部操作 -->
      <div
        class="bg-white px-5 py-4"
        style="border-top: 1px solid #E5E5EA"
      >
        <button
          type="button"
          class="secondary-button w-full py-3 text-[15px]"
          style="letter-spacing: -0.224px"
          @click="goToReport"
        >
          {{ matchHistoryContent.footerAction }}
        </button>
      </div>

      <TabBar />
    </div>
  </main>
</template>
