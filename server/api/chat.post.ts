// server/api/chat.post.ts

import { eq } from 'drizzle-orm'
// 引入 LLM 抽象层
import { getLLMProvider } from '~~/server/services/llm'
import type { ProviderName, LLMMessage } from '~~/server/services/llm'
// 引入 DB 表定义（Drizzle 需要用表对象来构造 SQL）
import { conversations, messages as messagesTable } from '~~/server/db/schema'
import { useDb } from '~~/server/db'

// ─────────────────────────────────────────────────────────────
// 系统提示词：定义 AI 的角色和能力范围
// 放在这里而不是前端传过来，是因为系统提示是"后端配置"，不应该被用户篡改
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `你是一位专业的 AI 旅行助手，擅长为用户规划中国及亚洲的旅行行程。
你可以：
- 推荐目的地、景点、美食、住宿
- 根据天数和偏好生成详细行程
- 提供签证、交通、季节等实用建议
- 估算旅行预算

用中文回复，语气友好专业。如果用户想要生成完整结构化行程，告知他们可以使用行程生成功能。`

export default defineEventHandler(async (event) => {
  // requireAuth 是 server/utils/auth.ts 里的函数，验证 JWT，返回 { userId }
  // 未登录会自动抛出 401 错误，不需要手动判断
  const user = await requireAuth(event)

  // useDb() 是 server/db/index.ts 里的函数，返回 Drizzle 实例
  const db = useDb()

  // 从请求体读取参数
  const body = (await readBody(event)) as {
    messages: LLMMessage[] // 完整的对话历史（含用户最新消息）
    conversationId?: number // 如果是继续已有对话，前端传这个
    provider?: ProviderName // 前端选择的 AI 厂商
  }

  const { messages, provider = 'deepseek' } = body
  let { conversationId } = body // let 而不是 const，因为下面可能会赋新值

  if (!messages?.length) {
    throw createError({ statusCode: 400, statusMessage: '消息不能为空' })
  }

  // 根据 provider 名字获取对应的 LLM 实例
  const llm = getLLMProvider(provider)

  // ── 1. 获取或创建会话 ──────────────────────────────────────

  if (!conversationId) {
    // 没有传 conversationId，说明这是一个新对话，需要创建记录

    // 找到第一条用户消息，截取前 30 字作为标题
    const firstUserMsg = messages.find((m) => m.role === 'user')?.content ?? '新对话'
    const title = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? '...' : '')

    // Drizzle 的 insert 语法：.values() 传入对象，.returning() 返回插入后的完整行
    const [conv] = await db
      .insert(conversations)
      .values({
        userId: user.userId,
        title,
        provider,
        model: llm.defaultModel,
      })
      .returning()

    // 把新创建的 conversationId 赋值，后面保存消息时用
    conversationId = conv!.id // 非空断言
  }

  // ── 2. 保存用户消息到 DB ──────────────────────────────────

  // 从 messages 数组里找最后一条用户消息（即用户刚刚发的那条）
  // [...messages].reverse() 不影响原数组，找到后立即 .find() 返回第一个匹配
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  if (lastUserMsg) {
    await db.insert(messagesTable).values({
      conversationId,
      role: 'user',
      content: lastUserMsg.content,
    })
  }

  // ── 3. 调用 LLM（带系统提示） ──────────────────────────────

  // 把系统提示插到消息数组最前面
  // 注意：这里构造新数组，不修改前端传来的 messages（避免副作用）
  const fullMessages: LLMMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

  const llmResponse = await llm.stream(fullMessages)

  // 检查 LLM 是否返回了错误（比如 API Key 无效、余额不足）
  if (!llmResponse.ok || !llmResponse.body) {
    const errText = await llmResponse.text().catch(() => '')
    throw createError({
      statusCode: llmResponse.status,
      statusMessage: `LLM 请求失败: ${errText.slice(0, 200)}`, // 截断避免过长错误信息
    })
  }

  // ── 4. 设置 SSE 响应头 ────────────────────────────────────

  // 这些 header 告诉浏览器和中间代理：这是一个事件流，不要缓冲，保持连接
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform', // 禁止缓存和内容转换
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // 禁止 Nginx 缓冲（Vercel 会用到）
  })

  // ── 5. 构造元数据事件 ─────────────────────────────────────

  // SSE 格式：每个事件是 "data: <内容>\n\n"（两个换行表示事件结束）
  // 我们在流的最开头发一个特殊事件，让前端知道 conversationId
  // 前端收到 type==='meta' 的事件后存起来，后续请求带上，实现"续聊"
  const encoder = new TextEncoder() // 把字符串转成 Uint8Array（浏览器流格式）
  const metaEvent = encoder.encode(`data: ${JSON.stringify({ type: 'meta', conversationId })}\n\n`)

  // ── 6. TransformStream：边传流边收集 AI 回复 ────────────────

  // TransformStream 是 Web Stream API 的标准：可以在数据流过时对数据进行处理
  // 我们的用法：
  //   - transform(chunk)：每个数据块流过时，解析出 AI 的 delta 文本并累加
  //   - flush()：流完全结束时，把收集好的完整回复存到 DB
  //
  // 为什么不等流结束再发？因为用户要看到实时打字效果，不能等全部生成完再发
  // 为什么在 flush 里存 DB 而不是流之前？因为流之前不知道 AI 会回复什么内容

  let assistantContent = '' // 用来累积 AI 回复的文本
  const decoder = new TextDecoder() // 把 Uint8Array 转回字符串

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    // 每次收到一块数据时调用
    transform(chunk, controller) {
      // 把二进制块解码成字符串，{ stream: true } 表示这是流式解码（处理跨块的多字节字符）
      const text = decoder.decode(chunk, { stream: true })

      // SSE 数据格式：每行是 "data: {...}" 或空行
      // 多个事件之间用空行分隔，所以要按行处理
      for (const line of text.split('\n')) {
        if (!line.startsWith('data:')) continue // 跳过空行和非 data 行
        const data = line.slice(5).trim() // 去掉 "data:" 前缀
        if (!data || data === '[DONE]') continue // "[DONE]" 是 OpenAI 格式的结束信号

        try {
          const parsed = JSON.parse(data)
          // OpenAI 流式格式：每个 chunk 里，choices[0].delta.content 是新增的文字
          const delta: string | undefined = parsed.choices?.[0]?.delta?.content
          if (delta) {
            assistantContent += delta // 把新增文字追加到完整回复里
          }
        } catch {
          // JSON 解析失败（比如 "[DONE]" 附近的边界数据），直接跳过
        }
      }

      // controller.enqueue 把数据块原样放回流里，继续传给前端
      // 我们只是"偷看"了一下数据，没有修改它
      controller.enqueue(chunk)
    },

    // 流完全结束时（AI 生成完毕）调用
    flush() {
      // 异步保存 assistant 消息和更新 conversation 的 updatedAt
      // 注意：不能 await 这里，因为 flush 必须同步返回（或返回 void）
      // 用 .catch() 记录错误，避免静默失败
      if (assistantContent && conversationId) {
        const db = useDb()
        Promise.all([
          // 保存 AI 回复到 messages 表
          db.insert(messagesTable).values({
            conversationId,
            role: 'assistant',
            content: assistantContent,
          }),
          // 更新 conversations 表的 updatedAt，方便按"最近活跃"排序
          db
            .update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, conversationId!)),
        ]).catch((err) => console.error('[chat] 保存消息到 DB 失败:', err))
      }
    },
  })

  // ── 7. 拼接"元数据流"和"LLM 内容流" ─────────────────────

  // 最终发给前端的流结构：
  //   [meta事件] → [LLM的SSE数据流（经过TransformStream）]

  // // 先创建一个只发 metaEvent 的流
  // const metaStream = new ReadableStream({
  //   start(controller) {
  //     controller.enqueue(metaEvent) // 发出元数据
  //     controller.close() // 立即关闭（只有一个事件）
  //   },
  // })

  // // 把两个流串联成一个：先发完 metaStream，再发 LLM 流
  // const combined = new ReadableStream({
  //   async start(controller) {
  //     // 第一段：发元数据
  //     for await (const chunk of metaStream as AsyncIterable<Uint8Array>) {
  //       controller.enqueue(chunk)
  //     }
  //     // 第二段：把 LLM 响应 body 接入 TransformStream，然后读取
  //     // pipeThrough(transform) 的意思：数据先经过 transform 处理（偷看内容），再输出
  //     const reader = llmResponse.body!.pipeThrough(transform).getReader()
  //     while (true) {
  //       const { done, value } = await reader.read()
  //       if (done) break
  //       controller.enqueue(value)
  //     }
  //     controller.close()
  //   },
  // })
  const combined = new ReadableStream({
    async start(controller) {
      // 直接发 meta 事件，不需要单独建 metaStream
      controller.enqueue(metaEvent)
      // 再接 LLM 流
      const reader = llmResponse.body!.pipeThrough(transform).getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        controller.enqueue(value)
      }
      controller.close()
    },
  })
  // sendStream 是 H3（Nuxt 服务端框架）的函数，把 ReadableStream 作为响应体发送
  return sendStream(event, combined)
})
