interface User {
  id: number
  username: string
  nickname?: string
  avatarUrl?: string | null
  loginType?: string
  createdAt: string
}

export const useAuth = () => {
  const token = useCookie('auth_token')
  const currentUser = useState<User | null>('auth_user', () => null)
  const isLoading = useState('auth_loading', () => false)

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  const register = async (username: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '注册失败')
    }

    token.value = data.token
    currentUser.value = data.user

    return data.user
  }

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '登录失败')
    }

    token.value = data.token
    currentUser.value = data.user

    return data.user
  }

  const logout = () => {
    token.value = null
    currentUser.value = null
  }

  const fetchUser = async () => {
    if (!token.value) return

    isLoading.value = true

    try {
      const response = await authFetch('/api/auth/me')

      if (response.ok) {
        currentUser.value = await response.json()
      } else {
        // Token 无效，清除状态
        logout()
      }
    } catch {
      logout()
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    token,
    currentUser,
    isLoading,
    // 方法
    register,
    login,
    logout,
    fetchUser,
    authFetch,
  }
}
