/**
 * 入口页 — 纯逻辑中转页
 * 对应 Kuikly: IndexScreen.kt
 *
 * 功能：
 * 1. 检查登录状态
 * 2. Token 有效 → 跳转聊天页
 * 3. Token 无效 → 跳转登录页
 */
const auth = require('../../utils/auth')
const authApi = require('../../apis/auth')

Page({
  data: {},

  onLoad() {
    this.checkLogin()
  },

  checkLogin() {
    if (!auth.isLoggedIn()) {
      // 未登录 → 跳转登录页
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    // 已登录 → 刷新 Token 验证有效性
    wx.showLoading({ title: '加载中...' })

    authApi.refreshToken(auth.getRefreshToken())
      .then(() => {
        wx.hideLoading()
        wx.redirectTo({ url: '/pages/chat/chat' })
      })
      .catch(() => {
        wx.hideLoading()
        auth.clearAuth()
        wx.redirectTo({ url: '/pages/login/login' })
      })
  }
})
