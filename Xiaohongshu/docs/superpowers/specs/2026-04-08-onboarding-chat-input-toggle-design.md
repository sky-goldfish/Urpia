# Onboarding Chat Input Toggle Design

## Overview

This spec defines a frontend-only update to the onboarding chat page input area in `src/views/onboarding/AiGuideChat.vue`.

The current page supports either:

- a full-width press-to-talk voice button when speech recognition is supported, or
- a text input fallback when speech recognition is not supported.

The new design introduces an explicit mode switch so users can move between voice input and typed input from the same bottom bar.

## Goals

1. Keep the current onboarding chat page structure intact outside the bottom input area.
2. Add a clear and lightweight switch between voice mode and text mode.
3. Preserve the current voice-input behavior in voice mode.
4. Preserve the current text-send behavior in text mode.
5. Keep this change frontend-only with no backend or API changes.

## Non-Goals

- No backend integration changes
- No message schema or protocol changes
- No new APIs
- No complex motion design or large animation refactor
- No redesign of the chat content area or top navigation

## Recommended Approach

Adopt a **dual-mode bottom bar** with a single shared container.

### Voice mode

- Left side shows a small keyboard icon button.
- Right side shows the existing large press-and-hold voice button.

### Text mode

- Left side shows a small voice icon button.
- Center shows a text input field.
- Right side shows a send button.

This approach was chosen because it best matches the requested interaction, keeps the UI easy to understand, and reuses the most existing logic.

## UX Behavior

### Default mode

- If speech recognition is supported, default to `voice` mode.
- If speech recognition is not supported, default to `text` mode.

### Switching from voice mode to text mode

- Triggered by tapping the left keyboard icon.
- If recording is active, recording is stopped immediately.
- Do not auto-transfer partial speech recognition content as part of the mode switch.
- Do not auto-send anything during the switch.

### Switching from text mode to voice mode

- Triggered by tapping the left voice icon.
- Existing typed text remains in `inputText`.
- Do not auto-send typed content during the switch.
- If the user switches back to text mode later, the previous text remains available.

### Sending behavior

- Text mode continues using the existing `handleSend()` flow.
- Send button availability continues using the existing `canSend()` rule.
- Voice mode continues using the current speech-recognition-driven flow.
- Automatic send after successful speech recognition remains enabled only for voice mode.

### AI typing state

- While AI is replying:
  - the voice recording entry points remain disabled,
  - the send action remains disabled,
  - mode-switch controls should also visually reflect a disabled state or prevent interaction if needed for consistency.

## Visual Design

- Reuse the current visual language already present on the page.
- Keep the white bottom container and soft gray control backgrounds.
- Keep the dark primary action appearance for the send/recording emphasis.
- The left-side switch control should be a smaller circular icon button.
- The switch control should feel secondary to the main input action.
- The voice press area should remain the dominant control in voice mode.
- In text mode, the input field should visually dominate the row, with the send button remaining compact and clear.

## Component/State Design

Add a new local reactive state in `AiGuideChat.vue`:

```ts
type InputMode = 'voice' | 'text'
```

Add a reactive state similar to:

```ts
const inputMode = ref<InputMode>('voice')
```

Initialization behavior:

- set `inputMode` to `voice` when speech is supported,
- set `inputMode` to `text` when speech is not supported.

Add small mode-switch handlers, for example:

- `switchToTextMode()`
- `switchToVoiceMode()`

Responsibilities:

- `switchToTextMode()` stops recording if necessary, then sets mode to `text`
- `switchToVoiceMode()` sets mode to `voice` without clearing `inputText`

## Template Structure

The bottom input section should remain one shared container.

Suggested rendering behavior:

- show the same outer bottom bar wrapper,
- inside it, render one of two row layouts based on `inputMode`.

### Voice mode row

- left: keyboard switch button
- right: current full-width press-and-hold voice button

### Text mode row

- left: voice switch button
- center: text input
- right: send button

If speech recognition is unsupported, the component should initialize directly in text mode and avoid presenting an unusable voice-first layout.

## Error Handling and Edge Cases

- If speech recognition is unsupported, default to text mode immediately.
- If switching to text mode while recording, stop recording cleanly.
- If `recognition.start()` throws because of duplicate starts, keep the current defensive behavior.
- Do not clear `inputText` when switching from text mode back to voice mode.
- Do not accidentally trigger send when users are only switching modes.

## Testing and Verification Scope

The implementation should verify the following:

1. User can switch from voice mode to text mode using the left icon.
2. User can switch from text mode back to voice mode using the left icon.
3. Text mode allows typing and sending as before.
4. Voice mode still allows press-and-hold recording and auto-send after recognition.
5. AI typing state still blocks sending and recording.
6. Browsers without speech recognition start in text mode.
7. Switching modes does not unexpectedly clear typed content.

## Acceptance Criteria

- The onboarding chat page exposes both voice and text input modes through a fixed left-side toggle button.
- Voice mode displays a keyboard switch button plus the existing press-to-talk interaction.
- Text mode displays a voice switch button, a text input field, and a send button.
- The feature remains frontend-only.
- Unsupported speech-recognition environments default to text mode.
- Existing message send logic and mock AI behavior continue to work without backend changes.