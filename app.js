/**
 * Lumina 小程序入口
 * 对应 Kuikly: IndexScreen.kt — 启动时检查登录态，分发路由
 */
const auth = require('./utils/auth')

App({
  onLaunch() {
    // 微信小程序全局环境初始化
    console.log('[Lumina] App.onLaunch')
  },

  /**
   * 检查登录状态并跳转
   * 对应 Kuikly: IndexScreen.viewDidLoad() 中的逻辑
   * @returns {Promise<boolean>} 是否已登录
   */
  checkLoginAndRedirect() {
    return new Promise((resolve) => {
      const loggedIn = auth.isLoggedIn()
      if (!loggedIn) {
        // 未登录 → 跳转登录页
        wx.redirectTo({ url: '/pages/login/login' })
        resolve(false)
        return
      }

      // 已登录 → 尝试刷新 token 验证有效性
      const refreshApi = require('./apis/auth')
      refreshApi.refreshToken(auth.getRefreshToken())
        .then(() => {
          // Token 有效 → 进入聊天
          wx.redirectTo({ url: '/pages/chat/chat' })
          resolve(true)
        })
        .catch(() => {
          // Token 过期 → 跳转登录
          auth.clearAuth()
          wx.redirectTo({ url: '/pages/login/login' })
          resolve(false)
        })
    })
  },

  globalData: {
    // 全局用户信息（登录后填充）
    luminaId: '',
    passId: '',
    nickname: '',
    // 主题配置
    themeMode: 'LIGHT',
    accentColor: '#4A90D9',
    // 语言
    language: '简体中文'
  }
})
