// 在服务器启动时自动检查并创建数据库表

import { db } from '../utils/db'
import { users } from '../db/schema'

export default defineNitroPlugin(() => {
  // 使用 Drizzle 的同步建表逻辑
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)

  console.log('[DB] 数据库表已就绪')
})

// 每次服务器启动时，会自动检查 `users` 表是否存在，不存在则创建
// 这样你不需要手动执行任何 SQL
