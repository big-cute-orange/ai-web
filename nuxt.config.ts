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
  },
})
