// shared/types/index.ts

// ProviderName 是一个联合字符串类型，约束 provider 只能是这两个值之一
// 好处：TypeScript 会在写错 provider 名字时直接报错
export type ProviderName = 'deepseek' | 'qwen'

// 用户信息（登录后返回给前端的结构）
export interface User {
  id: number
  username: string
  nickname?: string | null
  avatarUrl?: string | null
  loginType?: string
  createdAt: string
}

// LLM 消息格式，与 OpenAI API 保持一致
export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// JWT payload 里存的内容
export interface JwtPayload {
  userId: number
}

// ─── 对话持久化相关类型 ─────────────────────────────────────

// 对话会话（对应 conversations 表一行）
export interface Conversation {
  id: number
  userId: number
  title: string
  provider: ProviderName
  model: string
  createdAt: string
  updatedAt: string
}

// 单条消息记录（对应 messages 表一行）
export interface ConversationMessage {
  id: number
  conversationId: number
  role: 'system' | 'user' | 'assistant'
  content: string
  createdAt: string
}

// ─── 行程相关类型 ──────────────────────────────────────────

// 行程中的单个活动（景点/餐厅/交通等）
export interface ItineraryActivity {
  time: string // 活动开始时间，格式 "09:00"
  type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'shopping' | 'other'
  name: string // 名称，例如"故宫博物院"
  description: string // 简介（50字以内）
  location: string // 地址或区域，例如"北京市东城区景山前街4号"
  duration: string // 建议游览时长，例如"3小时"
  estimatedCost?: string // 人均费用估算，例如"¥60/人"，可选
  tips?: string // 实用贴士，可选
}

// 行程的某一天
export interface ItineraryDay {
  day: number // 第几天，从 1 开始
  date: string // 日期 "YYYY-MM-DD"，如未指定出发日期则为空字符串
  theme: string // 当天主题，例如"历史人文探索"
  activities: ItineraryActivity[]
}

// AI 返回的行程 JSON 的完整结构
// 这个结构体同时也是给 AI 的 System Prompt 里描述的 JSON schema
export interface ItineraryData {
  destination: string
  totalDays: number
  summary: string // 行程总体介绍，100字以内
  days: ItineraryDay[]
  tips: string[] // 出行注意事项
  estimatedBudget?: {
    min: number // 最低预算（人民币元/人）
    max: number // 最高预算
    currency: string // 固定为 "CNY"
  }
}

// itineraries 表一行的完整结构（含 DB id）
export interface Itinerary {
  id: number
  userId: number
  conversationId?: number | null
  destination: string
  totalDays: number
  structuredData: ItineraryData // 即上面的 ItineraryData
  createdAt: string
}
