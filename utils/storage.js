/**
 * wx.storage 封装
 * 对应 Kuikly: SharedPreferencesModule
 */

/**
 * 获取存储值
 * @param {string} key
 * @returns {string} 值，不存在返回空字符串
 */
function get(key) {
  try {
    return wx.getStorageSync(key) || ''
  } catch (e) {
    console.error('[Storage] get error:', key, e)
    return ''
  }
}

/**
 * 设置存储值
 * @param {string} key
 * @param {string|number|boolean|object} value
 */
function set(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (e) {
    console.error('[Storage] set error:', key, e)
  }
}

/**
 * 删除指定 key
 * @param {string} key
 */
function remove(key) {
  try {
    wx.removeStorageSync(key)
  } catch (e) {
    console.error('[Storage] remove error:', key, e)
  }
}

/**
 * 清除所有存储
 */
function clear() {
  try {
    wx.clearStorageSync()
  } catch (e) {
    console.error('[Storage] clear error:', e)
  }
}

/**
 * 获取数值类型的存储值
 * @param {string} key
 * @param {number} defaultValue
 * @returns {number}
 */
function getInt(key, defaultValue = 0) {
  const val = get(key)
  if (val === '') return defaultValue
  const num = parseInt(val, 10)
  return isNaN(num) ? defaultValue : num
}

/**
 * 获取布尔类型的存储值
 * @param {string} key
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
function getBool(key, defaultValue = false) {
  const val = get(key)
  if (val === '') return defaultValue
  return val === 'true' || val === true
}

module.exports = { get, set, remove, clear, getInt, getBool }
