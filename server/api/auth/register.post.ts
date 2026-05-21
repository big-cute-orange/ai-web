import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'
import { hashPassword, generateToken } from '~~/server/utils/auth'
import { eq } from 'drizzle-orm'

/**
 * 注册接口
 *
 * 请求体：
 * {
 *   username: string  // 用户名，3-20 位字母数字下划线
 *   password: string  // 密码，6-50 位
 * }
 *
 * 成功返回：
 * {
 *   token: string,
 *   user: { id, username, createdAt }
 * }
 */
export default defineEventHandler(async (event) => {
  // 1. 读取请求体
  const body = await readBody(event)
  const { username, password } = body || {}

  // 2. 参数校验
  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: '用户名和密码不能为空',
    })
  }

  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 20) {
    throw createError({
      statusCode: 400,
      message: '用户名长度应为 3-20 个字符',
    })
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    throw createError({
      statusCode: 400,
      message: '用户名只能包含字母、数字和下划线',
    })
  }

  if (password.length < 6 || password.length > 50) {
    throw createError({
      statusCode: 400,
      message: '密码长度应为 6-50 个字符',
    })
  }

  // 3. 检查用户名是否已存在
  const existingUser = db.select().from(users).where(eq(users.username, username.trim())).get()

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: '用户名已被注册',
    })
  }

  // 4. 加密密码
  const hashedPassword = await hashPassword(password)

  // 5. 写入数据库
  const result = db
    .insert(users)
    .values({
      username: username.trim(),
      password: hashedPassword,
    })
    .returning()
    .get()

  // 6. 生成 JWT Token
  const token = await generateToken(result.id)

  // 7. 返回结果
  return {
    token,
    user: {
      id: result.id,
      username: result.username,
      createdAt: result.createdAt,
    },
  }
})
