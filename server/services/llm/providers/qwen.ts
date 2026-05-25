// server/services/llm/providers/qwen.ts
// 通义千问（阿里云 DashScope）
// DashScope 提供了 OpenAI 兼容模式，接口格式和 DeepSeek 完全一样
// 只有 Base URL、API Key 来源和默认模型名不同

import type { ILLMProvider, LLMMessage, LLMOptions } from '../types'

export class QwenProvider implements ILLMProvider {
  readonly name = 'qwen' as const
  // qwen-plus 是通义千问的均衡版，性价比高；qwen-max 效果更好但更贵
  readonly defaultModel = 'qwen-plus'

  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(config: { qwenApiKey: string; qwenBaseUrl: string }) {
    this.apiKey = config.qwenApiKey
    // 如果没配置 qwenBaseUrl，使用 DashScope 兼容模式的默认地址
    this.baseUrl = config.qwenBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  }

  async stream(messages: LLMMessage[], options: LLMOptions = {}): Promise<Response> {
    return this._fetch(messages, { ...options, stream: true })
  }

  async complete(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
    const res = await this._fetch(messages, { ...options, stream: false })
    const data = (await res.json()) as { choices: { message: { content: string } }[] }
    return data.choices[0]?.message?.content ?? ''
  }

  private _fetch(messages: LLMMessage[], opts: LLMOptions & { stream: boolean }) {
    if (!this.apiKey) {
      throw createError({ statusCode: 500, statusMessage: '通义千问 API Key 未配置，请检查 .env' })
    }

    return fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        messages,
        stream: opts.stream,
        ...(opts.temperature !== undefined && { temperature: opts.temperature }),
        ...(opts.maxTokens !== undefined && { max_tokens: opts.maxTokens }),
        ...(opts.jsonMode && { response_format: { type: 'json_object' } }),
      }),
    })
  }
}
