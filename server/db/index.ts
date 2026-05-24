import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// 创建 PostgreSQL 连接
// prepare: false 是 Supabase PgBouncer 的必要配置，不加会导致认证失败
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

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
