<!-- pages/chat.vue -->
<template>
  <div class="chat-container">
    <!-- 消息展示区域 -->
    <div ref="messagesAreaRef" class="messages-area">
      <!-- 空状态欢迎页 -->
      <div v-if="messages.length === 0" class="welcome">
        <div class="welcome-logo">✨</div>
        <h1 class="welcome-title">有什么可以帮你的？</h1>
        <p class="welcome-subtitle">从下面的示例开始，或直接输入你的问题。</p>
        <div class="welcome-suggestions">
          <button
            v-for="(s, i) in suggestions"
            :key="i"
            class="suggestion-card"
            @click="useSuggestion(s)"
          >
            <span class="suggestion-icon">{{ s.icon }}</span>
            <span class="suggestion-text">{{ s.text }}</span>
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.role]"
      >
        <div class="avatar" :class="message.role">
          {{ message.role === 'user' ? '我' : 'AI' }}
        </div>
        <div class="message-bubble">
          <p v-if="message.role === 'user'" class="user-text">{{ message.content }}</p>
          <ChatMessage v-else :content="message.content" :loading="message.loading" />
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-wrapper">
        <textarea
          ref="textareaRef"
          v-model="userInput"
          rows="1"
          placeholder="给 AI 发送消息..."
          :disabled="isLoading"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
        />
        <button
          class="send-btn"
          :disabled="isLoading || !userInput.trim()"
          aria-label="发送"
          @click="sendMessage"
        >
          <svg
            v-if="!isLoading"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
          </svg>
          <svg
            v-else
            class="spinner"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </button>
      </div>
      <p class="hint">按 Enter 发送，Shift + Enter 换行</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'auth',
})

const { authFetch } = useAuth()

const messages = ref<any[]>([])
const userInput = ref('')
const isLoading = ref(false)

const messagesAreaRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const suggestions = [
  { icon: '💡', text: '帮我想几个周末活动的点子' },
  { icon: '✍️', text: '用更简洁的方式重写一段文字' },
  { icon: '🧠', text: '解释一个复杂的概念' },
  { icon: '🐛', text: '帮我调试一段代码' },
]

const scrollToBottom = () => {
  nextTick(() => {
    const el = messagesAreaRef.value
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })
}

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

const useSuggestion = (s: { text: string }) => {
  userInput.value = s.text
  nextTick(() => {
    autoResize()
    textareaRef.value?.focus()
  })
}

watch(
  () => messages.value.map(m => m.content).join(''),
  () => scrollToBottom(),
)

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  messages.value.push({ role: 'user', content: userInput.value })
  userInput.value = ''
  nextTick(() => {
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  })
  const payloadMessages = [...messages.value]

  isLoading.value = true
  const assistantIndex = messages.value.length
  messages.value.push({ role: 'assistant', content: '', loading: true })
  scrollToBottom()

  try {
    const response = await authFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: payloadMessages }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`请求失败: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let firstChunk = true

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const evt of events) {
        for (const line of evt.split('\n')) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta: string | undefined = parsed.choices?.[0]?.delta?.content
            if (delta) {
              if (firstChunk) {
                messages.value[assistantIndex].loading = false
                firstChunk = false
              }
              messages.value[assistantIndex].content += delta
            }
          } catch {
            //
          }
        }
      }
    }

    if (buffer.trim()) {
      for (const line of buffer.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const delta: string | undefined = parsed.choices?.[0]?.delta?.content
          if (delta) {
            if (firstChunk) {
              messages.value[assistantIndex].loading = false
              firstChunk = false
            }
            messages.value[assistantIndex].content += delta
          }
        } catch {
          //
        }
      }
    }

    if (firstChunk) {
      messages.value[assistantIndex].loading = false
    }
  } catch (error) {
    console.error('出错了:', error)
    messages.value[assistantIndex].loading = false
    messages.value[assistantIndex].content = '抱歉，请求出错了，请稍后再试。'
  } finally {
    messages.value[assistantIndex].loading = false
    isLoading.value = false
  }
}
</script>

<style scoped>
.chat-container {
  max-width: 860px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: #1f2937;
}

/* 消息区 */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  scroll-behavior: smooth;
}
.messages-area::-webkit-scrollbar {
  width: 8px;
}
.messages-area::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}
.messages-area::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

/* 欢迎页 */
.welcome {
  margin: auto;
  text-align: center;
  max-width: 640px;
  padding: 2rem 1rem;
  animation: fadeIn 0.4s ease;
}
.welcome-logo {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.welcome-title {
  font-size: 1.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.welcome-subtitle {
  color: #6b7280;
  margin: 0 0 2rem;
  font-size: 0.95rem;
}
.welcome-suggestions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
.suggestion-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  text-align: left;
  transition: all 0.15s ease;
}
.suggestion-card:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateY(-1px);
}
.suggestion-icon {
  font-size: 1.25rem;
}

/* 消息 */
.message {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  animation: slideIn 0.3s ease;
}
.message.user {
  flex-direction: row-reverse;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
  color: #fff;
}
.avatar.user {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}
.avatar.assistant {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
}
.message-bubble {
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: #f3f4f6;
  line-height: 1.6;
  word-break: break-word;
}
.message.user .message-bubble {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  border-bottom-right-radius: 0.25rem;
}
.message.assistant .message-bubble {
  border-bottom-left-radius: 0.25rem;
}
.user-text {
  margin: 0;
  white-space: pre-wrap;
}

/* 输入区 */
.input-area {
  padding: 1rem 1.5rem 1.25rem;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 30%);
}
.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input-wrapper:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.input-wrapper textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  background: transparent;
  padding: 0.5rem 0;
  max-height: 200px;
  color: inherit;
}
.input-wrapper textarea::placeholder {
  color: #9ca3af;
}
.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.1s ease, opacity 0.15s ease;
}
.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
}
.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}
.send-btn svg {
  width: 18px;
  height: 18px;
}
.spinner {
  animation: spin 0.8s linear infinite;
}
.hint {
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0.5rem 0 0;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .welcome-suggestions {
    grid-template-columns: 1fr;
  }
  .message-bubble {
    max-width: 85%;
  }
  .messages-area {
    padding: 1rem;
  }
}
</style>
