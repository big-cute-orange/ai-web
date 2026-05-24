import { eq, lt } from 'drizzle-orm'
import { db } from '~~/server/db'
import { wechatLoginSessions } from '~~/server/db/schema'

/**
 * 微信扫码登录会话管理（DB 版）
 * 替代原来的内存 Map，支持 Serverless 多实例环境
 * 手机端回调和桌面端轮询可能落在不同的函数实例上
 * 通过数据库共享状态保证两端都能读写同一条记录
 */

/** 创建一个 pending 状态的登录会话，有效期 5 分钟 */
export const createPendingSession = async (state: string): Promise<void> => {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  await db
    .insert(wechatLoginSessions)
    .values({ state, status: 'pending', expiresAt })
    // 同一 state 重复创建时直接覆盖（用户刷新二维码的场景）
    .onConflictDoUpdate({
      target: wechatLoginSessions.state,
      set: { status: 'pending', token: null, expiresAt },
    })
}

/** 手机端回调成功后，写入 JWT，状态改为 confirmed */
export const confirmSession = async (state: string, token: string): Promise<void> => {
  await db
    .update(wechatLoginSessions)
    .set({ status: 'confirmed', token })
    .where(eq(wechatLoginSessions.state, state))
}

/** 桌面端轮询时查询状态 */
export const getSession = async (
  state: string,
): Promise<{ status: 'pending' | 'confirmed' | 'expired'; token?: string }> => {
  const [session] = await db
    .select()
    .from(wechatLoginSessions)
    .where(eq(wechatLoginSessions.state, state))
    .limit(1)

  if (!session) return { status: 'expired' }
  if (session.expiresAt < new Date()) return { status: 'expired' }

  return {
    status: session.status as 'pending' | 'confirmed',
    token: session.token ?? undefined,
  }
}

/**
 * 清理过期会话（可在 Nitro 定时任务或每次登录时调用）
 * 避免 wechat_login_sessions 表无限增长
 */
export const cleanupExpiredSessions = async (): Promise<void> => {
  await db.delete(wechatLoginSessions).where(lt(wechatLoginSessions.expiresAt, new Date()))
}
