import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import { verifyPassword, generateToken } from '~~/server/services/auth'
import { eq } from 'drizzle-orm'

/**
 * 登录接口
 *
 * 请求体：
 * {
 *   username: string,
 *   password: string
 * }
 *
 * 成功返回：
 * {
 *   token: string,
 *   user: { id, username, createdAt }
 * }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body || {}

  // 1. 参数校验
  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: '用户名和密码不能为空',
    })
  }

  // 2. 查找用户
  const [user] = await db.select().from(users).where(eq(users.username, username))

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误',
    })
  }

  // 微信注册的用户不能通过密码登录
  if (user.loginType === 'wechat') {
    throw createError({
      statusCode: 401,
      message: '该账号为微信注册，请使用微信扫码登录',
    })
  }

  // 3. 验证密码
  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误',
    })
  }

  // 4. 生成 Token
  const token = await generateToken(user.id)

  // 5. 返回结果（不返回密码）
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    },
  }
})
