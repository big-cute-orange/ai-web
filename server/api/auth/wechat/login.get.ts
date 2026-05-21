import { getWechatAuthUrl } from '~~/server/utils/wechat'

/**
 * GET /api/auth/wechat/login
 *
 * 生成微信 OAuth 授权 URL 并 302 重定向，用户浏览器会跳转到微信二维码页面。
 *
 * 流程：
 * 1. 生成随机 state（防 CSRF）
 * 2. state 存入 httpOnly cookie（5 分钟有效）
 * 3. 拼接微信授权 URL 并返回 302 重定向
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // 生成随机 state 防 CSRF
  const state = crypto.randomUUID()

  // state 存入 cookie，回调时校验（httpOnly + 5 分钟过期）
  setCookie(event, 'wechat_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 5, // 5 分钟
    path: '/',
  })

  // 构建回调地址（http://your-domain/api/auth/wechat/callback）
  const host = getRequestHost(event)
  const protocol = getRequestProtocol(event)
  const redirectUri = `${protocol}://${host}/api/auth/wechat/callback`

  // 重定向到微信授权页
  const authUrl = getWechatAuthUrl(redirectUri, state)

  return sendRedirect(event, authUrl)
})
