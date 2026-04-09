# Onboarding Chat Input Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a frontend-only voice/text input mode toggle to the onboarding chat bottom bar so users can switch between press-to-talk voice input and typed input without changing backend behavior.

**Architecture:** Keep all behavior inside `src/views/onboarding/AiGuideChat.vue`, because the current onboarding chat logic, speech-recognition state, and bottom input UI already live in that single file. Add one small reactive mode state plus two mode-switch handlers, then replace the existing bottom-bar conditional with two explicit layouts inside one shared container.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), TypeScript, Vite, Vue Router, Tailwind utility classes, Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)

---

## File Map

- Modify: `src/views/onboarding/AiGuideChat.vue`
  - Owns onboarding chat messages, mock AI flow, speech recognition, and the bottom input area.
  - Will receive the new `InputMode` state, mode-switch handlers, adjusted speech-support initialization, and bottom-bar template changes.
- Verify with: `package.json`
  - Confirms the available project commands:
    - `npm run dev`
    - `npm run build`

No additional files are needed for implementation because the spec intentionally keeps this change frontend-only and localized to the existing chat view.

### Task 1: Add explicit input mode state

**Files:**
- Modify: `src/views/onboarding/AiGuideChat.vue`
- Verify: `package.json`

- [ ] **Step 1: Add the new mode type and reactive state**

Insert the following code near the existing message and input refs, directly after the `Message` interface:

```ts
type InputMode = 'voice' | 'text'
```

Then add the new state near the existing input refs:

```ts
const messages = ref<Message[]>([])
const inputText = ref('')
const inputMode = ref<InputMode>('voice')
const isAiTyping = ref(false)
const chatEndRef = ref<HTMLDivElement | null>(null)
```

Why: the current component only branches on `speechSupported`; the feature needs an explicit UI mode independent from speech capability detection.

- [ ] **Step 2: Wire speech-support initialization to set the default mode**

Replace the unsupported branch in `initSpeechRecognition()` with this code:

```ts
if (!SpeechRecognitionAPI) {
  speechSupported.value = false
  inputMode.value = 'text'
  return
}
```

Then, after `speechSupported.value = true`, set the supported default mode:

```ts
speechSupported.value = true
inputMode.value = 'voice'
recognition = new SpeechRecognitionAPI()
```

Why: the approved design says supported browsers default to voice mode, unsupported browsers default to text mode.

- [ ] **Step 3: Run a type/build verification before more behavior changes**

Run:

```bash
npm run build
```

Expected: the build still passes because the new type and ref are additive only.

- [ ] **Step 4: Commit the state-only change**

Run:

```bash
git add src/views/onboarding/AiGuideChat.vue
git commit -m "feat: add onboarding chat input mode state"
```

Expected: one commit containing only the new mode state and initialization updates.

### Task 2: Add mode-switch handlers and guard voice auto-send by mode

**Files:**
- Modify: `src/views/onboarding/AiGuideChat.vue`

- [ ] **Step 1: Add explicit mode-switch handlers**

Insert the following functions after `canSend()` and before the speech-recognition helpers:

```ts
const switchToTextMode = () => {
  if (isRecording.value && recognition) {
    recognition.stop()
    isRecording.value = false
  }

  inputMode.value = 'text'
}

const switchToVoiceMode = () => {
  if (!speechSupported.value) return
  inputMode.value = 'voice'
}
```

Why: switching to text mode must stop active recording; switching back to voice mode must preserve `inputText` and avoid side effects.

- [ ] **Step 2: Prevent voice-recognition auto-send when the UI is no longer in voice mode**

Update `recognition.onend` from:

```ts
recognition.onend = () => {
  isRecording.value = false
  if (inputText.value.trim()) {
    handleSend()
  }
}
```

to:

```ts
recognition.onend = () => {
  isRecording.value = false
  if (inputMode.value === 'voice' && inputText.value.trim()) {
    handleSend()
  }
}
```

Why: if the user switches to text mode while recording, `recognition.stop()` will still trigger `onend`; the mode guard prevents an accidental send during a pure mode switch.

- [ ] **Step 3: Run build verification after behavior changes**

Run:

```bash
npm run build
```

Expected: PASS, with no TypeScript errors for the new handlers.

