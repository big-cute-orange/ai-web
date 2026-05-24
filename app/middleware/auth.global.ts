export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('auth_token')

  const publicRoutes = ['/auth/login']

  if (!token.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/auth/login')
  }
})
