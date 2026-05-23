import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

// ==================== 配置 ====================

const secretFromEnv = process.env.NUXT_JWT_SECRET
if (!secretFromEnv) {
  throw new Error('JWT secret is not set! Please set NUXT_JWT_SECRET environment variable.')
}

const JWT_SECRET = new TextEncoder().encode(secretFromEnv)
const JWT_EXPIRES_IN = '7d'
const SALT_ROUNDS = 10

// ==================== 密码工具 ====================

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// ==================== JWT 工具 ====================

export const generateToken = async (userId: number): Promise<string> => {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

export const verifyToken = async (token: string): Promise<{ userId: number } | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: number }
  } catch {
    return null
  }
}
