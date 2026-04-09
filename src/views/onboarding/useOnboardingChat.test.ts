import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOnboardingChat } from './useOnboardingChat'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  })
}))

describe('useOnboardingChat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.unstubAllGlobals()
  })

  it('streams the current question and submits text answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sessionId: 'onb_001',
            questionText: '你更喜欢热闹的场子，还是能慢慢熟起来的空间？',
            questionIndex: 1,
            totalQuestions: 4,
            streamMode: 'typewriter'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reply: '如果遇到陌生人，你会更希望谁先开口？',
            done: false,
            turnId: 'turn_001'
          })
        })
    )

    const chat = useOnboardingChat()
    const startPromise = chat.startSession()
    await vi.runAllTimersAsync()
    await startPromise

    const submitPromise = chat.submitText('我喜欢慢慢熟起来的空间')
    await vi.runAllTimersAsync()
    await submitPromise

    expect(chat.sessionId.value).toBe('onb_001')
    expect(chat.messages.value.some((message) => message.text.includes('慢慢熟起来'))).toBe(true)
    expect(chat.currentQuestion.value).toContain('谁先开口')
  })
})
