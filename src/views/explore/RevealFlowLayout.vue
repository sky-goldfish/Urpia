<script setup lang="ts">
import TabBar from '../../components/ui/TabBar.vue'

defineProps<{
  eyebrow: string
  title: string
  pageClass?: string
}>()
</script>

<template>
  <main class="device-shell overflow-hidden">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col" :class="pageClass">
      <header class="space-y-2">
        <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">{{ eyebrow }}</p>
        <h1 class="text-[30px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.6px">{{ title }}</h1>
      </header>

      <slot />
    </div>

    <TabBar />
  </main>
</template>
