import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'

// 数据库文件路径
const DB_PATH = './server/db/sqlite.db'

// 创建 SQLite 连接（单例模式，避免重复连接）
const sqlite = new Database(DB_PATH)

// 开启 WAL 模式，提升并发读写性能
sqlite.pragma('journal_mode = WAL')

// 启用外键约束
sqlite.pragma('foreign_keys = ON')

// 创建 Drizzle 实例，绑定 schema 以获得类型推导
export const db = drizzle(sqlite, { schema })

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
