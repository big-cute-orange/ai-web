// server/services/llm/types.ts

import type { ProviderName } from '~~/shared/types'

// 重新导出，方便其他文件只从 services/llm 这一个路径 import
export type { ProviderName }

// LLM 消息格式，与 OpenAI API 保持一致
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 调用 LLM 时的可选参数
export interface LLMOptions {
  model?: string // 不传则使用 Provider 的 defaultModel
  temperature?: number // 0~2，越高越随机，行程生成建议 0.7，闲聊可以高一点
  maxTokens?: number // 限制输出长度，防止超长输出消耗 token
  jsonMode?: boolean // 传 true 时强制输出纯 JSON
}

// LLM Provider 统一接口
// 所有 Provider（DeepSeek、Qwen...）都必须实现这两个方法
export interface ILLMProvider {
  readonly name: ProviderName // Provider 名字，用于日志和前端显示
  readonly defaultModel: string // 不指定 model 时使用的默认模型

  // 流式调用：返回原始的 fetch Response 对象
  // 调用方可以直接拿 response.body 当 ReadableStream 使用
  // 用于聊天场景，边生成边显示给用户
  stream(messages: LLMMessage[], options?: LLMOptions): Promise<Response>

  // 非流式调用：等待 LLM 生成完毕，返回完整文本
  // 用于行程生成，需要拿到完整 JSON 才能解析
  complete(messages: LLMMessage[], options?: LLMOptions): Promise<string>
}
