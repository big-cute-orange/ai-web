import { db } from '~~/server/db/client'
import { users } from '~~/server/db/schema'
import { generateToken } from '~~/server/services/auth'
import {
  exchangeCodeForToken,
  getWechatUserInfo,
  generateWechatUsername,
} from '~~/server/services/wechat'
import { confirmSession, getSession } from '~~/server/services/wechat-session'
import { eq } from 'drizzle-orm'

/**
 * GET /api/auth/wechat/callback
 * 微信 OAuth 回调（由手机微信浏览器访问）
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const state = query.state as string | undefined

  if (!state) {
    throw createError({ statusCode: 400, message: '缺少 state 参数' })
  }

  const session = await getSession(state)
  if (session.status === 'expired') {
    throw createError({ statusCode: 403, message: '二维码已过期，请重新扫码' })
  }

  if (!code) {
    return new Response(
      '<html><body style="text-align:center;padding-top:40px;font-size:16px;color:#999;">你取消了授权</body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  const tokenData = await exchangeCodeForToken(code)
  const { access_token, openid, unionid } = tokenData

  const userInfo = await getWechatUserInfo(access_token, openid)

  let user: any = (await db.select().from(users).where(eq(users.wechatOpenid, openid)))[0]

  if (user) {
    await db
      .update(users)
      .set({
        nickname: userInfo.nickname,
        avatarUrl: userInfo.headimgurl,
        wechatUnionid: unionid || user.wechatUnionid,
      })
      .where(eq(users.id, user.id))
    user = (await db.select().from(users).where(eq(users.id, user.id)))[0]
  } else {
    const allUsernames = await db.select({ username: users.username }).from(users)
    const existingNames = new Set(allUsernames.map((u) => u.username))
    const username = generateWechatUsername(openid, existingNames)

    const [result] = await db
      .insert(users)
      .values({
        username,
        password: '',
        loginType: 'wechat',
        wechatOpenid: openid,
        wechatUnionid: unionid || null,
        nickname: userInfo.nickname,
        avatarUrl: userInfo.headimgurl,
      })
      .returning()
    user = result
  }

  const token = await generateToken(user.id)
  await confirmSession(state, token)

  return new Response(
    `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录成功</title>
  <style>
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh;
           margin: 0; font-family: system-ui, sans-serif; background: #f0fdf4; }
    .card { text-align: center; padding: 2rem; }
    .check { font-size: 64px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: #16a34a; margin-bottom: 8px; }
    .sub { font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">&#10004;</div>
    <div class="title">登录成功</div>
    <div class="sub">桌面端将自动登录，本页面可关闭</div>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
})
