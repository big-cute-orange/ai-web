import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'

// 数据库文件路径
// const DB_PATH = './server/db/sqlite.db'

// 创建 SQLite 连接（单例模式，避免重复连接）
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:./server/db/sqlite.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// 创建 Drizzle 实例，绑定 schema 以获得类型推导
export const db = drizzle(client, { schema })

/**
 * 获取数据库实例（在服务端 API 中使用）
 * 放在 server/utils/ 目录下，Nitro 会自动注册
 */
export function useDb() {
  return db
}

// 不是导出两遍，是导出两种使用方式：
// 一种直接用，一种用函数包起来符合 Nuxt 规范，
// 它们指向同一个数据库连接
