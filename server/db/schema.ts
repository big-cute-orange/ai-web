import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 从 Drizzle 里拿工具：
// sqliteTable：建表
// text：字符串类型
// integer：数字类型

/**
 * 用户表
 * 存储所有注册用户的信息
 */
export const users = sqliteTable('users', {
  // 主键，自增数字
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 用户名，不可为空，不可重复
  username: text('username').notNull().unique(),
  // 密码哈希（明文密码绝不入库）
  password: text('password').notNull(),
  // 创建时间，默认当前时间
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
