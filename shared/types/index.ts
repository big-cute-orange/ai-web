export interface User {
  id: number
  username: string
  nickname?: string | null
  avatarUrl?: string | null
  loginType?: string
  createdAt: string
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface JwtPayload {
  userId: number
}
