import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

// ==================== 配置 ====================

// JWT 密钥（生产环境必须通过环境变量设置！）
const secretFromEnv = process.env.NUXT_JWT_SECRET
if (!secretFromEnv) {
  throw new Error(
    'JWT secret is not set! Please set NUXT_JWT_SECRET environment variable for production.',
  )
}

const JWT_SECRET = new TextEncoder().encode(secretFromEnv)

// Token 有效期（7 天）
const JWT_EXPIRES_IN = '7d'

// bcrypt 加密轮数（10 轮是安全与性能的平衡点）
const SALT_ROUNDS = 10

// ==================== 密码工具 ====================

/**
 * 对明文密码进行哈希加密
 * @param password 明文密码
 * @returns 哈希后的密码字符串
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * 验证密码是否正确
 * @param password 用户输入的明文密码
 * @param hash 数据库中存储的哈希密码
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ==================== JWT 工具 ====================

/**
 * 生成 JWT Token
 * @param userId 用户 ID
 * @returns JWT 字符串
 */
export async function generateToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

/**
 * 验证 JWT Token 并提取 payload
 * @param token JWT 字符串
 * @returns payload（包含 userId）或 null（无效/过期）
 */
export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: number }
  } catch {
    // Token 无效、过期、或被篡改时返回 null
    return null
  }
}
