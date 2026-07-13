/**
 * API 环境配置
 * 对应 Kuikly: shared/.../base/ApiConfig.kt
 *
 * 小程序必须使用完整绝对 URL（无 devServer proxy）
 */

const secrets = require('./secrets')

// 业务接口基地址（/v2 前缀）
const BASE_URL = secrets.BASE_URL

// Agent/AI 接口基地址（/v1o5 前缀）
const AGENT_BASE_URL = secrets.AGENT_BASE_URL

// CDN 基地址（大资源走 CDN，避免包体积超限）
const CDN_BASE_URL = 'https://cdn.lumina.example.com'

// Token 主动刷新阈值：5 分钟
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000

// 飞书开放平台配置
const LARK_APP_ID = secrets.LARK_APP_ID
const LARK_SERVER = 'https://open.feishu.cn'

/**
 * 获取 CDN 资源 URL
 * 小程序始终走 CDN（无 assets:// 机制）
 * @param {string} path 资源路径，如 "Interact.gif"
 * @returns {string} 完整 URL
 */
function cdnAssetUrl(path) {
  return `${CDN_BASE_URL}/${path}`
}

/**
 * 切换环境（开发阶段默认使用 production）
 * @param {'dev'|'test'|'production'} env
 */
function setEnvironment(env) {
  // 目前小程序只有 production 地址，后续可扩展
  console.log('[Config] 环境切换:', env)
}

module.exports = {
  BASE_URL,
  AGENT_BASE_URL,
  CDN_BASE_URL,
  TOKEN_REFRESH_THRESHOLD_MS,
  LARK_APP_ID,
  LARK_SERVER,
  cdnAssetUrl,
  setEnvironment
}
