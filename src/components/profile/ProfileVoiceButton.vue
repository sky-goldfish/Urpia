<script setup lang="ts">
defineProps<{
  isRecording: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  holdStart: []
  holdEnd: []
}>()
</script>

<template>
  <button
    type="button"
    class="voice-button"
    :class="{ 'is-recording': isRecording }"
    :disabled="disabled"
    @mousedown="emit('holdStart')"
    @mouseup="emit('holdEnd')"
    @mouseleave="emit('holdEnd')"
    @touchstart.prevent="emit('holdStart')"
    @touchend.prevent="emit('holdEnd')"
  >
    <span v-if="isRecording" class="recording-bars" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
    <span>{{ isRecording ? '松开发送' : '按住和分身说话' }}</span>
  </button>
</template>

<style scoped>
.voice-button {
  min-width: 220px;
  height: 44px;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: #4a4d55;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow:
    inset 0 0 0 1px rgba(60, 60, 67, 0.08),
    0 12px 28px rgba(97, 90, 129, 0.08);
  font-size: 15px;
  transition: transform 140ms ease, background 140ms ease;
}

.voice-button:disabled {
  opacity: 0.45;
}

.voice-button:not(:disabled):active,
.voice-button.is-recording {
  background: #f2f3f6;
  transform: scale(0.98);
}

.recording-bars {
  display: inline-flex;
  align-items: end;
  gap: 3px;
}

.recording-bars i {
  width: 3px;
  border-radius: 999px;
  background: #07c160;
  animation: voice-bar 0.85s ease-in-out infinite;
}

.recording-bars i:nth-child(1) { height: 10px; animation-delay: 0s; }
.recording-bars i:nth-child(2) { height: 16px; animation-delay: 0.1s; }
.recording-bars i:nth-child(3) { height: 12px; animation-delay: 0.2s; }
.recording-bars i:nth-child(4) { height: 18px; animation-delay: 0.3s; }

@keyframes voice-bar {
  0%, 100% { transform: scaleY(0.45); opacity: 0.58; }
  50% { transform: scaleY(1); opacity: 1; }
}
</style>
