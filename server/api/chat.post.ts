// server/api/chat.post.ts
import { defineEventHandler, readBody, createError, sendStream, setResponseHeaders } from 'h3'
import { requireAuth } from '~~/server/utils/requireAuth'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { messages } = (await readBody(event)) as { messages: Message[] }

  const config = useRuntimeConfig()
  const apiKey = config.apiKey
  const apiBaseUrl = config.aiBaseUrl

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'API Key is not configured' })
  }
  if (!apiBaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'AI Base URL is not configured' })
  }

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => '')
    console.error('API Error:', response.status, errorText)
    throw createError({
      statusCode: response.status,
      statusMessage: `API error: ${response.statusText}`,
    })
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  return sendStream(event, response.body)
})
