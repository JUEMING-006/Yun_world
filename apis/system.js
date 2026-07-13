/**
 * 系统相关 API
 * 对应 Kuikly: LoginViewModel.getServerTime()
 *
 * 接口清单：
 * - GET /system/time   获取服务器时间
 * - GET /system/version 获取系统版本
 */

const { get } = require('../utils/request')
const { BASE_URL } = require('../utils/config')

/**
 * 获取服务器时间
 * 对应 Kuikly: LoginViewModel.getServerTime()
 * @returns {Promise<Object>} { timestamp: number }
 */
function getServerTime() {
  return get(`${BASE_URL}/system/time`)
}

/**
 * 获取系统版本
 * @returns {Promise<Object>}
 */
function getSystemVersion() {
  return get(`${BASE_URL}/system/version`)
}

module.exports = {
  getServerTime,
  getSystemVersion
}
