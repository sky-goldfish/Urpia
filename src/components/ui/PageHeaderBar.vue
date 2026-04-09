<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
}>(), {
  subtitle: '',
  backTo: '',
  backLabel: 'arrow_back',
})

const router = useRouter()

const goBack = () => {
  if (props.backTo) {
    void router.push(props.backTo)
    return
  }

  void router.back()
}
</script>

<template>
  <header class="flex items-center bg-white px-5 py-4" style="border-bottom: 1px solid #E5E5EA">
    <button type="button" class="mr-3 text-[#6C6C6C]" @click="goBack">
      <span class="material-symbols-outlined text-[20px]">{{ backLabel }}</span>
    </button>
    <div class="min-w-0">
      <p v-if="subtitle" class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">{{ subtitle }}</p>
      <h1 class="text-[16px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.224px">{{ title }}</h1>
    </div>
    <div class="ml-auto">
      <slot name="right" />
    </div>
  </header>
</template>
