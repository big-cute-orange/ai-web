<template>
  <div class="chat-container">
    <!-- 顶部用户栏 -->
    <header class="top-bar">
      <div class="user-info">
        <div class="user-avatar">{{ userInitial }}</div>
        <span class="user-name">{{ displayName }}</span>
      </div>
      <!-- 新对话按钮：清空消息并重置 conversationId -->
      <button class="new-chat-btn" @click="newConversation">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>新对话</span>
      </button>
      <!-- Provider 切换下拉框 -->
      <select v-model="selectedProvider" class="provider-dropdown" title="切换 AI 模型">
        <option value="deepseek">DeepSeek</option>
        <option value="qwen">通义千问</option>
      </select>
      <button class="logout-btn" :disabled="loggingOut" @click="handleLogout">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>退出登录</span>
      </button>
    </header>

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
      <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
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
// definePageMeta({
//   middleware: 'auth',
// })
import type { ProviderName } from '~~/shared/types'

const { currentUser, logout } = useAuth()
// 从 composable 拿数据和核心逻辑
const {
  messages,
  isLoading,
  newConversation: _newConversation,
  sendMessage: _sendMessage,
} = useChat()

// 当前选择的 AI Provider，绑定到页面顶部的下拉框
const selectedProvider = ref<ProviderName>('deepseek')

const displayName = computed(() => currentUser.value?.nickname || currentUser.value?.username || '')
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase() || '?')

// 当前对话的 ID（第一条消息发出后，从服务端 meta 事件里获得）
// null 表示还没有对话（或者用户点了"新对话"按钮）
// const currentConversationId = ref<number | null>(null)
const userInput = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 新对话：composable 负责重置状态，页面负责聚焦输入框
const newConversation = () => {
  _newConversation()
  nextTick(() => textareaRef.value?.focus())
}

// 发消息：composable 负责网络请求，页面负责清空输入框
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  const content = userInput.value
  userInput.value = ''
  nextTick(() => {
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  })
  await _sendMessage(content, selectedProvider.value)
}

// 首页的示例建议，点击后会填入输入框，用户可以直接发送或修改后发送
const suggestions = [
  { icon: '✈️', text: '帮我规划北京 3 天行程，喜欢历史文化' },
  { icon: '🏖️', text: '三亚 5 天亲子游，预算 5000 元以内' },
  { icon: '🗺️', text: '云南大理 → 丽江 → 香格里拉 7 天路线' },
  { icon: '🍜', text: '成都 2 天美食攻略，不错过任何经典小吃' },
]
// 文本框自动增高，最大到 200px
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

// 消息列表变化时自动滚到底部
const messagesAreaRef = ref<HTMLElement | null>(null)
const scrollToBottom = () => {
  nextTick(() => {
    const el = messagesAreaRef.value
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })
}
// 监听 messages 内容的变化（只要消息文本有变动就滚动），而不是整个 messages 数组（避免每次添加消息都滚动两次）
watch(
  () => messages.value.map((m: any) => m.content).join(''),
  () => scrollToBottom(),
)

// 退出登录：调用 composable 的 logout 方法，清除用户状态，然后跳转到登录页
const loggingOut = ref(false)
const handleLogout = async () => {
  loggingOut.value = true
  logout()
  await navigateTo('/auth/login', { replace: true })
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
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
  color: #1f2937;
}

/* 顶部用户栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  flex-shrink: 0;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
}
.user-name {
  font-size: 0.9rem;
  color: #334155;
  font-weight: 500;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #64748b;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.logout-btn:hover:not(:disabled) {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}
.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
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
  transition:
    transform 0.1s ease,
    opacity 0.15s ease;
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

/* Provider 切换下拉框 */
.provider-dropdown {
  padding: 0.3rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 0.82rem;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease;
}
.provider-dropdown:focus,
.provider-dropdown:hover {
  border-color: #6366f1;
}

/* 新对话按钮 */
.new-chat-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #64748b;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.new-chat-btn:hover {
  color: #6366f1;
  border-color: #c7d2fe;
  background: #eef2ff;
}
</style>
