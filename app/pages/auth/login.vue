<template>
  <div class="page-bg">
    <div v-if="!auth.currentUser.value && !auth.isLoading.value" class="auth-wrapper">
      <!-- ===== 左侧品牌面板 ===== -->
      <div class="brand-panel">
        <div class="brand-top">
          <div class="brand-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l1.8 5.4H19l-4.3 3.2 1.6 5-4.3-3.1-4.3 3.1 1.6-5L5 7.4h5.2L12 2z" />
            </svg>
          </div>
          <span class="brand-name">AI Travel Companion</span>
        </div>

        <div class="brand-content">
          <h1 class="brand-headline">
            开启您的<br />
            <span class="headline-accent">轻盈探索</span>之旅
          </h1>
          <p class="brand-desc">
            智能规划，压力全消。我们用 AI 为您打造专属的、如清风般自在的旅行体验。
          </p>
        </div>

        <div class="brand-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 240" class="landscape-svg">
            <defs>
              <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#c5ede3" />
                <stop offset="100%" stop-color="#eaf7f2" />
              </linearGradient>
              <linearGradient id="waterG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#aeddd1" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#8fcec2" stop-opacity="0.5" />
              </linearGradient>
              <linearGradient id="m1G" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#5aad97" />
                <stop offset="100%" stop-color="#3a8878" />
              </linearGradient>
              <linearGradient id="m2G" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3d9080" />
                <stop offset="100%" stop-color="#1f6055" />
              </linearGradient>
            </defs>
            <rect width="560" height="240" fill="url(#skyG)" rx="16" />
            <polygon
              points="0,148 70,65 155,125 245,48 335,115 420,42 505,102 560,78 560,148"
              fill="#72c4ae"
              opacity="0.45"
            />
            <polygon
              points="0,168 65,95 148,148 235,72 318,135 405,62 488,118 560,90 560,168"
              fill="url(#m1G)"
              opacity="0.8"
            />
            <polygon
              points="0,188 108,112 212,165 308,96 408,155 560,108 560,188"
              fill="url(#m2G)"
            />
            <rect x="0" y="188" width="560" height="52" fill="url(#waterG)" />
            <line
              x1="90"
              y1="200"
              x2="220"
              y2="200"
              stroke="white"
              stroke-width="1"
              stroke-opacity="0.25"
            />
            <line
              x1="280"
              y1="207"
              x2="420"
              y2="207"
              stroke="white"
              stroke-width="0.8"
              stroke-opacity="0.2"
            />
            <line
              x1="45"
              y1="218"
              x2="175"
              y2="218"
              stroke="white"
              stroke-width="0.8"
              stroke-opacity="0.15"
            />
          </svg>
        </div>

        <p class="brand-copyright">© 2024 AI Travel Companion. Built for breezy exploration.</p>
      </div>

      <!-- ===== 右侧表单面板 ===== -->
      <div class="form-panel">
        <div class="form-inner">
          <div class="form-header">
            <h2 class="form-title">{{ activeTab === 'register' ? '创建账户' : '欢迎回来' }}</h2>
            <p class="form-subtitle">
              {{
                activeTab === 'register'
                  ? '注册账户，开启您的旅行规划'
                  : '请登录您的账户，继续您的旅行规划'
              }}
            </p>
          </div>

          <!-- 账号登录 / 账号注册 Tabs -->
          <div class="tabs">
            <button
              type="button"
              :class="['tab', { active: activeTab === 'login' }]"
              @click="switchTab('login')"
            >
              账号登录
            </button>
            <button
              type="button"
              :class="['tab', { active: activeTab === 'register' }]"
              @click="switchTab('register')"
            >
              账号注册
            </button>
            <div
              class="tab-indicator"
              :style="{
                transform: activeTab === 'register' ? 'translateX(100%)' : 'translateX(0)',
              }"
            />
          </div>

          <!-- 表单 -->
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
                  :placeholder="
                    activeTab === 'register' ? '请输入用户名（3-20位）' : '请输入用户名'
                  "
                  required
                  minlength="3"
                  maxlength="20"
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="field">
              <div class="label-row">
                <label class="label">密码</label>
                <button
                  v-if="activeTab === 'login'"
                  type="button"
                  class="forgot-link"
                  @click="handleForgot"
                >
                  忘记密码？
                </button>
              </div>
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
                  :type="showPassword ? 'text' : 'password'"
                  class="input input-has-toggle"
                  :placeholder="activeTab === 'register' ? '请设置密码（6-50位）' : '请输入密码'"
                  required
                  minlength="6"
                  maxlength="50"
                  :autocomplete="activeTab === 'register' ? 'new-password' : 'current-password'"
                />
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                  <svg
                    v-if="showPassword"
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
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                    />
                    <path
                      d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg
                    v-else
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <Transition name="fade">
              <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
            </Transition>

            <button type="submit" :disabled="submitting" class="submit-btn">
              <span v-if="submitting" class="btn-spinner" />
              <span>{{ activeTab === 'register' ? '立即注册' : '立即登录' }}</span>
              <svg
                v-if="!submitting"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          <!-- 第三方登录 -->
          <div class="third-party">
            <div class="divider">
              <span class="divider-text">第三方登录方式</span>
            </div>
            <button type="button" class="wechat-btn" @click="handleWechatLogin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.704-1.414 3.973-2.098 6.32-2.193a9.446 9.446 0 0 0-.482-1.573C16.324 3.606 12.868 2.19 8.69 2.189Z"
                />
                <path
                  d="M24 16.147c0-3.081-2.892-5.587-6.468-5.587-3.569 0-6.468 2.506-6.468 5.587 0 3.081 2.899 5.587 6.468 5.587a7.86 7.86 0 0 0 2.17-.306l1.457.862a.255.255 0 0 0 .128.04.223.223 0 0 0 .223-.223c0-.053-.011-.106-.037-.16l-.302-1.141a.466.466 0 0 1 .167-.512c1.424-1.061 2.662-2.498 2.662-4.147Z"
                />
              </svg>
              <span>微信登录</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-else class="loading-state">
      <div class="loading-spinner" />
      <p>加载中...</p>
    </div>

    <!-- 微信扫码弹窗 -->
    <UModal v-model:open="showQrModal" title="微信扫码登录" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <div class="qr-container">
          <div v-if="qrStatus === 'loading'" class="qr-loading">
            <span class="qr-spinner" />
            <p>正在生成二维码...</p>
          </div>
          <template v-else>
            <canvas ref="qrCanvasRef" class="qr-canvas" />
            <p v-if="qrStatus === 'pending'" class="qr-hint">
              <span class="qr-spinner-sm" />
              请使用微信扫描二维码
            </p>
            <p v-else-if="qrStatus === 'expired'" class="qr-hint qr-error">
              二维码已过期
              <button type="button" class="refresh-btn" @click="loadWechatQr">刷新</button>
            </p>
          </template>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import QRCode from 'qrcode'

