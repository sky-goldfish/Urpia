<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  step: number
  total: number
  eyebrow?: string
  title: string
  skipTo?: string
  skipLabel?: string
}>(), {
  eyebrow: 'Urpia 入场识别',
  skipTo: '',
  skipLabel: '跳过',
})

const router = useRouter()

const handleSkip = () => {
  if (!props.skipTo) return
  void router.push(props.skipTo)
}
</script>

<template>
  <header class="flex items-center justify-between rounded-[12px] px-4 py-3">
    <button
      v-if="skipLabel"
      type="button"
      class="text-[14px] text-[#8E8E93]"
      style="letter-spacing: -0.224px"
      :disabled="!skipTo"
      @click="handleSkip"
    >
      {{ skipLabel }}
    </button>
    <span v-else class="w-10" aria-hidden="true" />
    <div class="text-center">
      <p class="text-[11px] text-[#8E8E93]" style="letter-spacing: -0.08px">{{ eyebrow }}</p>
      <p class="text-[14px] text-[#1D1D1F]" style="letter-spacing: -0.224px">{{ title }}</p>
    </div>
    <span class="text-[14px] text-[#8E8E93]" style="letter-spacing: -0.224px">{{ step }} / {{ total }}</span>
  </header>
</template>
