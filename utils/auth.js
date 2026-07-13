/**
 * Token 鉴权管理
 * 对应 Kuikly: LoginViewModel + BaseViewModel 中的 Token 存取逻辑
 *
 * Storage Key 与 Kuikly 保持一致，确保双端可互通
 */

const storage = require('./storage')
const { TOKEN_REFRESH_THRESHOLD_MS } = require('./config')

// Storage Keys — 与 Kuikly LoginViewModel.KEY_XXX 一致
const KEYS = {
  TOKEN: 'lumina_token',
  REFRESH_TOKEN: 'lumina_refresh_token',
  EXPIRES_AT: 'lumina_expires_at',
  LUMINA_ID: 'lumina_id',
  PASS_ID: 'pass_id',
  LOGIN_ACCOUNT: 'login_account'
}

/**
 * 获取当前 access_token
 */
function getToken() {
  return storage.get(KEYS.TOKEN)
}

/**
 * 获取当前 refresh_token
 */
function getRefreshToken() {
  return storage.get(KEYS.REFRESH_TOKEN)
}

/**
 * 获取 lumina_id
 */
function getLuminaId() {
  return storage.get(KEYS.LUMINA_ID)
}

/**
 * 获取 pass_id
 */
function getPassId() {
  return storage.get(KEYS.PASS_ID)
}

/**
 * 获取登录账号
 */
function getLoginAccount() {
  return storage.get(KEYS.LOGIN_ACCOUNT)
}

/**
 * 保存 Token 信息
 * 对应 Kuikly: LoginViewModel.saveToStorage()
 * @param {string} token access_token
 * @param {string} refreshToken refresh_token
 */
function saveToken(token, refreshToken) {
  storage.set(KEYS.TOKEN, token)
  if (refreshToken) {
    storage.set(KEYS.REFRESH_TOKEN, refreshToken)
  }
}

/**
 * 保存完整的登录信息
 * 对应 Kuikly: LoginViewModel.saveToStorage() + saveExpiresAt()
 * @param {Object} data
 * @param {string} data.token
 * @param {string} data.refreshToken
 * @param {string} data.lumina_id
 * @param {string} data.pass_id
 * @param {number} data.expires_in 过期时间（秒）
 * @param {string} data.account 登录账号
 */
function saveLoginData(data) {
  storage.set(KEYS.TOKEN, data.token || '')
  storage.set(KEYS.REFRESH_TOKEN, data.refreshToken || '')
  storage.set(KEYS.LUMINA_ID, data.lumina_id || '')
  storage.set(KEYS.PASS_ID, data.pass_id || '')
  storage.set(KEYS.LOGIN_ACCOUNT, data.account || '')

  if (data.expires_in) {
    const expiresAt = Date.now() + data.expires_in * 1000
    storage.set(KEYS.EXPIRES_AT, expiresAt.toString())
  }
}

/**
 * 单独保存 refreshToken（刷新时只更新这一个字段）
 * 对应 Kuikly: LoginViewModel.saveRefreshToken()
 */
function saveRefreshToken(refreshToken) {
  storage.set(KEYS.REFRESH_TOKEN, refreshToken)
}

/**
 * 保存 Token 过期时间戳（毫秒）
 * 对应 Kuikly: BaseViewModel.saveExpiresAt()
 * @param {number} expiresIn 过期时间（秒）
 */
function saveExpiresAt(expiresIn) {
  const expiresAt = Date.now() + expiresIn * 1000
  storage.set(KEYS.EXPIRES_AT, expiresAt.toString())
}

/**
 * 读取 Token 过期时间戳（毫秒），无则返回 0
 */
function getExpiresAt() {
  const val = storage.get(KEYS.EXPIRES_AT)
  return val ? parseInt(val, 10) : 0
}

/**
 * 判断 access_token 是否即将过期（剩余 < 5 分钟）
 * 对应 Kuikly: BaseViewModel.isTokenExpiringSoon()
 */
function isTokenExpiringSoon() {
  const expiresAt = getExpiresAt()
  if (expiresAt <= 0) return false
  const remaining = expiresAt - Date.now()
  return remaining < TOKEN_REFRESH_THRESHOLD_MS
}

/**
 * 是否已登录（token 非空）
 */
function isLoggedIn() {
  const token = getToken()
  return token && token.length > 0
}

/**
 * 清除所有登录状态
 * 对应 Kuikly: LoginViewModel.clearStorage()
 */
function clearAuth() {
  storage.set(KEYS.TOKEN, '')
  storage.set(KEYS.REFRESH_TOKEN, '')
  storage.set(KEYS.EXPIRES_AT, '')
  storage.set(KEYS.LUMINA_ID, '')
  storage.set(KEYS.PASS_ID, '')
  storage.set(KEYS.LOGIN_ACCOUNT, '')
  console.log('[Auth] 登录状态已清除')
}

module.exports = {
  getToken,
  getRefreshToken,
  getLuminaId,
  getPassId,
  getLoginAccount,
  saveToken,
  saveLoginData,
  saveRefreshToken,
  saveExpiresAt,
  getExpiresAt,
  isTokenExpiringSoon,
  isLoggedIn,
  clearAuth,
  KEYS
}
