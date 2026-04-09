<script setup lang="ts">
defineProps<{
  visible: boolean
  cardClass?: string
  maxHeight?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const close = () => {
  emit('close')
}
</script>

<template>
  <Transition name="centered-overlay">
    <div
      v-if="visible"
      class="absolute inset-0 z-30 flex items-center justify-center px-5"
      @click="close"
    >
      <div class="absolute inset-0 z-0 bg-[#1D1D1F]/20" />
      <div
        class="relative z-10 w-full rounded-[24px] border border-[#E5E5EA] bg-white/95 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
        :class="cardClass"
        :style="maxHeight ? { maxHeight } : undefined"
        @click.stop
      >
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.centered-overlay-enter-active,
.centered-overlay-leave-active {
  transition: opacity 220ms ease;
}

.centered-overlay-enter-active > div:last-child,
.centered-overlay-leave-active > div:last-child {
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease;
}

.centered-overlay-enter-from,
.centered-overlay-leave-to {
  opacity: 0;
}

.centered-overlay-enter-from > div:last-child,
.centered-overlay-leave-to > div:last-child {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}
</style>
