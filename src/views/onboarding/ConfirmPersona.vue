<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import OnboardingStepHeader from '../../components/ui/OnboardingStepHeader.vue'
import { confirmPersonaContent, onboardingModelOptions } from './onboarding.config'
import { writeStoredProfileModelUrl, writeStoredProfileNickname } from '../profile/profileModel.config'

const ProfileAvatar3D = defineAsyncComponent(() => import('../../components/profile/ProfileAvatar3D.vue'))

const router = useRouter()
const ONBOARDING_PREVIEW_INDEX_KEY = 'urpia:onboarding-preview-index'
const USER_INFO_KEY = 'urpia:user-info'
const selectedIndex = ref(0)
const fallbackModel = onboardingModelOptions[0]!
const isModelPending = ref(true)
const userNickname = ref('')

const selectedModel = computed(() => onboardingModelOptions[selectedIndex.value] || fallbackModel)

// 读取用户输入的昵称
const readUserNickname = () => {
  const savedUserInfo = localStorage.getItem(USER_INFO_KEY)
  if (savedUserInfo) {
    try {
      const userInfo = JSON.parse(savedUserInfo)
      userNickname.value = userInfo.nickname || ''
    } catch (e) {
      console.error('[ConfirmPersona] failed to parse user info', e)
    }
  }
}

const handleLoadingChange = (loading: boolean) => {
  isModelPending.value = loading
  console.debug('[ConfirmPersona] loadingChange', {
    loading,
    selectedIndex: selectedIndex.value,
    modelUrl: selectedModel.value.modelUrl,
  })
}

const handleConfirm = () => {
  writeStoredProfileModelUrl(selectedModel.value.modelUrl)
  // 优先使用用户输入的昵称，如果没有则使用模型名称
  const nicknameToSave = userNickname.value || selectedModel.value.label
  writeStoredProfileNickname(nicknameToSave)
  console.debug('[ConfirmPersona] handleConfirm -> /onboarding/chat', {
    nickname: nicknameToSave,
    modelUrl: selectedModel.value.modelUrl,
  })
  void router.push('/onboarding/chat')
}

onMounted(() => {
  const storedIndex = Number(window.localStorage.getItem(ONBOARDING_PREVIEW_INDEX_KEY))
  if (Number.isFinite(storedIndex) && storedIndex >= 0 && storedIndex < onboardingModelOptions.length) {
    selectedIndex.value = storedIndex
  }

  // 读取用户输入的昵称
  readUserNickname()

  console.debug('[ConfirmPersona] mounted', {
    selectedIndex: selectedIndex.value,
    modelUrl: selectedModel.value.modelUrl,
    label: selectedModel.value.label,
    userNickname: userNickname.value,
  })
})

watch(selectedModel, (model) => {
  console.debug('[ConfirmPersona] selectedModel changed', {
    id: model.id,
    label: model.label,
    modelUrl: model.modelUrl,
  })
})
</script>

<template>
  <main class="device-shell">
    <div class="page-container">
      <div class="px-6 pt-[calc(env(safe-area-inset-top)+10px)]">
        <OnboardingStepHeader :step="2" :total="3" :title="confirmPersonaContent.title" skip-label="" />
      </div>

      <section class="flex flex-1 flex-col px-6 pb-6 pt-2">
        <div class="flex flex-1 flex-col items-center justify-center">
          <div class="text-center">
            <p class="text-[24px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.32px">{{ selectedModel.label }}</p>
          </div>
          <div class="relative">
            <ProfileAvatar3D
              :key="selectedModel.id"
              :model-url="selectedModel.modelUrl"
              :fallback-image="selectedModel.fallbackImage"
              :alt="selectedModel.label"
              :show-tip="true"
              :tip-text="confirmPersonaContent.rotateHint"
              :enable-toggle="false"
              @loading-change="handleLoadingChange"
            />
          </div>
        </div>

        <section class="space-y-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <div class="mt-3 rounded-[22px] border border-[#E5E5EA] bg-[#F2F2F7]/80 px-5 py-4 text-center">
            <p class="text-[12px] font-medium uppercase text-[#8E8E93]" style="letter-spacing: 1px">
              {{ confirmPersonaContent.nicknameLabel }}
            </p>
            <p class="mt-2 text-[18px] font-semibold text-[#1D1D1F]" style="letter-spacing: -0.3px">
              {{ userNickname || selectedModel.label }}
            </p>
          </div>

          <button
            type="button"
            class="primary-button w-full px-4 py-3 text-[17px] font-normal disabled:opacity-40"
            style="letter-spacing: -0.374px; line-height: 2.41"
            :disabled="isModelPending"
            @click="handleConfirm"
          >
            {{ confirmPersonaContent.confirmLabel }}
          </button>

          <p class="text-center text-[12px] text-[#8E8E93]">
            {{ confirmPersonaContent.footerHint }}
          </p>
        </section>
      </section>
    </div>
  </main>
</template>

<style scoped>
.device-shell {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100vw;
  width: 100dvw;
  background: linear-gradient(180deg, #f8f8fc 0%, #f0f0f5 100%);
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  overflow-x: hidden;
}

.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  max-width: min(100%, 480px);
  margin: 0 auto;
}
</style>
