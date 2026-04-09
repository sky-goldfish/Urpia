<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { poiList } from '../../lib/mockData'
import PageHeaderBar from '../../components/ui/PageHeaderBar.vue'
import InfoSectionCard from '../../components/ui/InfoSectionCard.vue'
import { poiInfoContent } from './poiInfo.config'

const route = useRoute()
const router = useRouter()

const poi = computed(() => poiList.find((item) => item.id === route.params.id) ?? poiList[0])

const goToDiscovery = () => {
  void router.push('/discovery')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col gap-5">
      <PageHeaderBar :title="poiInfoContent.title" :subtitle="poi?.district" back-to="/map" />

      <section class="rounded-[28px] bg-[linear-gradient(180deg,#F2F2F7_0%,#ffffff_100%)] p-6 shadow-[rgba(0,0,0,0.18)_0px_22px_40px_0px]">
        <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">{{ poi?.district }} · {{ poi?.distance }}</p>
        <h1 class="mt-2 text-[30px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.6px">{{ poi?.name }}</h1>
        <p class="mt-2 text-[14px] text-[#1D1D1F]/72" style="letter-spacing: -0.224px">{{ poi?.vibe }}</p>

        <div class="mt-6 flex flex-wrap gap-2">
          <span v-for="tag in poi?.moods" :key="tag" class="pill-tag text-[12px]" style="letter-spacing: -0.12px">
            {{ tag }}
          </span>
        </div>
      </section>

      <InfoSectionCard :title="poiInfoContent.statusTitle" :eyebrow="poiInfoContent.statusEyebrow">
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div class="rounded-[12px] bg-[#F2F2F7] p-4">
            <p class="text-[11px] text-[#8E8E93]" style="letter-spacing: -0.08px">{{ poiInfoContent.occupancyLabel }}</p>
            <p class="mt-2 text-[17px] text-[#1D1D1F]" style="letter-spacing: -0.374px">{{ poi?.occupancy }}</p>
          </div>
          <div class="rounded-[12px] bg-[#F2F2F7] p-4">
            <p class="text-[11px] text-[#8E8E93]" style="letter-spacing: -0.08px">{{ poiInfoContent.moodHintLabel }}</p>
            <p class="mt-2 text-[17px] text-[#1D1D1F]" style="letter-spacing: -0.374px">{{ poiInfoContent.moodHintValue }}</p>
          </div>
        </div>
        <p class="mt-4 text-[14px] leading-6 text-[#1D1D1F]/76" style="letter-spacing: -0.224px">
          {{ poi?.note }}
        </p>
      </InfoSectionCard>

      <InfoSectionCard :title="poiInfoContent.actionTitle" :eyebrow="poiInfoContent.actionEyebrow">
        <ul class="space-y-3 text-[14px] text-[#1D1D1F]/76" style="letter-spacing: -0.224px">
          <li v-for="item in poiInfoContent.actionItems" :key="item">{{ item }}</li>
        </ul>
      </InfoSectionCard>

      <button
        type="button"
        class="primary-button mt-auto px-5 py-3 text-[17px] font-normal"
        style="letter-spacing: -0.374px; line-height: 2.41"
        @click="goToDiscovery"
      >
        {{ poiInfoContent.primaryAction }}
      </button>
    </div>
  </main>
</template>
