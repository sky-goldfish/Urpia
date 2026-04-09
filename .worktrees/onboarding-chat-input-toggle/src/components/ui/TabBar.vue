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
  { label: '探索', icon: 'explore', to: '/map', matches: /^\/(map|poi|discovery|reveal)/ },
  { label: '状态', icon: 'person', to: '/profile', matches: /^\/(profile|history)/ },
  { label: '社交', icon: 'forum', to: '/match', matches: /^\/(match|report)/ },
]

const activePath = computed(() => route.path)

const isActive = (tab: TabItem) => tab.matches.test(activePath.value)

const navigate = (to: string) => {
  if (route.path !== to) {
    void router.push(to)
  }
}
</script>

<template>
  <!-- v4 底部导航栏：白色背景 + 顶部细线，极简克制 -->
  <nav
    class="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] bg-white"
    style="border-top: 1px solid #E5E5EA"
    aria-label="主导航"
  >
    <div class="flex items-center justify-around px-4 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2">
      <button
        v-for="tab in tabs"
        :key="tab.to"
        type="button"
        class="flex min-w-[64px] flex-1 flex-col items-center gap-0.5 py-1 transition-colors duration-250"
        :class="isActive(tab) ? 'text-[#1D1D1F]' : 'text-[#8E8E93]'"
        :aria-current="isActive(tab) ? 'page' : undefined"
        @click="navigate(tab.to)"
      >
        <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20">
          {{ tab.icon }}
        </span>
        <span
          class="text-[11px]"
          :class="isActive(tab) ? 'font-semibold' : 'font-normal'"
          style="letter-spacing: -0.08px"
        >
          {{ tab.label }}
        </span>
        <!-- v4 激活指示器：2px 短横线 -->
        <span
          v-if="isActive(tab)"
          class="mt-0.5 h-[2px] w-4 rounded-full bg-[#1D1D1F]"
          aria-hidden="true"
        />
        <span
          v-else
          class="mt-0.5 h-[2px] w-4 rounded-full bg-transparent"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>
