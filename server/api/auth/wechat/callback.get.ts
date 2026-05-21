import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'
import { generateToken } from '~~/server/utils/auth'
import {
  exchangeCodeForToken,
  getWechatUserInfo,
  generateWechatUsername,
} from '~~/server/utils/wechat'
import { eq } from 'drizzle-orm'

/**
 * GET /api/auth/wechat/callback
 *
 * 微信 OAuth 回调接口。用户在微信扫码确认后，微信会带着 code 和 state 回调到这里。
 *
 * 流程：
 * 1. 校验 state（防 CSRF）
 * 2. 用 code 换 access_token + openid
 * 3. 获取微信用户信息（昵称、头像）
 * 4. 根据 openid 查找数据库：
 *    - 已存在 → 直接登录
 *    - 不存在 → 创建新用户（自动生成用户名 wx_xxxxxxxx）
 * 5. 签发 JWT，设置 auth_token cookie
 * 6. 302 重定向到 /chat
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const state = query.state as string | undefined

  // 1. 校验 state
  const savedState = getCookie(event, 'wechat_state')
  if (!state || state !== savedState) {
    throw createError({
      statusCode: 403,
      message: '非法请求：state 校验失败',
    })
  }

  // 校验完立即清除 state cookie
  deleteCookie(event, 'wechat_state')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: '缺少微信授权码',
    })
  }

  // 2. 用 code 换 access_token + openid
  const tokenData = await exchangeCodeForToken(code)
  const { access_token, openid, unionid } = tokenData

  // 3. 获取微信用户信息
  const userInfo = await getWechatUserInfo(access_token, openid)

  // 4. 查找是否已有该微信用户
  let user: any = await db.select().from(users).where(eq(users.wechatOpenid, openid)).get()

  if (user) {
    // 已有用户 → 更新昵称和头像（微信端可能变更）
    await db
      .update(users)
      .set({
        nickname: userInfo.nickname,
        avatarUrl: userInfo.headimgurl,
        wechatUnionid: unionid || user.wechatUnionid,
      })
      .where(eq(users.id, user.id))
      .run()

    // 重新查一次拿到最新数据
    user = await db.select().from(users).where(eq(users.id, user.id)).get()
  } else {
    // 新用户 → 自动注册
    // 生成唯一用户名
    const allUsernames = await db.select({ username: users.username }).from(users).all()
    const existingNames = new Set(allUsernames.map((u) => u.username))
    const username = generateWechatUsername(openid, existingNames)

    const result = await db
      .insert(users)
      .values({
        username,
        password: '', // 微信用户无密码
        loginType: 'wechat',
        wechatOpenid: openid,
        wechatUnionid: unionid || null,
        nickname: userInfo.nickname,
        avatarUrl: userInfo.headimgurl,
      })
      .returning()
      .get()

    user = result
  }

  // 5. 签发 JWT
  const token = await generateToken(user.id)

  // 6. 设置 auth_token cookie（30 天有效）
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  // 7. 重定向到聊天页
  return sendRedirect(event, '/chat')
})
