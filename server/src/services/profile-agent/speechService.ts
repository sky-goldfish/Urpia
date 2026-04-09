import { profileAgentEnv } from '../../config/env.js'
import { siliconflowBinary, siliconflowJson } from '../../lib/siliconflow.js'

type TranscriptionResponse = {
  text?: string
}

export const transcribeAudio = async (audio: Buffer) => {
  const form = new FormData()
  form.append('file', new Blob([audio], { type: 'audio/webm' }), 'voice.webm')
  form.append('model', profileAgentEnv.asrModel)

  const data = await siliconflowJson<TranscriptionResponse>('/audio/transcriptions', {
    method: 'POST',
    body: form
  })

  return {
    text: data.text?.trim() ?? '',
    provider: 'telespeech' as const
  }
}

export const synthesizeSpeech = async (input: string) => {
  const result = await siliconflowBinary('/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: profileAgentEnv.ttsModel,
      input,
      voice: profileAgentEnv.ttsVoice,
      response_format: 'mp3',
      stream: false
    })
  })

  return {
    audioBase64: result.buffer.toString('base64'),
    contentType: result.contentType,
    provider: 'moss' as const
  }
}
