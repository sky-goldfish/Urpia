<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface TabItem {
  label: string
  icon: string
  to: string
  matches: RegExp
}

const route = useRoute()
const router = useRouter()

const tabs: TabItem[] = [
  { label: '探索', icon: 'travel_explore', to: '/map', matches: /^\/(map|poi|discovery|reveal)/ },
  { label: '社交', icon: 'forum', to: '/match', matches: /^\/(match|report)/ },
  { label: '状态', icon: 'psychiatry', to: '/profile', matches: /^\/(profile|history)/ },
]

const activePath = computed(() => route.path)

const iconStyle = (active: boolean) => ({
  fontVariationSettings: active
    ? '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 24'
    : '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
})

const isActive = (tab: TabItem) => tab.matches.test(activePath.value)

const navigate = (to: string) => {
  if (route.path !== to) {
    void router.push(to)
  }
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] px-5 pb-[calc(env(safe-area-inset-bottom)+14px)]"
    aria-label="主导航"
  >
    <div class="glass-light flex items-center justify-between rounded-[28px] px-3 py-3 shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px]">
      <button
        v-for="tab in tabs"
        :key="tab.to"
        type="button"
        class="flex min-w-[84px] flex-1 flex-col items-center gap-1 rounded-[20px] px-3 py-2 text-center transition-transform duration-200 hover:-translate-y-0.5"
        :class="isActive(tab) ? 'text-[#1d1d1f]' : 'text-[#86868b]'"
        :aria-current="isActive(tab) ? 'page' : undefined"
        @click="navigate(tab.to)"
      >
        <span class="material-symbols-outlined text-[22px]" :style="iconStyle(isActive(tab))">
          {{ tab.icon }}
        </span>
        <span class="text-[11px]" style="letter-spacing: -0.08px">{{ tab.label }}</span>
        <span
          class="h-1.5 w-1.5 rounded-full bg-[#0071e3] transition-opacity duration-200"
          :class="isActive(tab) ? 'opacity-100' : 'opacity-0'"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>
