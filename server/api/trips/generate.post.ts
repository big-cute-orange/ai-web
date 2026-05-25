// server/api/trips/generate.post.ts
// POST /api/trips/generate
// 接收目的地和天数，调用 LLM 生成结构化行程，存入 DB 并返回

import { getLLMProvider } from '~~/server/services/llm'
import type { ProviderName, LLMMessage } from '~~/server/services/llm'
import { itineraries } from '~~/server/db/schema'
// import type { ItineraryData } from '~~/shared/types'
import { useDb } from '~~/server/db'

// ─────────────────────────────────────────────────────────────
// 行程生成的系统提示词
// 核心策略：让 AI 直接输出 JSON，而不是解释性文字
// JSON Schema 写在提示词里，AI 会严格按照这个格式输出
// ─────────────────────────────────────────────────────────────
const ITINERARY_SYSTEM_PROMPT = `你是专业旅行规划师，专门为用户生成结构化旅行行程。
请严格按照以下 JSON 格式返回，不要添加任何说明文字、不要加 markdown 代码块标记，直接输出纯 JSON。

JSON 格式如下（严格遵守字段名和类型）：
{
  "destination": "目的地名称",
  "totalDays": 天数（数字）,
  "summary": "行程总体介绍，100字以内",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD，如无出发日期则填空字符串",
      "theme": "当天主题，例如：历史人文探索",
      "activities": [
        {
          "time": "09:00",
          "type": "attraction（景点）| restaurant（餐厅）| hotel（住宿）| transport（交通）| shopping（购物）| other（其他）",
          "name": "景点或活动名称",
          "description": "简介，50字以内",
          "location": "详细地址或所在区域",
          "duration": "建议游览时长，例如：2小时",
          "estimatedCost": "人均费用估算，例如：¥60/人（可选，不确定可不填）",
          "tips": "实用贴士（可选）"
        }
      ]
    }
  ],
  "tips": ["出行注意事项1", "注意事项2"],
  "estimatedBudget": {
    "min": 最低预算数字（人民币/人）,
    "max": 最高预算数字（人民币/人）,
    "currency": "CNY"
  }
}`

// ─────────────────────────────────────────────────────────────
// 兜底 JSON 提取函数
// 有些 AI 模型（尤其是通义千问）会在 JSON 外面包一层 ```json ... ```
// 这个函数负责把代码块标记剥掉，只保留 JSON 内容
// ─────────────────────────────────────────────────────────────
function extractJson(text: string): string {
  // 用正则匹配 ```json ... ``` 或 ``` ... ``` 格式
  // [\s\S]*? 表示任意字符（包括换行），? 是非贪婪匹配
  const match: any = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return match[1].trim() // 返回代码块内的内容

  // 如果没有代码块，直接返回原文（trim 掉首尾空白）
  return text.trim()
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  const body = (await readBody(event)) as {
    destination: string // 目的地，例如"北京"或"日本东京"
    days: number // 行程天数
    startDate?: string // 出发日期（可选），格式 "YYYY-MM-DD"
    preferences?: string[] // 旅行偏好（可选），例如 ["美食", "历史文化", "亲子友好"]
    provider?: ProviderName // 使用哪家 AI（可选，默认 deepseek）
    conversationId?: number // 如果是在某次对话里触发的，传入对话 ID（可选）
  }

  const {
    destination,
    days,
    startDate,
    preferences = [],
    provider = 'deepseek',
    conversationId,
  } = body

  // 参数校验
  if (!destination) {
    throw createError({ statusCode: 400, statusMessage: '请提供目的地' })
  }
  if (!days || days < 1 || days > 30) {
    throw createError({ statusCode: 400, statusMessage: '行程天数需在 1-30 之间' })
  }

  const llm = getLLMProvider(provider)

  // ── 构造用户提示词 ─────────────────────────────────────────
  // 把用户的输入拼成自然语言，让 AI 理解需求
  let userPrompt = `请为我生成一份 ${destination} ${days} 天的详细旅行行程。`
  if (startDate) userPrompt += `出发日期：${startDate}。`
  if (preferences.length > 0) {
    userPrompt += `旅行偏好：${preferences.join('、')}。`
  }
  userPrompt += '请确保每天行程紧凑合理，包含景点游览、餐饮推荐和住宿建议，并考虑景点间的交通时间。'

  const msgs: LLMMessage[] = [
    { role: 'system', content: ITINERARY_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]

  // ── 调用 LLM（非流式） ────────────────────────────────────
  // 行程生成需要完整的 JSON，不能流式，等 AI 全部输出完再处理
  const raw = await llm.complete(msgs, {
    maxTokens: 4000, // 行程 JSON 比较长，给足够的 token
    temperature: 0.7, // 适度随机性，让每次生成的行程不完全一样
    jsonMode: true, // 告诉 Provider 强制输出纯 JSON（如果支持这个选项）
  })

  // ── 解析 JSON ────────────────────────────────────────────
  let structuredData: ItineraryData
  try {
    structuredData = JSON.parse(extractJson(raw))
  } catch {
    // 如果解析失败，打印原始输出方便排查，然后返回用户友好的错误
    console.error('[trips/generate] JSON 解析失败。AI 原始输出（前500字）：', raw.slice(0, 500))
    throw createError({
      statusCode: 502,
      statusMessage: 'AI 返回格式异常，请稍后重试或换一个 Provider',
    })
  }

  // ── 存入 DB ──────────────────────────────────────────────
  // .returning() 返回插入后的完整行（包含自增的 id 和自动填充的 createdAt）
  const [itinerary] = await db
    .insert(itineraries)
    .values({
      userId: user.userId,
      conversationId: conversationId ?? null, // null 表示不关联任何对话
      destination,
      totalDays: days,
      structuredData, // Drizzle 会自动把对象序列化为 jsonb 存入 DB
    })
    .returning()

  // 返回完整的行程记录（前端可以直接用）
  return itinerary
})
