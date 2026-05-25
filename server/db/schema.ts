import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
  real,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// 从 Drizzle 里拿工具：
// pgTable：建表
// text：字符串类型
// serial：自增数字类型
// timestamp：时间戳类型

/**
 * 用户表
 * 存储所有注册用户的信息
 */
export const users = pgTable('users', {
  // 主键，自增数字
  id: serial('id').primaryKey(),
  // 用户名，不可为空，不可重复，微信用户自动生成 wx_xxxxxxxx
  username: text('username').notNull().unique(),
  // 密码哈希（微信用户存空字符串 ''）
  password: text('password').notNull().default(''),
  // 登录方式，'password' 或 'wechat'（微信登录）
  loginType: text('login_type').notNull().default('password'),
  // 微信 openid
  wechatOpenid: text('wechat_openid').unique(),
  // 微信 unionid
  wechatUnionid: text('wechat_unionid'),
  // 显示昵称（密码用户默认等于 username，微信用户为微信昵称）
  nickname: text('nickname'),
  // 头像 URL
  avatarUrl: text('avatar_url'),
  // 创建时间，默认当前时间
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
})

/**
 * 微信扫码登录临时会话表
 * 替代内存 Map，支持多实例 / Serverless 环境
 * 每条记录对应一次扫码登录流程，5 分钟后过期
 */
export const wechatLoginSessions = pgTable('wechat_login_sessions', {
  // 登录流程唯一标识，前端用于轮询
  state: text('state').primaryKey(),
  // 状态：pending（待扫码）| confirmed（已确认）
  status: text('status').notNull().default('pending'),
  // 登录成功后存入的 JWT，供前端轮询时取走
  token: text('token'),
  // 过期时间
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  // 创建时间
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
})

/** 对话会话表 */
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull().default('新对话'),
  provider: text('provider').notNull().default('deepseek'), // 'deepseek' | 'qwen'
  model: text('model').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
})

/** 消息记录表（归属于某个对话） */
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
})

/** 结构化行程表 */
export const itineraries = pgTable('itineraries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  conversationId: integer('conversation_id'), // 可选关联
  destination: text('destination').notNull(),
  totalDays: integer('total_days').notNull(),
  structuredData: jsonb('structured_data').notNull(), // ItineraryData JSON
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
})

/**
 * 用户偏好表
 * 存储从对话中自动提取或用户手动添加的旅行偏好，下次生成行程时注入 Prompt
 * 同一用户的同一 key 只保留最新值（依赖 UNIQUE 索引做 upsert）
 */
export const userPreferences = pgTable(
  'user_preferences',
  {
    // 主键，自增数字
    id: serial('id').primaryKey(),
    // 关联 users.id（应用层维护一致性，不加外键约束，与现有表风格一致）
    userId: integer('user_id').notNull(),
    // 偏好类型，候选值：
    //   'diet'      → 饮食（如 素食 / 清真 / 无辣）
    //   'style'     → 出行风格（如 小众景点 / 网红打卡 / 深度文化）
    //   'budget'    → 预算档位（如 低 / 中 / 高）
    //   'avoid'     → 避免事项（如 不爬山 / 不夜场）
    //   'transport' → 交通偏好（如 步行优先 / 自驾 / 公共交通）
    // 候选值由应用层（zod / LLM Prompt）校验，DB 不加 CHECK 约束
    key: text('key').notNull(),
    // 偏好的具体值，自由文本（由 LLM 提取或用户输入）
    value: text('value').notNull(),
    // LLM 提取置信度，0~1
    // 应用层规则：< 0.7 不入库，仅在当次会话临时使用（见 product-brief.md §合并规则）
    // 手动添加（source='manual'）固定写 1.0
    confidence: real('confidence').notNull().default(1.0),
    // 偏好来源：
    //   'chat_extracted' → LLM 从对话中自动提取（默认）
    //   'manual'         → 用户在设置页手动添加
    // 候选值由应用层校验
    source: text('source').notNull().default('chat_extracted'),
    // 首次写入时间
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    // 最近一次更新时间，upsert 覆盖旧值时刷新
    // 注意：Drizzle 不会自动维护这个字段，需要在 UPDATE 时显式设置 new Date()
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    // (user_id, key) 唯一约束：upsert 的依据
    // 写入时用 ON CONFLICT (user_id, key) DO UPDATE SET value=..., confidence=..., updated_at=now()
    uniqueIndex('user_preferences_user_key_uq').on(t.userId, t.key),
  ],
)
