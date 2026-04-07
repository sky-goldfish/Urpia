<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { personas } from '../../lib/mockData'

const router = useRouter()
const personaIndex = ref(0)
const nickname = ref('晚风')

const persona = computed(() => personas[personaIndex.value] ?? personas[0])

const rotatePersona = () => {
  personaIndex.value = (personaIndex.value + 1) % personas.length
}

const confirmPersona = () => {
  void router.push('/onboarding/chat')
}

const backToCamera = () => {
  void router.push('/onboarding/camera')
}
</script>

<template>
  <main class="device-shell">
    <div class="page-padding flex min-h-[100dvh] flex-col gap-6">
      <header class="space-y-2 pt-3">
        <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">Zoopia 分身确认</p>
        <h1 class="text-[30px] font-normal text-[#1d1d1f]" style="letter-spacing: -0.6px">
          这是系统捕捉到的你
        </h1>
      </header>

      <section class="apple-card p-5">
        <div
          class="rounded-[12px] p-5"
          :style="{
            background: persona?.color ?? 'linear-gradient(135deg, #ffffff 0%, #f5f5f7 100%)',
          }"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[12px] text-[#86868b]" style="letter-spacing: -0.12px">当前角色原型</p>
              <h2 class="mt-2 text-[21px] font-normal text-[#1d1d1f]" style="letter-spacing: 0.231px">
                {{ persona?.title }}
              </h2>
              <p class="mt-2 text-[14px] text-[#1d1d1f]/78" style="letter-spacing: -0.224px">
                {{ persona?.subtitle }}
              </p>
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/82">
              <span class="material-symbols-outlined text-[28px] text-[#0071e3]">psychiatry</span>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="trait in persona?.traits"
              :key="trait"
              class="pill-tag text-[12px]"
              style="letter-spacing: -0.12px"
            >
              {{ trait }}
            </span>
          </div>

          <p class="mt-5 text-[14px] leading-6 text-[#1d1d1f]/76" style="letter-spacing: -0.224px">
            {{ persona?.summary }}
          </p>
        </div>
      </section>

      <section class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-[14px] text-[#1d1d1f]" style="letter-spacing: -0.224px">给分身起个名字</span>
          <input
            v-model="nickname"
            type="text"
            class="input-shell px-4 py-4 text-[17px]"
            style="letter-spacing: -0.374px"
            maxlength="12"
            placeholder="输入昵称"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-[14px] text-[#1d1d1f]" style="letter-spacing: -0.224px">当前想进入的情绪氛围</span>
          <input
            :value="persona?.mood"
            type="text"
            class="input-shell px-4 py-4 text-[17px]"
            style="letter-spacing: -0.374px"
            readonly
          />
        </label>
      </section>

      <section class="mt-auto grid gap-3">
        <button
          type="button"
          class="primary-button px-5 py-3 text-[17px] font-normal"
          style="letter-spacing: -0.374px; line-height: 2.41"
          @click="confirmPersona"
        >
          确认分身并继续
        </button>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="secondary-button px-4 py-3 text-[17px] font-normal"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="rotatePersona"
          >
            重新生成
          </button>
          <button
            type="button"
            class="secondary-button px-4 py-3 text-[17px] font-normal"
            style="letter-spacing: -0.374px; line-height: 2.41"
            @click="backToCamera"
          >
            返回拍摄
          </button>
        </div>
      </section>
    </div>
  </main>
</template>
