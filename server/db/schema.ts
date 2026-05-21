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
  // 用户名，不可为空，不可重复，微信用户自动生成 wx_xxxxxxxx
  username: text('username').notNull().unique(),
  // 密码哈希（微信用户存空字符串 ''）
  password: text('password')
    .notNull()
    .$default(() => ''),
  // 登录方式，'password' 或 'wechat'（微信登录）
  loginType: text('login_type')
    .notNull()
    .$default(() => 'password'),
  // 微信 openid
  wechatOpenid: text('wechat_openid').unique(),
  // 微信 unionid
  wechatUnionid: text('wechat_unionid'),
  // 显示昵称（密码用户默认等于 username，微信用户为微信昵称）
  nickname: text('nickname'),
  // 头像 URL
  avatarUrl: text('avatar_url'),
  // 创建时间，默认当前时间
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})
