<template>
  <div class="page-bg">
    <!-- 主内容：左侧品牌 + 右侧登录卡片 -->
    <div v-if="!auth.currentUser.value && !auth.isLoading.value" class="main-content">
      <!-- 品牌区（左侧） -->
      <div class="brand-header">
        <div class="brand-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
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
        <h1 class="brand-name">AI 旅行助手</h1>
        <p class="brand-tagline">你的智能旅行伙伴</p>
      </div>

      <!-- 登录/注册卡片（右侧） -->
      <div class="auth-card">
        <!-- 下划线式 Tab -->
        <div class="tabs">
          <button
            type="button"
            :class="['tab', { active: activeTab === 'login' }]"
            @click="activeTab = 'login'"
          >
            登录
          </button>
          <button
            type="button"
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
                :placeholder="activeTab === 'login' ? '请输入用户名' : '请输入用户名（3-20位）'"
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
                type="password"
                class="input"
                :placeholder="activeTab === 'login' ? '请输入密码' : '请设置密码（6-50位）'"
                required
                minlength="6"
                maxlength="50"
                :autocomplete="activeTab === 'login' ? 'current-password' : 'new-password'"
              />
            </div>
          </div>

          <Transition name="fade">
            <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          </Transition>

          <button type="submit" :disabled="submitting" class="submit-btn">
            <span v-if="submitting" class="btn-spinner" />
            <span>{{ activeTab === 'login' ? '登录' : '注册' }}</span>
          </button>
        </form>

        <!-- 分割线 -->
        <div class="divider">
          <span class="divider-text">其他登录方式</span>
        </div>

        <!-- 微信扫码卡片 -->
        <button type="button" class="wechat-card" @click="handleWechatLogin">
          <div class="phone-frame">
            <div class="phone-notch" />
            <div class="phone-screen">
              <svg
                class="qr-pattern"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path
                  d="M0 0h12v12H0zM4 4h4v4H4zM20 0h12v12H20zM24 4h4v4h-4zM0 20h12v12H0zM4 24h4v4H4zM14 0h2v2h-2zM18 0h2v2h-2zM14 4h2v4h-2zM14 10h6v2h-6zM20 14h2v2h-2zM24 14h4v2h-4zM30 14h2v2h-2zM14 14h4v2h-4zM16 16h2v2h-2zM14 18h2v2h-2zM18 20h2v2h-2zM22 18h2v4h-2zM26 20h6v2h-6zM14 22h4v2h-4zM18 24h2v2h-2zM20 26h2v2h-2zM24 24h2v2h-2zM26 26h2v2h-2zM28 24h4v2h-4zM30 28h2v2h-2zM14 28h2v4h-2zM18 28h4v2h-4zM18 30h2v2h-2zM22 30h2v2h-2zM24 28h2v4h-2zM28 30h2v2h-2z"
                />
              </svg>
            </div>
          </div>
          <p class="wechat-text">
            <svg
              class="wechat-mini-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            使用<strong>微信</strong>扫码快速登录
          </p>
        </button>

        <p class="switch-hint">
          {{ activeTab === 'login' ? '还没有账号？' : '已有账号？' }}
          <button
            type="button"
            class="switch-link"
            @click="activeTab = activeTab === 'login' ? 'register' : 'login'"
          >
            {{ activeTab === 'login' ? '立即注册' : '去登录' }}
          </button>
        </p>
      </div>
    </div>

    <!-- 加载中 / 已登录跳转中 -->
    <div v-else class="loading-state">
      <div class="loading-spinner" />
      <p>加载中...</p>
    </div>

    <!-- 页脚 -->
    <footer v-if="!auth.currentUser.value && !auth.isLoading.value" class="page-footer">
      <a href="#" @click.prevent>服务条款</a>
      <span class="footer-sep">·</span>
      <a href="#" @click.prevent>隐私政策</a>
    </footer>

    <!-- ====== 微信扫码登录弹窗 ====== -->
    <UModal v-model:open="showQrModal" title="微信扫码登录" :ui="{ content: 'sm:max-w-md' }">
      <template #body>
        <div class="qr-container">
          <canvas ref="qrCanvasRef" class="qr-canvas" />
          <p v-if="qrStatus === 'pending'" class="qr-hint">
            <span class="qr-spinner" />
            请使用微信扫描二维码
          </p>
          <p v-else-if="qrStatus === 'expired'" class="qr-hint qr-error">
            二维码已过期，请刷新重试
          </p>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import QRCode from 'qrcode'

/**
 * 首页 — 登录 / 注册 / 聊天入口
 */

const auth = useAuth()

const activeTab = ref<'login' | 'register'>('login')

const form = reactive({
  username: '',
  password: '',
})

const submitting = ref(false)
const errorMsg = ref('')

// ========== 页面初始化：已登录则直接跳转 ==========
onMounted(async () => {
  await auth.fetchUser()
  if (auth.currentUser.value) {
    await navigateTo('/', { replace: true })
  }
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
    await navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.message || '操作失败，请重试'
    submitting.value = false
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
const qrStatus = ref<'pending' | 'expired' | 'scanning'>('pending')
let pollTimer: ReturnType<typeof setInterval> | null = null

const handleWechatLogin = async () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }

  try {
    const resp = await fetch('/api/auth/wechat/login')
    const { authUrl, state } = await resp.json()

    showQrModal.value = true
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
          clearInterval(pollTimer!)
          pollTimer = null
          showQrModal.value = false

          auth.token.value = data.token
          await auth.fetchUser()
          await navigateTo('/')
        } else if (data.status === 'expired') {
          clearInterval(pollTimer!)
          pollTimer = null
          qrStatus.value = 'expired'
        }
      } catch {
        //
      }
    }, 1500)
  } catch (err: any) {
    errorMsg.value = err.message || '获取二维码失败'
  }
}

