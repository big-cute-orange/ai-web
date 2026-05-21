<template>
  <div class="page-bg">
    <!-- 未登录：登录/注册 -->
    <div v-if="!auth.currentUser.value && !auth.isLoading.value" class="auth-card">
      <div class="brand">
        <div class="brand-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h1 class="brand-name">Nuxt Chat</h1>
        <p class="brand-desc">
          {{ activeTab === 'login' ? '登录以开始对话' : '创建账号加入我们' }}
        </p>
      </div>

      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'login' }]" @click="activeTab = 'login'">
          登录
        </button>
        <button
          :class="['tab', { active: activeTab === 'register' }]"
          @click="activeTab = 'register'"
        >
          注册
        </button>
        <div
          class="tab-indicator"
          :style="{ transform: activeTab === 'register' ? 'translateX(100%)' : 'translateX(0)' }"
        />
      </div>

      <form class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label class="label">用户名</label>
          <div class="input-wrapper">
            <svg
              class="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              v-model="form.username"
              type="text"
              class="input"
              placeholder="请输入用户名（3-20位）"
              required
              minlength="3"
              maxlength="20"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="field">
          <label class="label">密码</label>
          <div class="input-wrapper">
            <svg
              class="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              v-model="form.password"
              type="password"
              class="input"
              placeholder="请输入密码（6-50位）"
              required
              minlength="6"
              maxlength="50"
              autocomplete="current-password"
            />
          </div>
        </div>

        <Transition name="fade">
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        </Transition>

        <UButton type="submit" :loading="submitting" block size="lg" class="submit-btn">
          {{ activeTab === 'login' ? '登录' : '注册' }}
        </UButton>
      </form>

      <p class="switch-hint">
        {{ activeTab === 'login' ? '还没有账号？' : '已有账号？' }}
        <button
          class="switch-link"
          @click="activeTab = activeTab === 'login' ? 'register' : 'login'"
        >
          {{ activeTab === 'login' ? '立即注册' : '去登录' }}
        </button>
      </p>
    </div>

    <!-- 加载中 -->
    <div v-else-if="auth.isLoading.value" class="loading-state">
      <div class="loading-spinner" />
      <p>加载中...</p>
    </div>

    <!-- 已登录 -->
    <div v-else class="logged-in-card">
      <div class="brand-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h1 class="brand-name">Nuxt Chat</h1>
      <p class="welcome">
        欢迎回来，<span class="username">{{ auth.currentUser.value?.username }}</span>
      </p>
      <div class="actions">
        <UButton to="/chat" size="lg" block>开始聊天</UButton>
        <UButton color="neutral" variant="ghost" size="lg" block @click="auth.logout()">
          退出登录
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 首页 — 登录 / 注册 / 聊天入口
 *
 * 三种状态：
 * 1. 未登录 → 显示登录/注册表单
 * 2. 加载中 → 显示加载动画
 * 3. 已登录 → 显示欢迎信息和聊天入口
 */

const auth = useAuth()
const router = useRouter()

// 当前选中的标签页：login | register
const activeTab = ref<'login' | 'register'>('login')

// 表单数据
const form = reactive({
  username: '',
  password: '',
})

// 是否正在提交
const submitting = ref(false)

// 错误消息
const errorMsg = ref('')

// ========== 页面初始化：尝试恢复会话 ==========
onMounted(() => {
  auth.fetchUser()
})

// ========== 提交表单 ==========
const handleSubmit = async () => {
  errorMsg.value = ''
  submitting.value = true

  try {
    if (activeTab.value === 'login') {
      await auth.login(form.username, form.password)
    } else {
      await auth.register(form.username, form.password)
    }
    // 成功后刷新到聊天页
    router.push('/chat')
  } catch (err: any) {
    errorMsg.value = err.message || '操作失败，请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 30%, #eff6ff 70%, #f0f9ff 100%);
}

/* ====== 卡片通用 ====== */
.auth-card,
.logged-in-card {
  width: 100%;
  max-width: 420px;
  margin: 1rem;
  padding: 2.5rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.03),
    0 8px 40px rgba(0, 0, 0, 0.08);
}

/* ====== 品牌区域 ====== */
.brand {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  margin-bottom: 1rem;
}

.brand-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.brand-desc {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #94a3b8;
}

/* ====== 标签页 ====== */
.tabs {
  position: relative;
  display: flex;
  margin-bottom: 1.75rem;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: color 0.25s;
  border-radius: 8px;
}

.tab.active {
  color: #0f172a;
}

.tab-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ====== 表单 ====== */
.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.2s;
}

.input-wrapper:focus-within .input-icon {
  color: #22c55e;
}

.input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  background: white;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.input::placeholder {
  color: #cbd5e1;
}

.input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
}

.submit-btn {
  margin-top: 0.25rem;
  border-radius: 12px !important;
}

/* ====== 错误提示 ====== */
.error {
  color: #dc2626;
  font-size: 0.85rem;
  text-align: center;
  padding: 0.6rem 1rem;
  background: #fef2f2;
  border-radius: 10px;
  border: 1px solid #fecaca;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ====== 底部切换 ====== */
.switch-hint {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.switch-link {
  background: none;
  border: none;
  color: #22c55e;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
}

.switch-link:hover {
  text-decoration: underline;
}

/* ====== 已登录 ====== */
.logged-in-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.welcome {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.username {
  font-weight: 700;
  color: #22c55e;
}

.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

/* ====== 加载 ====== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748b;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
