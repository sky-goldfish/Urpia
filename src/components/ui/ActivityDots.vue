<script setup lang="ts">
withDefaults(
  defineProps<{
    dotClass?: string
    gapClass?: string
    animated?: boolean
  }>(),
  {
    dotClass: 'h-1.5 w-1.5 rounded-full bg-[#8E8E93]/40',
    gapClass: 'gap-1',
    animated: true,
  },
)
</script>

<template>
  <div class="flex items-center" :class="gapClass">
    <div :class="[dotClass, animated ? 'animate-[bounce_1.4s_ease-in-out_infinite]' : '']" />
    <div :class="[dotClass, animated ? 'animate-[bounce_1.4s_ease-in-out_0.2s_infinite]' : '']" />
    <div :class="[dotClass, animated ? 'animate-[bounce_1.4s_ease-in-out_0.4s_infinite]' : '']" />
  </div>
</template>