watch(showQrModal, (val: boolean) => {
  if (!val && pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<style scoped>
.page-bg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  /* Aether Mint：从浅薄荷渐变到浅灰，柔和的背景 */
  background: linear-gradient(
    160deg,
    var(--color-mint-50) 0%,
    var(--color-stone-50) 50%,
    var(--color-mint-50) 100%
  );
  font-family: var(--font-sans);
}

/* ====== 主内容：左品牌 + 右卡片 ====== */
.main-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rem;
  flex-wrap: wrap;
  max-width: 960px;
  width: 100%;
}

/* ====== 品牌区（左侧） ====== */
.brand-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  max-width: 320px;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-mint-700), var(--color-mint-800));
  color: white;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25);
}

.brand-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-secondary);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.2;
}

.brand-tagline {
  margin-top: 0.6rem;
  font-size: 1rem;
  color: var(--color-stone-500);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .main-content {
    gap: 2rem;
  }
  .brand-header {
    align-items: center;
    text-align: center;
    max-width: 100%;
  }
  .brand-name {
    font-size: 1.6rem;
  }
  .brand-tagline {
    font-size: 0.9rem;
  }
}

/* ====== 主卡片 ====== */
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2rem 2rem 1.75rem;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--shadow-card);
}

/* ====== 下划线式 Tab ====== */
.tabs {
  position: relative;
  display: flex;
  margin-bottom: 1.75rem;
  border-bottom: 1px solid var(--color-stone-200);
}

.tab {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: 0.75rem 0;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-stone-400);
  cursor: pointer;
  transition: color 0.2s;
}

.tab.active {
  color: var(--color-mint-700);
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 50%;
  height: 2px;
  background: var(--color-mint-700);
  border-radius: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ====== 表单 ====== */
.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-secondary);
}

.forgot-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-mint-700);
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
  color: var(--color-stone-400);
  pointer-events: none;
  transition: color 0.2s;
}

.input-wrapper:focus-within .input-icon {
  color: var(--color-mint-700);
}

.input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.65rem;
  border: 1.5px solid transparent;
  border-radius: 10px;
  font-size: 0.95rem;
  background: var(--color-stone-50);
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  color: var(--color-secondary);
}

.input::placeholder {
  color: var(--color-stone-400);
}

.input:focus {
  background: #ffffff;
  border-color: var(--color-mint-700);
  box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.15);
}

.submit-btn {
  margin-top: 0.4rem;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: var(--color-mint-700);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s,
    box-shadow 0.2s;
  box-shadow: 0 2px 6px rgba(4, 120, 87, 0.25);
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-mint-800);
  box-shadow: 0 4px 10px rgba(4, 120, 87, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.submit-btn:disabled {
  opacity: 0.7;
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
  color: #dc2626;
  font-size: 0.85rem;
  text-align: center;
  padding: 0.55rem 1rem;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ====== 分割线 ====== */
.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem 0 1rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-stone-200);
}

.divider-text {
  font-size: 0.7rem;
  color: var(--color-stone-400);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ====== 微信扫码卡片 ====== */
.wechat-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--color-stone-200);
  border-radius: 12px;
  background: var(--color-stone-50);
  cursor: pointer;
  transition: all 0.2s;
}

.wechat-card:hover {
  border-color: var(--color-mint-300);
  background: var(--color-mint-50);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(4, 120, 87, 0.1);
}

.phone-frame {
  position: relative;
  width: 64px;
  height: 90px;
  border: 2px solid var(--color-stone-300);
  border-radius: 10px;
  background: var(--color-mint-100);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  box-sizing: border-box;
}

.phone-notch {
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 3px;
  border-radius: 2px;
  background: var(--color-stone-300);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-sizing: border-box;
}

.qr-pattern {
  width: 100%;
  height: 100%;
  color: var(--color-secondary);
}

.wechat-text {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-stone-600);
}

.wechat-text strong {
  color: var(--color-mint-700);
  font-weight: 600;
}

.wechat-mini-icon {
  color: var(--color-mint-700);
  flex-shrink: 0;
}

/* ====== 底部切换 ====== */
.switch-hint {
  text-align: center;
  margin-top: 1.25rem;
  margin-bottom: 0;
  font-size: 0.85rem;
  color: var(--color-stone-400);
}

.switch-link {
  background: none;
  border: none;
  color: var(--color-mint-700);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
}

.switch-link:hover {
  text-decoration: underline;
}

/* ====== 加载 ====== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-stone-500);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-stone-200);
  border-top-color: var(--color-mint-700);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ====== 页脚 ====== */
.page-footer {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: var(--color-stone-400);
}

.page-footer a {
  color: var(--color-stone-500);
  text-decoration: none;
  transition: color 0.15s;
}

.page-footer a:hover {
  color: var(--color-mint-700);
}

.footer-sep {
  color: var(--color-stone-300);
}

/* ====== 微信扫码弹窗 ====== */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
}

.qr-canvas {
  border: 1px solid var(--color-stone-200);
  border-radius: 12px;
}

.qr-hint {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--color-stone-500);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qr-error {
  color: #e53e3e;
}

.qr-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-stone-200);
  border-top-color: var(--color-mint-700);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>
