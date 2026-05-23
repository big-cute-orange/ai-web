// 在服务器启动时自动检查并创建数据库表

import { db } from '../db/client'
import { sql } from 'drizzle-orm'

export default defineNitroPlugin(async () => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL DEFAULT '',
      login_type TEXT NOT NULL DEFAULT 'password',
      wechat_openid TEXT UNIQUE,
      wechat_unionid TEXT,
      nickname TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS wechat_login_sessions (
      state TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      token TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  console.log('[DB] 数据库表已就绪')
})
