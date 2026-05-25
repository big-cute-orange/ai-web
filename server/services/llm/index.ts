// server/services/llm/index.ts
// 工厂函数：根据 provider 名字，创建并返回对应的 Provider 实例

import type { ProviderName } from './types'
import { DeepSeekProvider } from './providers/deepseek'
import { QwenProvider } from './providers/qwen'

// 把 types.ts 里的所有导出透传出去
// 这样其他文件只需要 import { getLLMProvider, LLMMessage } from '~~/server/services/llm'
// 而不需要分别从 types.ts 和 index.ts 导入
export * from './types'

/**
 * 获取 LLM Provider 实例
 * @param name - 'deepseek' 或 'qwen'，不传默认用 deepseek
 *
 * 为什么用工厂函数而不是直接 new？
 * 因为 Provider 需要从 useRuntimeConfig() 读取 API Key，
 * 而 useRuntimeConfig() 只能在服务端请求上下文里调用，
 * 不能在模块加载时（顶层）调用，所以必须在函数里懒加载。
 */
export function getLLMProvider(name: ProviderName = 'deepseek') {
  // useRuntimeConfig() 是 Nuxt/Nitro 的内置函数，读取 nuxt.config.ts runtimeConfig
  const config = useRuntimeConfig()

  if (name === 'qwen') {
    return new QwenProvider({
      qwenApiKey: config.qwenApiKey as string,
      qwenBaseUrl: config.qwenBaseUrl as string,
    })
  }

  // 默认 deepseek
  return new DeepSeekProvider({
    deepseekApiKey: config.deepseekApiKey as string,
    deepseekBaseUrl: config.deepseekBaseUrl as string,
  })
}