const auth = useAuth()

const activeTab = ref<'login' | 'register'>('login')
const showPassword = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const submitting = ref(false)
const errorMsg = ref('')

// ========== 页面初始化 ==========
onMounted(async () => {
  await auth.fetchUser()
  if (auth.currentUser.value) {
    await navigateTo('/', { replace: true })
  }
})

// ========== 切换 Tab ==========
const switchTab = (tab: 'login' | 'register') => {
  activeTab.value = tab
  errorMsg.value = ''
  form.username = ''
  form.password = ''
  showPassword.value = false
}

// ========== 提交表单 ==========
const handleSubmit = async () => {
  errorMsg.value = ''
  submitting.value = true
  try {
    if (activeTab.value === 'register') {
      await auth.register(form.username, form.password)
    } else {
      await auth.login(form.username, form.password)
    }
    await navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.message || '操作失败，请重试'
  } finally {
    submitting.value = false
  }
}

// ========== 忘记密码（占位） ==========
const handleForgot = () => {
  errorMsg.value = '忘记密码功能暂未开放，请联系管理员'
}

// ========== 微信扫码登录 ==========
const showQrModal = ref(false)
const qrCanvasRef = ref<HTMLCanvasElement | null>(null)
const qrStatus = ref<'loading' | 'pending' | 'expired'>('loading')
let pollTimer: ReturnType<typeof setInterval> | null = null

const stopPoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const loadWechatQr = async () => {
  stopPoll()
  qrStatus.value = 'loading'
  errorMsg.value = ''

  try {
    const resp = await fetch('/api/auth/wechat/login')
    const { authUrl, state } = await resp.json()

    qrStatus.value = 'pending'
    await nextTick()
    if (qrCanvasRef.value) {
      await QRCode.toCanvas(qrCanvasRef.value, authUrl, { width: 240, margin: 2 })
    }

    pollTimer = setInterval(async () => {
      try {
        const r = await fetch(`/api/auth/wechat/status?state=${state}`)
        const data = await r.json()
        if (data.status === 'confirmed' && data.token) {
          stopPoll()
          showQrModal.value = false
          auth.token.value = data.token
          await auth.fetchUser()
          await navigateTo('/')
        } else if (data.status === 'expired') {
          stopPoll()
          qrStatus.value = 'expired'
        }
      } catch {
        /* ignore */
      }
    }, 1500)
  } catch (err: any) {
    errorMsg.value = err.message || '获取二维码失败'
    showQrModal.value = false
  }
}

const handleWechatLogin = async () => {
  showQrModal.value = true
  await loadWechatQr()
}

watch(showQrModal, (val) => {
  if (!val) stopPoll()
})

onUnmounted(stopPoll)
</script>

<style scoped>
/* ====== 页面 ====== */
.page-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: #f6fbf6;
  font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  box-sizing: border-box;
}

/* ====== 双栏卡片 ====== */
.auth-wrapper {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 700px;
  border-radius: 2rem;
  overflow: hidden;
  box-shadow:
    0 2px 16px rgba(0, 0, 0, 0.06),
    0 1px 4px rgba(0, 0, 0, 0.04);
}

