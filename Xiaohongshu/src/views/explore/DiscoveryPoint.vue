<script setup lang="ts">
import { useRouter } from 'vue-router'
import TabBar from '../../components/ui/TabBar.vue'

const router = useRouter()

const revealItem = () => {
  void router.push('/reveal')
}
</script>

<template>
  <main class="device-shell overflow-hidden">
    <div class="page-padding tabbar-padding flex min-h-[100dvh] flex-col bg-[radial-gradient(circle_at_top,#ffffff_0%,#F2F2F7_35%,#F7F7F8_100%)]">
      <header class="space-y-2">
        <p class="text-[12px] text-[#8E8E93]" style="letter-spacing: -0.12px">发现据点</p>
        <h1 class="text-[30px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.6px">情绪盲盒正在掉落</h1>
      </header>

      <section class="relative flex flex-1 flex-col items-center justify-center">
        <div class="absolute inset-0 bg-[radial-gradient(circle,#9B8EC40f_0%,transparent_58%)]" aria-hidden="true" />
        <div class="relative flex flex-col items-center">
          <div class="animate-drop relative h-36 w-36">
            <div class="absolute inset-0 rounded-[30px] bg-[linear-gradient(135deg,#ffffff_0%,#F2F2F7_100%)] shadow-[rgba(0,0,0,0.18)_0px_24px_46px_0px]" />
            <div class="absolute inset-x-4 top-0 h-4 rounded-b-[12px] bg-white/90" />
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="material-symbols-outlined text-[36px] text-[#9B8EC4]">deployed_code</span>
            </div>
          </div>
          <div class="mt-8 rounded-full bg-white/86 px-4 py-2 text-[12px] text-[#1D1D1F] shadow-[rgba(0,0,0,0.12)_0px_10px_24px_0px]" style="letter-spacing: -0.12px">
            正在根据当前位置生成体验物品
          </div>
        </div>
      </section>

      <section class="apple-card space-y-4 p-5">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9B8EC4]/10 text-[#9B8EC4]">
            <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
          </div>
          <div>
            <h2 class="text-[17px] font-normal text-[#1D1D1F]" style="letter-spacing: -0.374px">掉落逻辑</h2>
            <p class="mt-2 text-[14px] leading-6 text-[#1D1D1F]/76" style="letter-spacing: -0.224px">
              系统会结合地点氛围、你当前分身和附近潜在匹配对象，生成一次适配的“情绪起手式”。
            </p>
          </div>
        </div>

        <button
          type="button"
          class="primary-button w-full px-5 py-3 text-[17px] font-normal"
          style="letter-spacing: -0.374px; line-height: 2.41"
          @click="revealItem"
        >
          打开盲盒
        </button>
      </section>
    </div>

    <TabBar />
  </main>
</template>
