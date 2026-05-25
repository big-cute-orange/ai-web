/**
 * Nuxt UI 主题配置
 * primary 对应 app/assets/css/main.css @theme 里注册的 mint 色阶
 * neutral 用 Tailwind 内置 stone（偏暖灰，接近 Aether Mint 设计系统的 Neutral #737875）
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'mint',
      neutral: 'stone',
    },
  },
})
