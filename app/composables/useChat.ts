// app/composables/useChat.ts
import type { ProviderName } from '~~/shared/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

export function useChat() {
  const { authFetch } = useAuth()

  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const currentConversationId = ref<number | null>(null)

  const newConversation = () => {
    messages.value = []
    currentConversationId.value = null
  }

  const sendMessage = async (content: string, provider: ProviderName = 'deepseek') => {
    if (!content.trim() || isLoading.value) return

    // 把用户消息推入列表，截快照作为请求 payload（不含 loading 字段）
    messages.value.push({ role: 'user', content })
    const payloadMessages = messages.value.map(({ role, content }) => ({ role, content }))

    // 推入 assistant 占位，后续流式更新它
    isLoading.value = true
    const assistantMsg: ChatMessage = { role: 'assistant', content: '', loading: true }
    messages.value.push(assistantMsg)

    try {
      console.log('📤 发送请求，conversationId:', currentConversationId.value)
      const response = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: payloadMessages,
          provider,
          conversationId: currentConversationId.value ?? undefined,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`请求失败: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let firstChunk = true

      // 提取为内部函数，while 循环和尾部 buffer 共用同一份解析逻辑
      const processLines = (text: string) => {
        for (const line of text.split('\n')) {
          if (!line.startsWith('data:')) continue
          const raw = line.slice(5).trim()
          if (!raw || raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            // 自定义 meta 事件：服务端在流开头发，告知 conversationId
            if (parsed.type === 'meta' && parsed.conversationId) {
              currentConversationId.value = parsed.conversationId
              console.log('✅ meta 收到，conversationId:', currentConversationId.value)
              continue
            }
            // 正常 AI delta
            const delta: string | undefined = parsed.choices?.[0]?.delta?.content
            if (delta) {
              if (firstChunk) {
                assistantMsg.loading = false
                firstChunk = false
              }
              assistantMsg.content += delta
            }
          } catch {
            /* JSON 解析失败跳过 */
          }
        }
      }

      // 按 \n\n 分割成完整 SSE 事件，逐段处理
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''
        for (const evt of events) processLines(evt)
      }

      // 流结束后处理 buffer 残留的最后一段
      if (buffer.trim()) processLines(buffer)
      // 全程没收到任何 delta（空响应），也要关掉 loading
      if (firstChunk) assistantMsg.loading = false
    } catch (error) {
      console.error('出错了:', error)
      assistantMsg.content = '抱歉，请求出错了，请稍后再试。'
    } finally {
      // 不管正常结束还是报错，统一在这里收尾
      assistantMsg.loading = false
      isLoading.value = false
    }
  }

  return { messages, isLoading, currentConversationId, newConversation, sendMessage }
}
