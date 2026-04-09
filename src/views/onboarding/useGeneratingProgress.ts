import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

export const useGeneratingProgress = (hints: string[]) => {
  const router = useRouter()
  const hintIndex = ref(0)
  const progress = ref(12)

  let hintTimer: number | undefined
  let progressTimer: number | undefined
  let redirectTimer: number | undefined

  const activeHint = computed(() => hints[hintIndex.value] ?? hints[0] ?? '')

  onMounted(() => {
    hintTimer = window.setInterval(() => {
      hintIndex.value = (hintIndex.value + 1) % hints.length
    }, 1400)

    progressTimer = window.setInterval(() => {
      progress.value = Math.min(progress.value + 4, 100)

      if (progress.value >= 100) {
        if (progressTimer) {
          window.clearInterval(progressTimer)
        }

        redirectTimer = window.setTimeout(() => {
          void router.push('/onboarding/confirm')
        }, 420)
      }
    }, 180)
  })

  onUnmounted(() => {
    if (hintTimer) {
      window.clearInterval(hintTimer)
    }

    if (progressTimer) {
      window.clearInterval(progressTimer)
    }

    if (redirectTimer) {
      window.clearTimeout(redirectTimer)
    }
  })

  return {
    activeHint,
    progress,
  }
}
