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

      <!-- ====== 微信登录分割线 ====== -->
      <div class="divider">
        <span class="divider-text">其他登录方式</span>
      </div>

      <!-- ====== 微信登录按钮 ====== -->
      <UButton
        color="success"
        variant="outline"
        block
        size="lg"
        class="wechat-btn"
        @click="handleWechatLogin"
      >
        <svg
          class="wechat-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.704-1.414 3.973-2.098 6.32-2.193a9.446 9.446 0 0 0-.482-1.573C16.324 3.606 12.868 2.19 8.69 2.189Zm3.415 8.358c-.311.002-.565-.243-.565-.553 0-.31.254-.553.565-.553.305-.018.572.238.565.553.006.311-.255.555-.565.553Zm-4.16 0c-.309-.023-.571-.264-.565-.572.004-.31.258-.555.567-.554.31.001.566.245.565.554a.563.563 0 0 1-.567.572Z"
          />
          <path
            d="M24 16.147c0-3.081-2.892-5.587-6.468-5.587-3.569 0-6.468 2.506-6.468 5.587 0 3.081 2.899 5.587 6.468 5.587a7.86 7.86 0 0 0 2.17-.306l1.457.862a.255.255 0 0 0 .128.04.223.223 0 0 0 .223-.223c0-.053-.011-.106-.037-.16l-.302-1.141a.466.466 0 0 1 .167-.512c1.424-1.061 2.662-2.498 2.662-4.147Zm-5.316-1.334c.307.008.56.25.554.556a.556.556 0 0 1-.554.556.56.56 0 0 1-.557-.556.557.557 0 0 1 .557-.556Zm-3.339 0c.308.001.558.25.553.556a.557.557 0 0 1-.553.556.551.551 0 0 1-.558-.551.556.556 0 0 1 .558-.561Z"
          />
        </svg>
        微信扫码登录
      </UButton>

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

const handleWechatLogin = () => {
  window.location.href = '/api/auth/wechat/login'
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

/* ====== 微信登录 ====== */
.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0 1rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.divider-text {
  font-size: 0.8rem;
  color: #94a3b8;
  white-space: nowrap;
}

.wechat-btn {
  border-radius: 12px !important;
  border-color: #22c55e !important;
  color: #16a34a !important;
}

.wechat-btn:hover {
  background: #f0fdf4 !important;
}

.wechat-icon {
  flex-shrink: 0;
}
</style>
