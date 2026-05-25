// server/api/conversations/[id].get.ts
// GET /api/conversations/:id
// 返回某个对话的详情 + 所有消息，用于"恢复对话历史"

import { eq, asc, and } from 'drizzle-orm'
import { conversations, messages } from '~~/server/db/schema'
import { useDb } from '~~/server/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  // getRouterParam 从 URL 路径里取 [id] 参数
  // 比如 GET /api/conversations/42，这里取到的是字符串 "42"
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '无效的会话 ID' })
  }

  // 查询会话，同时验证归属权（userId 必须是当前用户）
  // and() 是 Drizzle 的 WHERE ... AND ... 语法
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, user.userId), // 防止用户 A 查看用户 B 的对话
      ),
    )

  // 如果查不到（不存在或不属于当前用户），返回 404
  if (!conv) {
    throw createError({ statusCode: 404, statusMessage: '会话不存在' })
  }

  // 查询该对话的所有消息，按时间正序（从早到晚）
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt)) // 正序，对应聊天界面从上到下的顺序

  // 返回会话元数据 + 消息列表
  return { conversation: conv, messages: msgs }
})
