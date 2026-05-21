import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'
import { verifyToken } from '~~/server/utils/auth'
import { eq } from 'drizzle-orm'

/**
 * 获取当前登录用户信息
 *
 * 请求头：
 * Authorization: Bearer <token>
 *
 * 成功返回：
 * {
 *   id: number,
 *   username: string,
 *   createdAt: string
 * }
 */
export default defineEventHandler(async (event) => {
  // 1. 从请求头中提取 Token
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: '未登录或 Token 无效',
    })
  }

  const token = authHeader.slice(7) // 去掉 "Bearer " 前缀

  // 2. 验证 Token
  const payload = await verifyToken(token)

  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Token 无效或已过期，请重新登录',
    })
  }

  // 3. 查找用户
  const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 4. 返回用户信息（不返回密码）
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname || user.username,
    avatarUrl: user.avatarUrl,
    loginType: user.loginType,
    createdAt: user.createdAt,
  }
})
