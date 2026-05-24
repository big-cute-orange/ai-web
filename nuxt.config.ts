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
  // 项目里用到了 qrcode / markdown-it / highlight.js 等这类第三方包
  // Vite 开发时每次热更，会重新解析它们，导致页面偶尔闪一下 / 重新加载
  // 把它们放进 nuxt.config.ts 里提前打包好，开发环境会更丝滑、不闪屏
  vite: {
    optimizeDeps: {
      include: ['highlight.js', 'markdown-it', 'qrcode'],
    },
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
  },
})