- [ ] **Step 4: Commit the mode-switch behavior changes**

Run:

```bash
git add src/views/onboarding/AiGuideChat.vue
git commit -m "feat: add onboarding chat input mode switching"
```

### Task 3: Replace the bottom-bar template with explicit voice and text modes

**Files:**
- Modify: `src/views/onboarding/AiGuideChat.vue`

- [ ] **Step 1: Replace the current bottom input section template**

Replace the existing template block starting at:

```vue
      <!-- 底部长按语音输入区 -->
      <section class="border-t border-[#E5E5EA]/60 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
```

and ending at its closing `</section>` with this code:

```vue
      <!-- 底部输入区 -->
      <section class="border-t border-[#E5E5EA]/60 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <div v-if="inputMode === 'voice'" class="flex items-center gap-2.5">
          <button
            type="button"
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F2F7] text-[#8E8E93] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            :disabled="isAiTyping"
            aria-label="切换到打字输入"
            @click="switchToTextMode"
          >
            <span class="material-symbols-outlined text-[18px]">keyboard</span>
          </button>

          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-medium transition-all select-none"
            :class="isRecording
              ? 'bg-[#1D1D1F] text-white'
              : 'bg-[#F2F2F7] text-[#8E8E93] active:bg-[#E5E5EA]'"
            :disabled="isAiTyping || !speechSupported"
            style="letter-spacing: -0.224px"
            @mousedown="startRecording"
            @mouseup="stopRecording"
            @mouseleave="stopRecording"
            @touchstart.prevent="startRecording"
            @touchend.prevent="stopRecording"
          >
            <template v-if="isRecording">
              <div class="flex items-center gap-0.5">
                <div class="h-3 w-[3px] rounded-full bg-white/80 animate-[voice-bar_0.8s_ease-in-out_infinite]" />
                <div class="h-4 w-[3px] rounded-full bg-white/80 animate-[voice-bar_0.8s_ease-in-out_0.15s_infinite]" />
                <div class="h-2 w-[3px] rounded-full bg-white/80 animate-[voice-bar_0.8s_ease-in-out_0.3s_infinite]" />
                <div class="h-5 w-[3px] rounded-full bg-white/80 animate-[voice-bar_0.8s_ease-in-out_0.45s_infinite]" />
                <div class="h-3 w-[3px] rounded-full bg-white/80 animate-[voice-bar_0.8s_ease-in-out_0.6s_infinite]" />
              </div>
              <span>松开发送</span>
            </template>
            <template v-else>
              <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 18">mic</span>
              <span>{{ isAiTyping ? '等待回复...' : '按住说话' }}</span>
            </template>
          </button>
        </div>

        <div v-else class="flex items-center gap-2.5">
          <button
            type="button"
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F2F7] text-[#8E8E93] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            :disabled="isAiTyping || !speechSupported"
            aria-label="切换到语音输入"
            @click="switchToVoiceMode"
          >
            <span class="material-symbols-outlined text-[18px]">mic</span>
          </button>

          <input
            v-model="inputText"
            type="text"
            class="flex-1 rounded-full bg-[#F2F2F7] px-4 py-2.5 text-[15px] text-[#1D1D1F] outline-none placeholder:text-[#8E8E93]/60"
            style="letter-spacing: -0.224px"
            placeholder="说说你的想法..."
            :disabled="isAiTyping"
            @keyup.enter="handleSend"
          />

          <button
            type="button"
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all"
            :class="canSend() ? 'bg-[#1D1D1F] text-white active:scale-90' : 'bg-[#E5E5EA] text-[#8E8E93]/40'"
            :disabled="!canSend()"
            @click="handleSend"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </div>
      </section>
```

Why: this exactly implements the approved layout: voice mode = left keyboard switch + right press-to-talk area; text mode = left mic switch + middle input + right send button.

- [ ] **Step 2: Remove the old `v-if="speechSupported"` / `v-else` layout logic**

Verify that the template no longer branches directly on `speechSupported` for the entire bottom bar. The only remaining speech-support effect should be:

- initialization into `text` mode when unsupported,
- disabling the voice-mode switch target when unsupported.

Why: the new UI is mode-driven, not capability-driven.

