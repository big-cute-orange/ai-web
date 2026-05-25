// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15', // Nuxt 版本兼容性，确保在未来的 Nuxt 版本中仍然保持当前行为
  devtools: { enabled: true }, // 开发工具，生产环境会自动禁用
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt'], // 使用 Nuxt UI 组件库 // eslint 模块在开发时提供代码质量检查
  css: ['~/assets/css/main.css'], // 全局引入 Tailwind CSS
  runtimeConfig: {
    // LLM 提供商配置
    deepseekApiKey: '',
    deepseekBaseUrl: '',
    qwenApiKey: '',
    qwenBaseUrl: '',
    // JWT 密钥，用于生成和验证登录状态的 JWT，生产环境请设置为一个随机且足够复杂的字符串
    jwtSecret: '',
    // 微信扫码登录相关配置
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
      wasm: true, // 启用 WebAssembly 支持，方便未来集成基于 WASM 的 LLM 模型
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
      allowedHosts: ['.trycloudflare.com'], // 允许来自 trycloudflare.com 的请求，方便远程调试
    },
  },
})
