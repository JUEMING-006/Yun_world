/**
 * 用户信息相关 API
 * 对应 Kuikly: LoginViewModel.kt (getUserInfo, updateUserInfo) + SettingViewModel.kt
 *
 * 接口清单：
 * - POST /user/:luminaId     获取用户信息
 * - POST /user/update        更新用户信息
 * - POST /user/plan          获取用户套餐
 */

const { post, get } = require('../utils/request')
const { BASE_URL } = require('../utils/config')

/**
 * 获取用户信息（含隐私信息如 birthday）
 * 对应 Kuikly: LoginViewModel.getUserInfo()
 * @param {string} luminaId 用户 lumina_id
 * @returns {Promise<Object>} { userId, nickname, birthday, gender, avatarUrl, province, bio }
 */
function getUserInfo(luminaId) {
  return post(`${BASE_URL}/user/${luminaId}`, {}, { requiresAuth: true })
}

/**
 * 获取用户公开信息
 * 对应 Kuikly: SettingViewModel.fetchUserPublicInfo()
 * @param {string} userId
 * @returns {Promise<Object>} { nickname, gender, avatarUrl, province, bio }
 */
function fetchUserPublicInfo(userId) {
  return post(`${BASE_URL}/user/${userId}`, {})
}

/**
 * 更新用户信息
 * 对应 Kuikly: LoginViewModel.updateUserInfo()
 * @param {Object} data
 * @param {string} data.nickname 昵称
 * @param {string} data.birthday 生日 YYYY-MM-DD
 * @param {string} data.gender 性别 male/female/unknown
 * @param {string} data.bio 个人简介
 * @returns {Promise<Object>}
 */
function updateUserInfo(data) {
  const body = {}
  if (data.nickname) body.nickname = data.nickname
  if (data.birthday) body.birthday = data.birthday
  if (data.gender) body.gender = data.gender
  if (data.bio) body.bio = data.bio
  if (data.ip) body.ip = data.ip

  return post(`${BASE_URL}/user/update`, body)
}

/**
 * 获取用户套餐
 * 对应 Kuikly: SettingViewModel.fetchUserPlan()
 * @returns {Promise<Object>} { planId, planName, startDate, endDate, features, status }
 */
function getUserPlan() {
  return post(`${BASE_URL}/user/plan`, {})
}

module.exports = {
  getUserInfo,
  fetchUserPublicInfo,
  updateUserInfo,
  getUserPlan
}
