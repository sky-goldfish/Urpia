import { profileAgentEnv } from '../config/env.js'

const API_BASE_URL = 'https://api.siliconflow.cn/v1'

const withAuthHeaders = (headers?: HeadersInit) => ({
  Authorization: `Bearer ${profileAgentEnv.apiKey}`,
  ...(headers ?? {})
})

export const siliconflowJson = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: withAuthHeaders(init.headers)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SiliconFlow request failed (${response.status}): ${text}`)
  }

  return response.json() as Promise<T>
}

export const siliconflowBinary = async (path: string, init: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: withAuthHeaders(init.headers)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SiliconFlow binary request failed (${response.status}): ${text}`)
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') ?? 'application/octet-stream'
  }
}
