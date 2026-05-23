// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    apiKey: '',
    aiBaseUrl: '',
    jwtSecret: '',
    wechatAppId: '',
    wechatAppSecret: '',
    wechatRedirectUri: '',
  },
  icon: {
    // 禁用 Google 图标 provider，避免国内网络环境下的请求失败
    provider: 'iconify',
  },
  fonts: {
    // 禁用所有 Google 相关 provider，避免国内网络环境下的请求失败
    providers: {
      google: false,
      googleicons: false,
    },
  },
  nitro: {
    experimental: {
      wasm: true,
    },
  },
  vite: {
    optimizeDeps: {
      include: ['highlight.js', 'markdown-it'],
    },
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
  },
})
