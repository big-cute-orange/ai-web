const { wechatAppId, wechatAppSecret } = useRuntimeConfig()

interface WechatTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
}

interface WechatUserInfo {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid?: string
}

interface WechatError {
  errcode: number
  errmsg: string
}

/**
 * 生成微信 OAuth 授权页 URL
 */
export const getWechatAuthUrl = (redirectUri: string, state: string): string => {
  const params = new URLSearchParams({
    appid: wechatAppId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'snsapi_userinfo',
    state,
  })
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`
}

/**
 * 用 authorization code 换取 access_token 和 openid
 */
export const exchangeCodeForToken = async (code: string): Promise<WechatTokenResponse> => {
  const params = new URLSearchParams({
    appid: wechatAppId,
    secret: wechatAppSecret,
    code,
    grant_type: 'authorization_code',
  })

  const response: WechatTokenResponse | WechatError = await $fetch(
    `https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`,
    { parseResponse: (txt: string) => JSON.parse(txt) },
  )

  if ('errcode' in response && response.errcode !== 0) {
    throw createError({ statusCode: 400, message: `微信授权失败: ${response.errmsg}` })
  }

  return response as WechatTokenResponse
}

/**
 * 获取微信用户信息（昵称、头像等）
 */
export const getWechatUserInfo = async (
  accessToken: string,
  openid: string,
): Promise<WechatUserInfo> => {
  const params = new URLSearchParams({ access_token: accessToken, openid })

  const response: WechatUserInfo | WechatError = await $fetch(
    `https://api.weixin.qq.com/sns/userinfo?${params.toString()}`,
    { parseResponse: (txt: string) => JSON.parse(txt) },
  )

  if ('errcode' in response && response.errcode !== 0) {
    throw createError({ statusCode: 400, message: `获取微信用户信息失败: ${response.errmsg}` })
  }

  return response as WechatUserInfo
}

/**
 * 根据 openid 生成唯一用户名
 */
export const generateWechatUsername = (openid: string, existingUsernames: Set<string>): string => {
  const base = 'wx_' + openid.slice(-8).toLowerCase()
  let username = base
  let counter = 1
  while (existingUsernames.has(username)) {
    username = `${base}_${counter}`
    counter++
  }
  return username
}
