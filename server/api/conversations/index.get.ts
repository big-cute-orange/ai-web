// server/api/conversations/index.get.ts
// GET /api/conversations
// 返回当前登录用户的所有对话列表（按最近活跃时间倒序）

import { eq, desc } from 'drizzle-orm'
import { conversations } from '~~/server/db/schema'
import { useDb } from '~~/server/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  const list = await db
    .select()
    .from(conversations)
    .where(
      eq(conversations.userId, user.userId), // 只查自己的对话，防止越权
    )
    .orderBy(desc(conversations.updatedAt)) // 最近有消息的排在前面
    .limit(50) // 最多返回 50 条，防止数据量过大

  return list
})
