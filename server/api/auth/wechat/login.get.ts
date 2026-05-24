import { getWechatAuthUrl } from '~~/server/services/wechat/oauth'
import { createPendingSession } from '~~/server/services/wechat/session'

/**
 * GET /api/auth/wechat/login
 * 前端点击"微信扫码登录"时调用，返回 OAuth URL 和 state
 */
export default defineEventHandler(async (event) => {
  const state = crypto.randomUUID()

  await createPendingSession(state)

  const config = useRuntimeConfig()
  const redirectUri =
    config.wechatRedirectUri ||
    (() => {
      const host = getRequestHost(event, { xForwardedHost: true })
      const protocol = getRequestProtocol(event, { xForwardedProto: true })
      return `${protocol}://${host}/api/auth/wechat/callback`
    })()

  console.log('[wechat] redirect_uri:', redirectUri)

  const authUrl = getWechatAuthUrl(redirectUri, state)

  return { authUrl, state }
})
