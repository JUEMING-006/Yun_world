/**
 * 认证相关 API
 * 对应 Kuikly: LoginViewModel.kt
 *
 * 接口清单（从 Kuikly LoginViewModel.COMPANION 精确提取）：
 * - POST /pass/sign/send_code  发送验证码
 * - POST /pass/sign/code       验证码登录
 * - POST /pass/sign/lark       飞书登录
 * - POST /pass/sign/out        登出
 * - POST /pass/token/refresh   刷新 Token
 */

const { post, doRefreshToken } = require('../utils/request')
const { BASE_URL } = require('../utils/config')

// ── API 路径 ──
const API_SEND_CODE = `${BASE_URL}/pass/sign/send_code`
const API_SIGN_CODE = `${BASE_URL}/pass/sign/code`
const API_SIGN_LARK = `${BASE_URL}/pass/sign/lark`
const API_SIGN_OUT = `${BASE_URL}/pass/sign/out`
const API_REFRESH_TOKEN = `${BASE_URL}/pass/token/refresh`

/**
 * 发送验证码（公开接口，无需认证）
 * 对应 Kuikly: LoginViewModel.sendCode()
 * @param {string} account 手机号或邮箱
 * @param {string} mac 设备标识
 * @param {string} city 用户所在城市（可选）
 * @returns {Promise<Object>} { code: string } 开发环境返回的验证码
 */
function sendCode(account, mac = 'wx_miniprogram_001', city = '') {
  const body = { account, mac }
  if (city) body.city = city

  return post(API_SEND_CODE, body, { requiresAuth: false })
}

/**
 * 验证码登录（公开接口，无需认证）
 * 对应 Kuikly: LoginViewModel.signForCode()
 * @param {string} account 手机号或邮箱
 * @param {string} code 验证码
 * @param {string} city 用户所在城市（可选）
 * @returns {Promise<Object>} { token, refreshToken, expires_in, lumina_id, pass_id }
 */
function signForCode(account, code, city = '') {
  const body = { account, code }
  if (city) body.city = city

  return post(API_SIGN_CODE, body, { requiresAuth: false })
}

/**
 * 飞书登录 — 用授权码换取 token
 * 对应 Kuikly: LoginViewModel.signForLark()
 * @param {string} code 飞书授权码
 * @returns {Promise<Object>} { token, refreshToken, expires_in, lumina_id, pass_id }
 */
function signForLark(code) {
  return post(API_SIGN_LARK, { code }, { requiresAuth: false })
}

/**
 * 登出
 * 对应 Kuikly: LoginViewModel.logout()
 * @param {string} luminaId 用户 lumina_id
 * @param {string} mac 设备标识
 * @returns {Promise<Object>}
 */
function signOut(luminaId, mac = 'wx_miniprogram_001') {
  return post(API_SIGN_OUT, { lumina_id: luminaId, mac })
}

/**
 * 刷新 Token
 * 对应 Kuikly: LoginViewModel.refreshToken() + BaseViewModel.refreshTokenAndRetry()
 * @param {string} refreshTokenVal refresh_token 值
 * @returns {Promise<Object>} { token, refreshToken, expires_in }
 */
function refreshToken(refreshTokenVal) {
  return new Promise((resolve, reject) => {
    doRefreshToken()
      .then(() => resolve({ token: require('../utils/auth').getToken() }))
      .catch(err => reject(err))
  })
}

module.exports = {
  sendCode,
  signForCode,
  signForLark,
  signOut,
  refreshToken
}
