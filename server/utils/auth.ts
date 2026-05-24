import type { H3Event } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'

interface AuthUser {
  userId: number
}

/**
 * 从请求中验证登录状态，返回当前用户信息
 * 未登录或 Token 无效时自动抛出 401 错误
 *
 * @param event - H3 事件对象
 * @returns 包含 userId 的 payload
 *
 * 用法：
 *   const user = await requireAuth(event)
 *   console.log(user.userId) // 当前登录用户的 ID
 */
export const requireAuth = async (event: H3Event): Promise<AuthUser> => {
  const authHeader = getHeader(event, 'Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }
  const token = authHeader.slice(7)
  const payload = await verifyToken(token)
  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Token 无效或已过期，请重新登录',
    })
  }
  return payload as AuthUser
}
