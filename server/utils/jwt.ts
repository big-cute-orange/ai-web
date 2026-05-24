import { SignJWT, jwtVerify } from 'jose'

const JWT_EXPIRES_IN = '7d'

const getSecret = (): Uint8Array => {
  const secret = useRuntimeConfig().jwtSecret
  if (!secret) throw new Error('NUXT_JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export const generateToken = async (userId: number): Promise<string> => {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getSecret())
}

export const verifyToken = async (token: string): Promise<{ userId: number } | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { userId: number }
  } catch {
    return null
  }
}
