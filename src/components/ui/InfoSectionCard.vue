<script setup lang="ts">
defineProps<{
  title: string
  eyebrow?: string
}>()
</script>

<template>
  <section class="apple-card p-5">
    <div v-if="eyebrow" class="mb-3 text-[11px] font-semibold uppercase text-[#8E8E93]" style="letter-spacing: 0.12em">
      {{ eyebrow }}
    </div>
    <h2 class="text-[17px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.374px">{{ title }}</h2>
    <div class="mt-4">
      <slot />
    </div>
  </section>
</template>