- [ ] **Step 3: Run build verification after template replacement**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit the template change**

Run:

```bash
git add src/views/onboarding/AiGuideChat.vue
git commit -m "feat: update onboarding chat bottom input layout"
```

### Task 4: Manually verify the approved interaction in the browser/dev server

**Files:**
- Modify: none
- Verify: `src/views/onboarding/AiGuideChat.vue`

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 3001
```

Expected: Vite starts successfully and prints a reachable local URL.

- [ ] **Step 2: Verify the default supported-browser behavior**

Open the onboarding chat route in the browser and confirm all of the following:

- default bottom bar is in voice mode,
- left-side keyboard icon is visible,
- right-side press-to-talk button is visible,
- existing chat content remains unchanged.

Manual check path:

```text
/onboarding/chat
```

- [ ] **Step 3: Verify switching to text mode**

Click the left keyboard icon and confirm:

- left icon changes to a mic,
- center text input appears,
- right send button appears,
- no message is auto-sent,
- no page jump or layout break occurs.

- [ ] **Step 4: Verify typed send behavior**

Enter a sample message such as:

```text
我更喜欢轻松一点的社交场景
```

Then press Enter and verify:

- the user bubble appears,
- `inputText` clears,
- the AI mock loading state appears,
- a mock follow-up reply arrives as before.

- [ ] **Step 5: Verify switching back to voice mode**

Switch back using the left mic icon and confirm:

- the large press-to-talk control returns,
- previously typed but unsent text would remain if text mode is reopened,
- switching modes alone never sends a message.

- [ ] **Step 6: Verify press-to-talk behavior still works**

Press and hold the voice control, then release. Confirm:

- recording visual state appears while pressed,
- release stops recording,
- recognized speech is sent through the existing `handleSend()` flow,
- AI mock response still appears.

- [ ] **Step 7: Verify AI typing lock behavior**

While the AI loading indicator is visible, confirm:

- send button is disabled,
- voice recording cannot start,
- left-side mode switch buttons do not produce inconsistent behavior.

- [ ] **Step 8: Commit after manual verification if code changed during fixes**

If no fixes were needed, do nothing. If manual verification required code adjustments, run:

```bash
git add src/views/onboarding/AiGuideChat.vue
git commit -m "fix: polish onboarding chat input toggle behavior"
```

### Task 5: Verify unsupported-speech fallback behavior

**Files:**
- Modify: none unless a bug is found
- Verify: `src/views/onboarding/AiGuideChat.vue`

- [ ] **Step 1: Temporarily simulate unsupported speech recognition in the browser**

Use a browser/devtools environment where `window.SpeechRecognition` and `window.webkitSpeechRecognition` are unavailable, then reload the page.

Expected runtime branch in code:

```ts
if (!SpeechRecognitionAPI) {
  speechSupported.value = false
  inputMode.value = 'text'
  return
}
```

- [ ] **Step 2: Verify fallback behavior**

Confirm all of the following:

- page opens directly in text mode,
- text input is immediately usable,
- no unusable full-width voice-first button is shown,
- send behavior still works.

- [ ] **Step 3: Run final production build verification**

Run:

```bash
npm run build
```

Expected: PASS with a production bundle generated by Vite.

- [ ] **Step 4: Commit only if fallback verification required code changes**

If fixes were needed, run:

```bash
git add src/views/onboarding/AiGuideChat.vue
git commit -m "fix: handle onboarding chat speech fallback"
```

## Plan Self-Review Notes

- Spec coverage check:
  - Explicit voice/text toggle: covered by Tasks 1–3.
  - Voice mode layout with keyboard button: covered by Task 3.
  - Text mode layout with mic button, input, send: covered by Task 3.
  - Switching behavior and no accidental sends: covered by Task 2 and Task 4.
  - Unsupported speech defaults to text mode: covered by Task 1 and Task 5.
  - Frontend-only scope: preserved by editing only `src/views/onboarding/AiGuideChat.vue`.
- Placeholder scan: no `TODO`, `TBD`, or vague “test later” instructions remain.
- Type consistency check:
  - `InputMode`, `inputMode`, `switchToTextMode()`, and `switchToVoiceMode()` are named consistently throughout the plan.