// app/middleware/auth.global.ts
const PUBLIC_PREFIXES = ['/auth/']

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('auth_token')
  const isPublic = PUBLIC_PREFIXES.some((p) => to.path.startsWith(p))

  // 未登录访问受保护页面 → 去登录，带上 redirect
  if (!token.value && !isPublic) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } }, { replace: true })
  }

  // 已登录还跑去登录页 → 回首页
  if (token.value && to.path === '/auth/login') {
    return navigateTo('/', { replace: true })
  }
})