/* ====== 左侧品牌面板 ====== */
.brand-panel {
  flex: 0 0 45%;
  display: flex;
  flex-direction: column;
  padding: 3rem 3rem 2rem;
  background: #effff9;
  position: relative;
  overflow: hidden;
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 2.5rem;
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(0, 108, 82, 0.1);
  color: #006c52;
  flex-shrink: 0;
}

.brand-name {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #006c52;
  letter-spacing: -0.01em;
}

.brand-content {
  flex: 1;
}

.brand-headline {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: #171d1a;
  margin: 0 0 1.1rem;
  letter-spacing: -0.02em;
}

.headline-accent {
  color: #006c52;
}

.brand-desc {
  font-size: 0.9rem;
  color: #3e4944;
  line-height: 1.75;
  margin: 0;
  max-width: 320px;
}

.brand-illustration {
  margin-top: 2rem;
  border-radius: 16px;
  overflow: hidden;
}

.landscape-svg {
  display: block;
  width: 100%;
  height: auto;
}

.brand-copyright {
  margin-top: 1.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #6e7a74;
  text-transform: uppercase;
  margin-bottom: 0;
}

/* ====== 右侧表单面板 ====== */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: #ffffff;
  overflow-y: auto;
}

.form-inner {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-title {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: #171d1a;
  margin: 0;
  letter-spacing: -0.02em;
}

.form-subtitle {
  font-size: 0.875rem;
  color: #3e4944;
  margin: 0;
}

/* ====== Tabs ====== */
.tabs {
  position: relative;
  display: flex;
  border-bottom: 1px solid rgba(189, 201, 194, 0.4);
}

.tab {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: 0.6rem 0;
  border: none;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6e7a74;
  cursor: pointer;
  transition: color 0.2s;
}

.tab.active {
  color: #006c52;
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 50%;
  height: 2px;
  background: #006c52;
  border-radius: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ====== 表单 ====== */
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #3e4944;
}

.forgot-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #006c52;
  cursor: pointer;
}

.forgot-link:hover {
  text-decoration: underline;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(62, 73, 68, 0.5);
  pointer-events: none;
  transition: color 0.2s;
}

.input-wrapper:focus-within .input-icon {
  color: #006c52;
}

.input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  border: 1px solid #bdc9c2;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: inherit;
  background: transparent;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
  color: #171d1a;
}

.input.input-has-toggle {
  padding-right: 2.75rem;
}

.input::placeholder {
  color: rgba(62, 73, 68, 0.45);
}

.input:focus {
  border-color: #006c52;
  box-shadow: 0 0 0 3px rgba(143, 246, 208, 0.35);
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: rgba(62, 73, 68, 0.5);
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: #006c52;
}

/* ====== 提交按钮 ====== */
.submit-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 9999px;
  background: #006c52;
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    filter 0.2s,
    transform 0.1s,
    box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 108, 82, 0.25);
}

.submit-btn:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 4px 14px rgba(0, 108, 82, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ====== 错误提示 ====== */
.error {
  color: #ba1a1a;
  font-size: 0.85rem;
  text-align: center;
  padding: 0.55rem 1rem;
  background: #ffdad6;
  border-radius: 8px;
  margin: 0;
}

/* ====== 第三方登录 ====== */
.third-party {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(189, 201, 194, 0.4);
}

.divider-text {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(110, 122, 116, 0.6);
  white-space: nowrap;
}

.wechat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border: 1px solid #bdc9c2;
  border-radius: 9999px;
  background: transparent;
  color: #171d1a;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s;
}

.wechat-btn svg {
  color: #07c160;
}

.wechat-btn:hover {
  background: #f0f5f0;
}

.wechat-btn:active {
  transform: scale(0.97);
}

/* ====== 动画 ====== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ====== 加载状态 ====== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 100vh;
  width: 100%;
  color: #6e7a74;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #bdc9c2;
  border-top-color: #006c52;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ====== 微信扫码弹窗 ====== */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 1rem;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #6e7a74;
  font-size: 0.875rem;
  padding: 2rem 0;
}

.qr-canvas {
  border: 1px solid #bdc9c2;
  border-radius: 12px;
}

.qr-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #3e4944;
  margin: 0;
}

.qr-error {
  color: #ba1a1a;
}

.qr-spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 3px solid #bdc9c2;
  border-top-color: #006c52;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.qr-spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #bdc9c2;
  border-top-color: #006c52;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.refresh-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #006c52;
  border-radius: 9999px;
  background: transparent;
  color: #006c52;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #006c52;
  color: white;
}

/* ====== 响应式 ====== */
@media (max-width: 768px) {
  .page-bg {
    padding: 1rem;
    align-items: flex-start;
  }
  .auth-wrapper {
    border-radius: 1.25rem;
    min-height: auto;
  }
  .brand-panel {
    display: none;
  }
  .form-panel {
    padding: 2.5rem 1.5rem;
    align-items: flex-start;
    padding-top: 3rem;
  }
  .form-inner {
    max-width: 100%;
  }
}
</style>
