// server/services/llm/providers/deepseek.ts

import type { ILLMProvider, LLMMessage, LLMOptions } from '../types'

export class DeepSeekProvider implements ILLMProvider {
  readonly name = 'deepseek' as const
  readonly defaultModel = 'deepseek-chat' // DeepSeek 的通用对话模型

  // 私有属性，存 API 凭证
  private readonly apiKey: string
  private readonly baseUrl: string

  // 构造函数接收 nuxt runtimeConfig 里对应的字段
  constructor(config: { deepseekApiKey: string; deepseekBaseUrl: string }) {
    this.apiKey = config.deepseekApiKey
    this.baseUrl = config.deepseekBaseUrl
  }

  // 流式调用：直接返回 fetch 的 Response，body 就是 SSE 流
  async stream(messages: LLMMessage[], options: LLMOptions = {}): Promise<Response> {
    return this._fetch(messages, { ...options, stream: true })
  }

  // 非流式调用：等待完整响应，从 JSON 里取 content 文本
  async complete(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
    const res = await this._fetch(messages, { ...options, stream: false })
    //
    // 新增：先检查 HTTP 状态，不 ok 就打出原始错误
    // if (!res.ok) {
    //   const errText = await res.text().catch(() => '')
    //   console.error('[DeepSeek complete] API 返回错误：', res.status, errText)
    //   throw createError({
    //     statusCode: res.status,
    //     statusMessage: `DeepSeek 错误: ${errText.slice(0, 200)}`,
    //   })
    // }
    // OpenAI 兼容格式的响应结构：choices[0].message.content
    const data = (await res.json()) as { choices: { message: { content: string } }[] }

    //
    // 新增：choices 不存在时也打出来看看
    // if (!data.choices?.length) {
    //   console.error('[DeepSeek complete] 响应结构异常：', JSON.stringify(data).slice(0, 500))
    //   throw createError({ statusCode: 502, statusMessage: 'DeepSeek 响应结构异常' })
    // }

    return data.choices[0]?.message?.content ?? ''
  }

  // 私有方法：构造 fetch 请求，stream/non-stream 共用
  private _fetch(messages: LLMMessage[], opts: LLMOptions & { stream: boolean }) {
    // 在这里做校验，而不是等 fetch 失败，可以给用户更友好的错误提示
    if (!this.apiKey) {
      throw createError({ statusCode: 500, statusMessage: 'DeepSeek API Key 未配置，请检查 .env' })
    }
    if (!this.baseUrl) {
      throw createError({ statusCode: 500, statusMessage: 'DeepSeek Base URL 未配置，请检查 .env' })
    }

    return fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // DeepSeek 用标准 Bearer Token 鉴权
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        messages,
        stream: opts.stream,
        // 只在参数有值时才带上，避免传 undefined 给 API
        ...(opts.temperature !== undefined && { temperature: opts.temperature }),
        ...(opts.maxTokens !== undefined && { max_tokens: opts.maxTokens }),
        ...(opts.jsonMode && { response_format: { type: 'json_object' } }),
      }),
    })
  }
}
