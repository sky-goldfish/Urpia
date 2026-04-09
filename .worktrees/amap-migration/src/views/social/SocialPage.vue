<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'
import SocialMatchChat from './SocialMatchChat.vue'

const router = useRouter()
const showMatchChat = ref(true)

const closeMatchChat = () => {
  showMatchChat.value = false
  void router.push('/map')
}
</script>

<template>
  <main class="device-shell">
    <div class="relative h-[100dvh] w-full bg-[#F7F7F8]">
      <!-- A2A 对话浮层（直接显示） -->
      <SocialMatchChat :visible="showMatchChat" @close="closeMatchChat" />

      <TabBar />
    </div>
  </main>
</template>
