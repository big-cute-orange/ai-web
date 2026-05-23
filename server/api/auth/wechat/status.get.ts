import { getSession } from '~~/server/services/wechat-session'

/**
 * GET /api/auth/wechat/status?state=xxx
 * 桌面端轮询扫码状态，每 1~2 秒请求一次
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const state = query.state as string | undefined

  if (!state) {
    throw createError({ statusCode: 400, message: '缺少 state 参数' })
  }

  return getSession(state)
})
